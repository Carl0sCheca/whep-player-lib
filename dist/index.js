const m = async (d = 5e3) => new Promise((n) => setTimeout(n, d)), k = ({ url: d, video: n }) => {
  const i = new EventTarget();
  let t, r = !0, c = 0, o = 0;
  n.addEventListener("play", async () => {
    [
      0,
      1,
      2,
      7,
      5
      /* STREAM_DISCONNECTED */
    ].includes(c) && (!t || t.iceConnectionState !== "connected") && (await f(), c = 3, await l());
  }), n.addEventListener("pause", async () => {
    c = 2;
  });
  const w = async () => {
    (t == null ? void 0 : t.connectionState) === "failed" ? (i.dispatchEvent(new Event(
      "player_error"
      /* ERROR */
    )), c = 6, t && t.close()) : (t == null ? void 0 : t.connectionState) === "connected" ? (c = 4, i.dispatchEvent(new Event(
      "connected"
      /* CONNECTED */
    ))) : (t == null ? void 0 : t.connectionState) === "disconnected" && (c = 5, i.dispatchEvent(new Event(
      "disconnected"
      /* DISCONNECTED */
    )), await u());
  }, y = async (e) => {
    for (const a of e.streams)
      if (a.id !== "feedbackvideomslabel") {
        !n.srcObject && !n.paused && (n.srcObject = new MediaStream());
        for (const s of a.getTracks())
          n.srcObject.addTrack(s);
      }
  }, p = async (e) => {
    e.type !== "icecandidate" || e.candidate;
  }, l = async () => {
    if (!t)
      return;
    const e = t.localDescription;
    if (!e || t.signalingState !== "have-local-offer")
      return;
    let a;
    const s = 5;
    for (; !n.paused && !(a != null && a.ok) && o < s; )
      if (a = await fetch(d, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp"
        },
        body: e.sdp
      }), a != null && a.ok) {
        const b = await a.text();
        await t.setRemoteDescription({
          type: "answer",
          sdp: b
        }), o = 0;
      } else
        await m(), o++;
    o >= s && (c = 7, i.dispatchEvent(new Event(
      "retries_exceeded"
      /* RETRIES_EXCEEDED */
    )), n.srcObject = new MediaStream(), n.pause(), t && t.restartIce(), t && t.close()), o = 0;
  }, h = async () => {
    (t == null ? void 0 : t.iceGatheringState) === "complete" || !r || t && await g();
  }, g = async () => {
    r = !1;
  }, v = async () => {
    t == null || t.addTransceiver("video", { direction: "recvonly" }), t == null || t.addTransceiver("audio", { direction: "recvonly" });
    const e = await (t == null ? void 0 : t.createOffer({
      offerToReceiveAudio: !0,
      offerToReceiveVideo: !0
    }));
    if (t && e != null && e.sdp) {
      const a = e.sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
      a !== null && (e.sdp = e.sdp.replace(
        `opus/48000/2\r
`,
        `opus/48000/2\r
a=rtcp-fb:` + a[1] + ` nack\r
`
      ));
    }
    await (t == null ? void 0 : t.setLocalDescription(e));
  }, f = async () => {
    t && (t.close(), t.onconnectionstatechange = null, t.onicegatheringstatechange = null, t.onicecandidate = null, t = null), t = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    }), t.onconnectionstatechange = w.bind(void 0), t.onicegatheringstatechange = h.bind(void 0), t.onicecandidate = p.bind(void 0), t.ontrack = y.bind(void 0);
    try {
      await v();
    } catch {
    }
  }, E = async () => {
    try {
      await n.play();
    } catch {
      c = 1, i.dispatchEvent(new Event(
        "autoplay_disabled"
        /* AUTOPLAYDISABLED */
      )), n.srcObject = new MediaStream(), n.pause();
    }
  }, u = async () => {
    c === 5 && (await f(), n.srcObject = new MediaStream(), await l()), await E();
  };
  return {
    load: u,
    onConnected: (e) => {
      i.addEventListener("connected", e);
    },
    onDisabledAutoplay: (e) => {
      i.addEventListener("autoplay_disabled", e);
    },
    onError: (e) => {
      i.addEventListener("player_error", e);
    }
  };
};
export {
  k as WhepPlayer
};
