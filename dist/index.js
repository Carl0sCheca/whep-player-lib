const m = async (d = 5e3) => new Promise((t) => setTimeout(t, d)), D = ({
  url: d,
  video: t
}) => {
  const c = new EventTarget();
  let e, r = !0, i = 0, o = 0;
  t.addEventListener("play", async () => {
    [
      0,
      1,
      2,
      7,
      5
      /* STREAM_DISCONNECTED */
    ].includes(i) && (!e || e.iceConnectionState !== "connected") && (await u(), i = 3, await l());
  }), t.addEventListener("pause", async () => {
    i = 2;
  });
  const w = async () => {
    (e == null ? void 0 : e.connectionState) === "failed" ? (c.dispatchEvent(new Event(
      "player_error"
      /* ERROR */
    )), i = 6, e && e.close()) : (e == null ? void 0 : e.connectionState) === "connected" ? (i = 4, c.dispatchEvent(new Event(
      "connected"
      /* CONNECTED */
    ))) : (e == null ? void 0 : e.connectionState) === "disconnected" && (i = 5, c.dispatchEvent(new Event(
      "disconnected"
      /* DISCONNECTED */
    )), await f());
  }, y = async (n) => {
    for (const a of n.streams)
      if (a.id !== "feedbackvideomslabel") {
        !t.srcObject && !t.paused && (t.srcObject = new MediaStream());
        for (const s of a.getTracks())
          t.srcObject.addTrack(s);
      }
  }, p = async (n) => {
    n.type !== "icecandidate" || n.candidate;
  }, l = async () => {
    if (!e)
      return;
    const n = e.localDescription;
    if (!n || e.signalingState !== "have-local-offer")
      return;
    let a;
    const s = 5;
    for (; !t.paused && !(a != null && a.ok) && o < s; )
      if (a = await fetch(d, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp"
        },
        body: n.sdp
      }), a != null && a.ok) {
        const b = await a.text();
        await e.setRemoteDescription({
          type: "answer",
          sdp: b
        }), o = 0;
      } else
        await m(), o++;
    o >= s && (i = 7, c.dispatchEvent(new Event(
      "retries_exceeded"
      /* RETRIES_EXCEEDED */
    )), t.srcObject = new MediaStream(), t.pause(), e && e.restartIce(), e && e.close()), o = 0;
  }, h = async () => {
    (e == null ? void 0 : e.iceGatheringState) === "complete" || !r || e && await E();
  }, E = async () => {
    r = !1;
  }, g = async () => {
    e == null || e.addTransceiver("video", { direction: "recvonly" }), e == null || e.addTransceiver("audio", { direction: "recvonly" });
    const n = await (e == null ? void 0 : e.createOffer({
      offerToReceiveAudio: !0,
      offerToReceiveVideo: !0
    }));
    if (e && n != null && n.sdp) {
      const a = n.sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
      a !== null && (n.sdp = n.sdp.replace(
        `opus/48000/2\r
`,
        `opus/48000/2\r
a=rtcp-fb:` + a[1] + ` nack\r
`
      ));
    }
    await (e == null ? void 0 : e.setLocalDescription(n));
  }, u = async () => {
    e && (e.close(), e.onconnectionstatechange = null, e.onicegatheringstatechange = null, e.onicecandidate = null, e = null), e = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    }), e.onconnectionstatechange = w.bind(void 0), e.onicegatheringstatechange = h.bind(void 0), e.onicecandidate = p.bind(void 0), e.ontrack = y.bind(void 0);
    try {
      await g();
    } catch {
    }
  }, v = async () => {
    try {
      await t.play();
    } catch {
      i = 1, c.dispatchEvent(new Event(
        "autoplay_disabled"
        /* AUTOPLAYDISABLED */
      )), t.srcObject = new MediaStream(), t.pause();
    }
  }, f = async () => {
    i === 5 && (await u(), t.srcObject = new MediaStream(), await l()), await v();
  };
  return {
    load: f,
    unload: async () => {
      e && (e.onconnectionstatechange = null, e.onicegatheringstatechange = null, e.onicecandidate = null, e.close(), e = null), i = 5, c.dispatchEvent(new Event(
        "disconnected"
        /* DISCONNECTED */
      ));
    },
    onConnected: (n) => {
      c.addEventListener("connected", n);
    },
    onDisabledAutoplay: (n) => {
      c.addEventListener("autoplay_disabled", n);
    },
    onError: (n) => {
      c.addEventListener("player_error", n);
    },
    onRetriesExceeded: (n) => {
      c.addEventListener("retries_exceeded", n);
    },
    onDisconnected: (n) => {
      c.addEventListener("disconnected", n);
    }
  };
};
export {
  D as WhepPlayerInstance
};
