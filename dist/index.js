const m = async (d = 5e3) => new Promise((n) => setTimeout(n, d)), O = ({
  url: d,
  video: n
}) => {
  const c = new EventTarget();
  let e, r = !0, i = 0, o = 0;
  n.addEventListener("play", async () => {
    [
      0,
      1,
      2,
      7,
      5
      /* STREAM_DISCONNECTED */
    ].includes(i) && (!e || e.iceConnectionState !== "connected") && (await f(), i = 3, await l());
  }), n.addEventListener("pause", async () => {
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
    )), await u());
  }, y = async (t) => {
    for (const a of t.streams)
      if (a.id !== "feedbackvideomslabel") {
        !n.srcObject && !n.paused && (n.srcObject = new MediaStream());
        for (const s of a.getTracks())
          n.srcObject.addTrack(s);
      }
  }, p = async (t) => {
    t.type !== "icecandidate" || t.candidate;
  }, l = async () => {
    if (!e)
      return;
    const t = e.localDescription;
    if (!t || e.signalingState !== "have-local-offer")
      return;
    let a;
    const s = 5;
    for (; !n.paused && !(a != null && a.ok) && o < s; )
      if (a = await fetch(d, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp"
        },
        body: t.sdp
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
    )), n.srcObject = new MediaStream(), n.pause(), e && e.restartIce(), e && e.close()), o = 0;
  }, h = async () => {
    (e == null ? void 0 : e.iceGatheringState) === "complete" || !r || e && await E();
  }, E = async () => {
    r = !1;
  }, g = async () => {
    e == null || e.addTransceiver("video", { direction: "recvonly" }), e == null || e.addTransceiver("audio", { direction: "recvonly" });
    const t = await (e == null ? void 0 : e.createOffer({
      offerToReceiveAudio: !0,
      offerToReceiveVideo: !0
    }));
    if (e && t != null && t.sdp) {
      const a = t.sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
      a !== null && (t.sdp = t.sdp.replace(
        `opus/48000/2\r
`,
        `opus/48000/2\r
a=rtcp-fb:` + a[1] + ` nack\r
`
      ));
    }
    await (e == null ? void 0 : e.setLocalDescription(t));
  }, f = async () => {
    e && (e.close(), e.onconnectionstatechange = null, e.onicegatheringstatechange = null, e.onicecandidate = null, e = null), e = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    }), e.onconnectionstatechange = w.bind(void 0), e.onicegatheringstatechange = h.bind(void 0), e.onicecandidate = p.bind(void 0), e.ontrack = y.bind(void 0);
    try {
      await g();
    } catch {
    }
  }, v = async () => {
    try {
      await n.play();
    } catch {
      i = 1, c.dispatchEvent(new Event(
        "autoplay_disabled"
        /* AUTOPLAYDISABLED */
      )), n.srcObject = new MediaStream(), n.pause();
    }
  }, u = async () => {
    i === 5 && (await f(), n.srcObject = new MediaStream(), await l()), await v();
  };
  return {
    load: u,
    onConnected: (t) => {
      c.addEventListener("connected", t);
    },
    onDisabledAutoplay: (t) => {
      c.addEventListener("autoplay_disabled", t);
    },
    onError: (t) => {
      c.addEventListener("player_error", t);
    },
    onRetriesExceeded: (t) => {
      c.addEventListener("retries_exceeded", t);
    }
  };
};
export {
  O as WhepPlayerInstance
};
