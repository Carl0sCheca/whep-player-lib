import "./style.css";
import { WhepPlayerInstance } from "../lib/WhepPlayer.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <video controls autoplay muted id="player" />
  </div>
  <button id="loadbutton">play</button>
  <button id="unloadbutton">unload</button>
`;

(async () => {
const video = document.querySelector<HTMLVideoElement>("#player")!;

  const player = WhepPlayerInstance({
  video,
  url: "https://url/whep",
});

player.onError(() => {
  console.log("error");
});

  await player.load();

  const loadbutton = document.querySelector<HTMLButtonElement>("#loadbutton")!;
  const unloadbutton =
    document.querySelector<HTMLButtonElement>("#unloadbutton")!;

  loadbutton.onclick = async () => {
    await video.play();
};

  unloadbutton.onclick = async () => {
    await player.unload();
  };
})();
