export type WhepPlayer = {
    load(): Promise<void>;
    unload(): Promise<void>;
    onError(callback: (event: Event) => void): void;
    onConnected(callback: (event: Event) => void): void;
    onRetriesExceeded(callback: (event: Event) => void): void;
    onDisabledAutoplay(callback: (event: Event) => void): void;
    onDisconnected(callback: (event: Event) => void): void;
};
type WhepPlayerOptions = {
    url: string;
    video: HTMLVideoElement;
};
export declare const WhepPlayerInstance: ({ url, video, }: WhepPlayerOptions) => WhepPlayer;
export {};
