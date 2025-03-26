type WhepPlayer = {
    load(): void;
    onError(callback: (event: Event) => void): void;
    onConnected(callback: (event: Event) => void): void;
    onDisabledAutoplay(callback: (event: Event) => void): void;
};
type WhepPlayerOptions = {
    url: string;
    video: HTMLVideoElement;
};
export declare const WhepPlayer: ({ url, video }: WhepPlayerOptions) => WhepPlayer;
export {};
