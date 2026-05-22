#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const api_js_1 = require("./api.js");
const display_js_1 = require("./display.js");
const track_js_1 = require("./track.js");
function showHelp() {
    console.log(`
  ${chalk_1.default.bold.cyan("AniNewsCLI")} - Anime episode release schedule

  ${chalk_1.default.bold("Usage:")}
    aninews                     Show today's releases
    aninews tomorrow            Show tomorrow's releases
    aninews yesterday           Show yesterday's releases
    aninews DD.MM.YYYY          Show releases for a specific date
    aninews track               Browse & track currently airing anime
    aninews --help              Show this help message

  ${chalk_1.default.bold("Examples:")}
    aninews
    aninews tomorrow
    aninews yesterday
    aninews 25.12.2025
    aninews track
`);
}
function parseDateArg(arg) {
    if (!arg) {
        const now = new Date();
        const label = now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        return { date: now, label };
    }
    const lower = arg.toLowerCase().trim();
    if (lower === "tomorrow") {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const label = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        return { date, label };
    }
    if (lower === "yesterday") {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const label = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        return { date, label };
    }
    const dateMatch = lower.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(parsed.getTime())) {
            console.error(chalk_1.default.red("\n  Invalid date. Use format DD.MM.YYYY (e.g. 25.12.2025)\n"));
            process.exit(1);
        }
        const label = parsed.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        return { date: parsed, label };
    }
    console.error(chalk_1.default.red("\n  Invalid argument. Use 'tomorrow', 'yesterday', or DD.MM.YYYY\n"));
    process.exit(1);
}
async function main() {
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
        showHelp();
        return;
    }
    if (args[0] === "track") {
        console.log(chalk_1.default.dim("\n  Fetching currently airing anime..."));
        try {
            const media = await (0, api_js_1.fetchCurrentlyAiring)();
            await (0, track_js_1.runTrackingUI)(media);
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n  Failed to load tracking panel: ${error.message}\n`));
            process.exit(1);
        }
        return;
    }
    const rawArg = args[0] || "";
    const parsed = parseDateArg(rawArg);
    if (!parsed)
        return;
    console.log(chalk_1.default.dim(`\n  Fetching anime schedule for ${parsed.label}...`));
    try {
        const schedules = await (0, api_js_1.fetchSchedule)(parsed.date);
        (0, display_js_1.displaySchedule)(schedules, parsed.label);
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n  Failed to fetch anime schedule: ${error.message}\n`));
        process.exit(1);
    }
}
main();
