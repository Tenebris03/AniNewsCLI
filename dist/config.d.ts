import { TrackedShow } from "./types.js";
export declare function loadTracked(): Record<number, TrackedShow>;
export declare function saveTracked(tracked: Record<number, TrackedShow>): void;
export declare function isTracked(mediaId: number): boolean;
export declare function addTrackedShow(mediaId: number, title: string): void;
export declare function removeTrackedShow(mediaId: number): void;
