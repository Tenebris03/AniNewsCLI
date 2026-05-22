import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { TrackedConfig, TrackedShow } from "./types.js";

const CONFIG_DIR = resolve(homedir(), ".config", "aninews");
const CONFIG_PATH = resolve(CONFIG_DIR, "tracked.json");

function ensureConfig(): TrackedConfig {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!existsSync(CONFIG_PATH)) {
    const empty: TrackedConfig = { tracked: {} };
    writeFileSync(CONFIG_PATH, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as TrackedConfig;
}

export function loadTracked(): Record<number, TrackedShow> {
  return ensureConfig().tracked;
}

export function saveTracked(
  tracked: Record<number, TrackedShow>
): void {
  const config: TrackedConfig = { tracked };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function isTracked(mediaId: number): boolean {
  const tracked = loadTracked();
  return mediaId in tracked;
}

export function addTrackedShow(mediaId: number, title: string): void {
  const tracked = loadTracked();
  tracked[mediaId] = {
    mediaId,
    title,
    addedAt: new Date().toISOString(),
  };
  saveTracked(tracked);
}

export function removeTrackedShow(mediaId: number): void {
  const tracked = loadTracked();
  delete tracked[mediaId];
  saveTracked(tracked);
}
