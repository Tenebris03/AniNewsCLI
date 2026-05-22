import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import { CurrentlyAiringMedia, TrackedShow } from "./types.js";
import { isTracked, addTrackedShow, removeTrackedShow } from "./config.js";

const UP = "\x1b[A";
const DOWN = "\x1b[B";
const UP_ALT = "\x1bOA";
const DOWN_ALT = "\x1bOB";

function getDisplayTitle(m: CurrentlyAiringMedia): string {
  return m.title.english ?? m.title.romaji;
}

function formatNextEpisode(m: CurrentlyAiringMedia): string {
  if (!m.nextAiringEpisode) return chalk.gray("TBA");
  const ep = m.nextAiringEpisode.episode;
  const date = new Date(m.nextAiringEpisode.airingAt * 1000);
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const total = m.episodes && m.episodes > 0 ? `/${m.episodes}` : "";
  return chalk.dim(`Ep ${ep}${total} — ${time}`);
}

function getFormatLabel(format: string): string {
  switch (format) {
    case "TV":
      return chalk.blue("TV");
    case "TV_SHORT":
      return chalk.cyan("TVS");
    case "MOVIE":
      return chalk.magenta("MOV");
    case "OVA":
      return chalk.yellow("OVA");
    case "ONA":
      return chalk.green("ONA");
    default:
      return format;
  }
}

function renderList(
  media: CurrentlyAiringMedia[],
  tracked: Set<number>,
  selectedIdx: number,
  offset: number,
  visibleCount: number
): string {
  const lines: string[] = [];
  const header =
    chalk.bold.cyan("  Track Anime — ") +
    chalk.white("navigate with ") +
    chalk.yellow("↑↓") +
    chalk.white(", ") +
    chalk.yellow("space") +
    chalk.white(" to toggle, ") +
    chalk.yellow("enter") +
    chalk.white(" to save, ") +
    chalk.yellow("q") +
    chalk.white(" to quit") +
    "\n" +
    chalk.dim(
      "  ─────────────────────────────────────────────────────────────────"
    ) +
    "\n";

  lines.push(header);

  const end = Math.min(offset + visibleCount, media.length);

  for (let i = offset; i < end; i++) {
    const m = media[i];
    const isSelected = i === selectedIdx;
    const isTracked = tracked.has(m.id);

    const prefix = isSelected
      ? chalk.bgCyan.black(" ")
      : " ";
    const checkbox = isTracked ? chalk.green("✓") : chalk.dim("○");
    const title = getDisplayTitle(m);
    const truncated =
      title.length > 42 ? title.slice(0, 39) + "..." : title.padEnd(42);
    const fmt = getFormatLabel(m.format);
    const nextEp = formatNextEpisode(m);

    const line =
      ` ${prefix}${checkbox} ${truncated} ${chalk.dim("│")} ${fmt} ${chalk.dim("│")} ${nextEp}`;

    if (isSelected) {
      lines.push(`\x1b[46m\x1b[30m${line}\x1b[0m`);
    } else {
      lines.push(line);
    }
  }

  if (media.length > visibleCount) {
    const scrollHint = chalk.dim(
      `\n  ── ${offset + 1}-${end} of ${media.length} — ↑↓ to scroll`
    );
    lines.push(scrollHint);
  }

  if (offset + visibleCount < media.length) {
    lines.push(chalk.dim("  ↓ more below"));
  }
  if (offset > 0) {
    lines.unshift(chalk.dim("  ↑ more above"));
  }

  lines.push(
    "\n" +
      chalk.dim("  ─────────────────────────────────────────────────────────────────")
  );
  lines.push(
    chalk.dim(
      `  ${tracked.size} tracked  |  ${media.length} currently airing  |  Data from AniList`
    )
  );

  return lines.join("\n");
}

function clearScreen(): void {
  stdout.write("\x1b[2J\x1b[H");
}

function getVisibleCount(): number {
  return (stdout.rows || 24) - 10;
}

export async function runTrackingUI(
  media: CurrentlyAiringMedia[]
): Promise<void> {
  const trackedSet = new Set<number>();
  for (const m of media) {
    if (isTracked(m.id)) trackedSet.add(m.id);
  }

  let selectedIdx = 0;
  let offset = 0;
  let running = true;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf-8");

  stdout.write("\x1b[?25l");

  function render(): void {
    clearScreen();
    const visibleCount = getVisibleCount();

    if (selectedIdx < offset) offset = selectedIdx;
    if (selectedIdx >= offset + visibleCount) offset = selectedIdx - visibleCount + 1;
    if (offset < 0) offset = 0;

    const frame = renderList(media, trackedSet, selectedIdx, offset, visibleCount);
    stdout.write(frame);
  }

  function finalize(): void {
    const newTracked: {
      added: string[];
      removed: string[];
    } = { added: [], removed: [] };

    for (const m of media) {
      const wasTracked = taggedForComparison.has(m.id);
      const nowTracked = trackedSet.has(m.id);

      if (!wasTracked && nowTracked) {
        addTrackedShow(m.id, getDisplayTitle(m));
        newTracked.added.push(getDisplayTitle(m));
      } else if (wasTracked && !nowTracked) {
        removeTrackedShow(m.id);
        newTracked.removed.push(getDisplayTitle(m));
      }
    }

    if (newTracked.added.length === 0 && newTracked.removed.length === 0) {
      console.log(chalk.dim("\n  No changes made.\n"));
    } else {
      if (newTracked.added.length > 0) {
        console.log(chalk.green(`\n  + ${newTracked.added.length} shows now tracked:`));
        for (const t of newTracked.added) {
          console.log(chalk.dim(`    ✓ ${t}`));
        }
      }
      if (newTracked.removed.length > 0) {
        console.log(chalk.yellow(`\n  - ${newTracked.removed.length} shows untracked:`));
        for (const t of newTracked.removed) {
          console.log(chalk.dim(`    ✗ ${t}`));
        }
      }
      console.log("");
    }
  }

  const taggedForComparison = new Map<number, boolean>();
  for (const m of media) {
    taggedForComparison.set(m.id, isTracked(m.id));
  }

  function handleKey(key: string): void {
    if (key === "\x03") {
      running = false;
      return;
    }

    if (key === "q" || key === "Q" || key === "\x1b") {
      running = false;
      return;
    }

    if (key === "\r" || key === "\n") {
      running = false;
      return;
    }

    if (key === " ") {
      const mid = media[selectedIdx].id;
      if (trackedSet.has(mid)) {
        trackedSet.delete(mid);
      } else {
        trackedSet.add(mid);
      }
      render();
      return;
    }

    if (key === "j" || key === DOWN || key === DOWN_ALT) {
      if (selectedIdx < media.length - 1) selectedIdx++;
      render();
      return;
    }

    if (key === "k" || key === UP || key === UP_ALT) {
      if (selectedIdx > 0) selectedIdx--;
      render();
      return;
    }

    if (key === "g") {
      selectedIdx = 0;
      offset = 0;
      render();
      return;
    }

    if (key === "G") {
      selectedIdx = media.length - 1;
      render();
      return;
    }
  }

  stdin.on("data", handleKey);

  stdout.on("resize", () => {
    render();
  });

  render();

  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (!running) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });

  stdin.removeAllListeners("data");
  stdin.setRawMode(false);
  stdin.pause();
  stdout.write("\x1b[?25h");

  clearScreen();
  finalize();
}
