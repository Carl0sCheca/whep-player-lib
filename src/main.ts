import "./style.css";
import { WhepPlayer } from "../lib/WhepPlayer.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <video controls autoplay muted id="player" />
  </div>
  <button id="button">play</button>
`;

const video = document.querySelector<HTMLVideoElement>("#player")!;

const player = WhepPlayer({
  video,
  url: "https://url/whep",
});

player.onError(() => {
  console.log("error");
});

player.load();

const button = document.querySelector<HTMLButtonElement>("button")!;

button.onclick = () => {
  video.play();
};
