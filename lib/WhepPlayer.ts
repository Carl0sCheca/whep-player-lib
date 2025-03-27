type WhepPlayer = {
  load(): void;
  onError(callback: (event: Event) => void): void;
  onConnected(callback: (event: Event) => void): void;
  onRetriesExceeced(callback: (event: Event) => void): void;
  onDisabledAutoplay(callback: (event: Event) => void): void;
};

type WhepPlayerOptions = {
  url: string;
  video: HTMLVideoElement;
};

enum PlayerEvents {
  ERROR = "player_error",
  RETRIES_EXCEEDED = "retries_exceeded",
  FAILED = "failed",
  AUTOPLAYDISABLED = "autoplay_disabled",
  DISCONNECTED = "disconnected",
  CONNECTED = "connected",
  CONNECTING = "connecting",
}

enum WhepPlayerStatus {
  STREAM_INIT,
  STREAM_AUTOPLAYDISABLED,
  STREAM_PAUSED,
  STREAM_CONNECTING,
  STREAM_CONNECTED,
  STREAM_DISCONNECTED,
  STREAM_FAILED,
  STREAM_RETRIESEXCEEDED,
}

const wait = async (delay: number = 5000): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export const WhepPlayer = ({ url, video }: WhepPlayerOptions): WhepPlayer => {
  const eventTarget = new EventTarget();

  let peer: RTCPeerConnection | null;
  let waitingForCandidates = true;
  let playerStatus = WhepPlayerStatus.STREAM_INIT;

  let retries = 0;

  video.addEventListener("play", async () => {
    if (
      [
        WhepPlayerStatus.STREAM_INIT,
        WhepPlayerStatus.STREAM_AUTOPLAYDISABLED,
        WhepPlayerStatus.STREAM_PAUSED,
        WhepPlayerStatus.STREAM_RETRIESEXCEEDED,
        WhepPlayerStatus.STREAM_DISCONNECTED,
      ].includes(playerStatus)
    ) {
      if (!peer || peer.iceConnectionState !== "connected") {
        await initPeer();
        playerStatus = WhepPlayerStatus.STREAM_CONNECTING;
        await sendOffer();
      }
    }
  });

  video.addEventListener("pause", async () => {
    playerStatus = WhepPlayerStatus.STREAM_PAUSED;
  });

  const onConnectionStateChange = async () => {
    // console.log("Connection state:", peer?.connectionState);
    if (peer?.connectionState === "failed") {
      eventTarget.dispatchEvent(new Event(PlayerEvents.ERROR));
      playerStatus = WhepPlayerStatus.STREAM_FAILED;
      peer && peer.close();
    } else if (peer?.connectionState === "connected") {
      playerStatus = WhepPlayerStatus.STREAM_CONNECTED;
      eventTarget.dispatchEvent(new Event(PlayerEvents.CONNECTED));
    } else if (peer?.connectionState === "disconnected") {
      playerStatus = WhepPlayerStatus.STREAM_DISCONNECTED;
      eventTarget.dispatchEvent(new Event(PlayerEvents.DISCONNECTED));
      await load();
    }
  };

  const onTrack = async (event: RTCTrackEvent) => {
    for (const stream of event.streams) {
      if (stream.id === "feedbackvideomslabel") {
        continue;
      }

      // console.log(
      //   "Set video element remote stream to " + stream.id,
      //   " audio " +
      //     stream.getAudioTracks().length +
      //     " video " +
      //     stream.getVideoTracks().length
      // );

      if (!video.srcObject && !video.paused) {
        video.srcObject = new MediaStream();
      }

      for (const track of stream.getTracks()) {
        (video.srcObject as MediaStream).addTrack(track);
      }
    }
  };

  const onIceCandidate = async (event: Event) => {
    if (event.type !== "icecandidate") {
      return;
    }

    const candidateEvent = <RTCPeerConnectionIceEvent>event;

    const candidate: RTCIceCandidate | null = candidateEvent.candidate;

    if (!candidate) {
      return;
    }
  };

  const sendOffer = async () => {
    if (!peer) {
      // console.log("Local RTC peer not initialized");
      return;
    }

    const offer = peer.localDescription;

    if (!offer) {
      // console.log("Local RTC peer has no offer");
      return;
    }

    if (peer.signalingState !== "have-local-offer") {
      // console.log("Have not local offer");
      return;
    }

    // console.log("Sending offer");

    let response: Response | undefined = undefined;

    const maxRetries = 5;

    while (!video.paused && !response?.ok && retries < maxRetries) {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (response?.ok) {
        const answer = await response.text();

        await peer.setRemoteDescription({
          type: "answer",
          sdp: answer,
        });

        retries = 0;
      } else {
        await wait();
        retries++;
      }
    }

    if (retries >= maxRetries) {
      playerStatus = WhepPlayerStatus.STREAM_RETRIESEXCEEDED;
      eventTarget.dispatchEvent(new Event(PlayerEvents.RETRIES_EXCEEDED));

      video.srcObject = new MediaStream();
      video.pause();

      peer && peer.restartIce();
      peer && peer.close();
    }

    retries = 0;
  };

  const onIceGatheringStateChange = async () => {
    if (peer?.iceGatheringState === "complete" || !waitingForCandidates) {
      return;
    }

    if (peer) {
      // console.log("IceGatheringState", peer.iceGatheringState);
      await onDoneWaitingForCandidates();
    }
  };

  const onDoneWaitingForCandidates = async () => {
    waitingForCandidates = false;
  };

  const initSdpExchange = async () => {
    peer?.addTransceiver("video", { direction: "recvonly" });
    peer?.addTransceiver("audio", { direction: "recvonly" });

    const offer = await peer?.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    if (peer) {
      if (offer?.sdp) {
        const opusCodecId = offer.sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
        if (opusCodecId !== null) {
          offer.sdp = offer.sdp.replace(
            "opus/48000/2\r\n",
            "opus/48000/2\r\na=rtcp-fb:" + opusCodecId[1] + " nack\r\n"
          );
        }
      }
    }

    await peer?.setLocalDescription(offer);
  };

  const initPeer = async () => {
    if (peer) {
      peer.close();
      peer.onconnectionstatechange = null;
      peer.onicegatheringstatechange = null;
      peer.onicecandidate = null;
      peer = null;
    }

    peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onconnectionstatechange = onConnectionStateChange.bind(this);
    peer.onicegatheringstatechange = onIceGatheringStateChange.bind(this);
    peer.onicecandidate = onIceCandidate.bind(this);
    peer.ontrack = onTrack.bind(this);

    try {
      await initSdpExchange();
    } catch {}
  };

  const play = async () => {
    try {
      await video.play();
    } catch {
      playerStatus = WhepPlayerStatus.STREAM_AUTOPLAYDISABLED;
      eventTarget.dispatchEvent(new Event(PlayerEvents.AUTOPLAYDISABLED));
      video.srcObject = new MediaStream();
      video.pause();
    }
  };

  const load = async () => {
    if (playerStatus === WhepPlayerStatus.STREAM_DISCONNECTED) {
      await initPeer();
      video.srcObject = new MediaStream();
      await sendOffer();
    }

    await play();
  };

  const onError = (callback: (event: Event) => void) => {
    eventTarget.addEventListener(PlayerEvents.ERROR, callback);
  };

  const onDisabledAutoplay = (callback: (event: Event) => void) => {
    eventTarget.addEventListener(PlayerEvents.AUTOPLAYDISABLED, callback);
  };

  const onConnected = (callback: (event: Event) => void) => {
    eventTarget.addEventListener(PlayerEvents.CONNECTED, callback);
  };

  const onRetriesExceeced = (callback: (event: Event) => void) => {
    eventTarget.addEventListener(PlayerEvents.RETRIES_EXCEEDED, callback);
  };

  return {
    load,
    onConnected,
    onDisabledAutoplay,
    onError,
    onRetriesExceeced,
  };
};
