import { AiringSchedule, CurrentlyAiringMedia } from "./types.js";
export declare function fetchSchedule(date: Date): Promise<AiringSchedule[]>;
export declare function fetchCurrentlyAiring(): Promise<CurrentlyAiringMedia[]>;
