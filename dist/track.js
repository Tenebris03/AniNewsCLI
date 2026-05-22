"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTrackingUI = runTrackingUI;
const node_process_1 = require("node:process");
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("./config.js");
const UP = "\x1b[A";
const DOWN = "\x1b[B";
const UP_ALT = "\x1bOA";
const DOWN_ALT = "\x1bOB";
function getDisplayTitle(m) {
    return m.title.english ?? m.title.romaji;
}
function formatNextEpisode(m) {
    if (!m.nextAiringEpisode)
        return chalk_1.default.gray("TBA");
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
    return chalk_1.default.dim(`Ep ${ep}${total} — ${time}`);
}
function getFormatLabel(format) {
    switch (format) {
        case "TV":
            return chalk_1.default.blue("TV");
        case "TV_SHORT":
            return chalk_1.default.cyan("TVS");
        case "MOVIE":
            return chalk_1.default.magenta("MOV");
        case "OVA":
            return chalk_1.default.yellow("OVA");
        case "ONA":
            return chalk_1.default.green("ONA");
        default:
            return format;
    }
}
function renderList(media, tracked, selectedIdx, offset, visibleCount) {
    const lines = [];
    const header = chalk_1.default.bold.cyan("  Track Anime — ") +
        chalk_1.default.white("navigate with ") +
        chalk_1.default.yellow("↑↓") +
        chalk_1.default.white(", ") +
        chalk_1.default.yellow("space") +
        chalk_1.default.white(" to toggle, ") +
        chalk_1.default.yellow("enter") +
        chalk_1.default.white(" to save, ") +
        chalk_1.default.yellow("q") +
        chalk_1.default.white(" to quit") +
        "\n" +
        chalk_1.default.dim("  ─────────────────────────────────────────────────────────────────") +
        "\n";
    lines.push(header);
    const end = Math.min(offset + visibleCount, media.length);
    for (let i = offset; i < end; i++) {
        const m = media[i];
        const isSelected = i === selectedIdx;
        const isTracked = tracked.has(m.id);
        const prefix = isSelected
            ? chalk_1.default.bgCyan.black(" ")
            : " ";
        const checkbox = isTracked ? chalk_1.default.green("✓") : chalk_1.default.dim("○");
        const title = getDisplayTitle(m);
        const truncated = title.length > 42 ? title.slice(0, 39) + "..." : title.padEnd(42);
        const fmt = getFormatLabel(m.format);
        const nextEp = formatNextEpisode(m);
        const line = ` ${prefix}${checkbox} ${truncated} ${chalk_1.default.dim("│")} ${fmt} ${chalk_1.default.dim("│")} ${nextEp}`;
        if (isSelected) {
            lines.push(`\x1b[46m\x1b[30m${line}\x1b[0m`);
        }
        else {
            lines.push(line);
        }
    }
    if (media.length > visibleCount) {
        const scrollHint = chalk_1.default.dim(`\n  ── ${offset + 1}-${end} of ${media.length} — ↑↓ to scroll`);
        lines.push(scrollHint);
    }
    if (offset + visibleCount < media.length) {
        lines.push(chalk_1.default.dim("  ↓ more below"));
    }
    if (offset > 0) {
        lines.unshift(chalk_1.default.dim("  ↑ more above"));
    }
    lines.push("\n" +
        chalk_1.default.dim("  ─────────────────────────────────────────────────────────────────"));
    lines.push(chalk_1.default.dim(`  ${tracked.size} tracked  |  ${media.length} currently airing  |  Data from AniList`));
    return lines.join("\n");
}
function clearScreen() {
    node_process_1.stdout.write("\x1b[2J\x1b[H");
}
function getVisibleCount() {
    return (node_process_1.stdout.rows || 24) - 10;
}
async function runTrackingUI(media) {
    const trackedSet = new Set();
    for (const m of media) {
        if ((0, config_js_1.isTracked)(m.id))
            trackedSet.add(m.id);
    }
    let selectedIdx = 0;
    let offset = 0;
    let running = true;
    node_process_1.stdin.setRawMode(true);
    node_process_1.stdin.resume();
    node_process_1.stdin.setEncoding("utf-8");
    node_process_1.stdout.write("\x1b[?25l");
    function render() {
        clearScreen();
        const visibleCount = getVisibleCount();
        if (selectedIdx < offset)
            offset = selectedIdx;
        if (selectedIdx >= offset + visibleCount)
            offset = selectedIdx - visibleCount + 1;
        if (offset < 0)
            offset = 0;
        const frame = renderList(media, trackedSet, selectedIdx, offset, visibleCount);
        node_process_1.stdout.write(frame);
    }
    function finalize() {
        const newTracked = { added: [], removed: [] };
        for (const m of media) {
            const wasTracked = taggedForComparison.has(m.id);
            const nowTracked = trackedSet.has(m.id);
            if (!wasTracked && nowTracked) {
                (0, config_js_1.addTrackedShow)(m.id, getDisplayTitle(m));
                newTracked.added.push(getDisplayTitle(m));
            }
            else if (wasTracked && !nowTracked) {
                (0, config_js_1.removeTrackedShow)(m.id);
                newTracked.removed.push(getDisplayTitle(m));
            }
        }
        if (newTracked.added.length === 0 && newTracked.removed.length === 0) {
            console.log(chalk_1.default.dim("\n  No changes made.\n"));
        }
        else {
            if (newTracked.added.length > 0) {
                console.log(chalk_1.default.green(`\n  + ${newTracked.added.length} shows now tracked:`));
                for (const t of newTracked.added) {
                    console.log(chalk_1.default.dim(`    ✓ ${t}`));
                }
            }
            if (newTracked.removed.length > 0) {
                console.log(chalk_1.default.yellow(`\n  - ${newTracked.removed.length} shows untracked:`));
                for (const t of newTracked.removed) {
                    console.log(chalk_1.default.dim(`    ✗ ${t}`));
                }
            }
            console.log("");
        }
    }
    const taggedForComparison = new Map();
    for (const m of media) {
        taggedForComparison.set(m.id, (0, config_js_1.isTracked)(m.id));
    }
    function handleKey(key) {
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
            }
            else {
                trackedSet.add(mid);
            }
            render();
            return;
        }
        if (key === "j" || key === DOWN || key === DOWN_ALT) {
            if (selectedIdx < media.length - 1)
                selectedIdx++;
            render();
            return;
        }
        if (key === "k" || key === UP || key === UP_ALT) {
            if (selectedIdx > 0)
                selectedIdx--;
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
    node_process_1.stdin.on("data", handleKey);
    node_process_1.stdout.on("resize", () => {
        render();
    });
    render();
    await new Promise((resolve) => {
        const check = setInterval(() => {
            if (!running) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
    node_process_1.stdin.removeAllListeners("data");
    node_process_1.stdin.setRawMode(false);
    node_process_1.stdin.pause();
    node_process_1.stdout.write("\x1b[?25h");
    clearScreen();
    finalize();
}
