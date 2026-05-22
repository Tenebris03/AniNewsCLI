"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaySchedule = displaySchedule;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
function getDisplayTitle(schedule) {
    return schedule.media.title.english ?? schedule.media.title.romaji;
}
function formatAiringTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
    });
}
function getEpisodeLabel(schedule) {
    const ep = schedule.episode;
    const total = schedule.media.episodes;
    if (total && total > 0) {
        return `${ep}/${total}`;
    }
    return `${ep}`;
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
        case "SPECIAL":
            return chalk_1.default.gray("SPC");
        default:
            return chalk_1.default.white(format);
    }
}
function displaySchedule(schedules, dateLabel) {
    if (schedules.length === 0) {
        console.log(chalk_1.default.yellow(`\n  No anime episodes scheduled for release on ${dateLabel}.\n`));
        return;
    }
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.bold.white("#"),
            chalk_1.default.bold.white("Title"),
            chalk_1.default.bold.white("Ep"),
            chalk_1.default.bold.white("Format"),
            chalk_1.default.bold.white("Airing At"),
        ],
        colWidths: [5, 50, 8, 8, 18],
        wordWrap: true,
        style: {
            head: ["cyan"],
            border: ["gray"],
        },
    });
    schedules.forEach((schedule, index) => {
        const titleColored = chalk_1.default.green(getDisplayTitle(schedule));
        const epLabel = getEpisodeLabel(schedule);
        const formatLabel = getFormatLabel(schedule.media.format);
        const time = formatAiringTime(schedule.airingAt);
        const isAired = schedule.timeUntilAiring <= 0;
        const timeColored = isAired
            ? chalk_1.default.gray(time + " ✓")
            : chalk_1.default.yellow(time);
        table.push([
            chalk_1.default.dim(String(index + 1)),
            titleColored,
            chalk_1.default.white(epLabel),
            formatLabel,
            timeColored,
        ]);
    });
    console.log(chalk_1.default.bold.cyan(`\n  📺  Anime Episodes Releasing on ${dateLabel}\n`));
    console.log(table.toString());
    const alreadyAired = schedules.filter((s) => s.timeUntilAiring <= 0).length;
    const upcoming = schedules.length - alreadyAired;
    console.log(chalk_1.default.dim(`\n  ${schedules.length} total  |  ${chalk_1.default.green(alreadyAired + " aired")}  |  ${chalk_1.default.yellow(upcoming + " upcoming")}\n`));
    console.log(chalk_1.default.dim("  Data from AniList  •  https://anilist.co\n"));
}
