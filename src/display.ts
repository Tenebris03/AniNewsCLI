import chalk from "chalk";
import Table from "cli-table3";
import { AiringSchedule } from "./types.js";

function getDisplayTitle(schedule: AiringSchedule): string {
  return schedule.media.title.english ?? schedule.media.title.romaji;
}

function formatAiringTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function getEpisodeLabel(schedule: AiringSchedule): string {
  const ep = schedule.episode;
  const total = schedule.media.episodes;
  if (total && total > 0) {
    return `${ep}/${total}`;
  }
  return `${ep}`;
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
    case "SPECIAL":
      return chalk.gray("SPC");
    default:
      return chalk.white(format);
  }
}

export function displaySchedule(schedules: AiringSchedule[], dateLabel: string): void {
  if (schedules.length === 0) {
    console.log(
      chalk.yellow(`\n  No anime episodes scheduled for release on ${dateLabel}.\n`)
    );
    return;
  }

  const table = new Table({
    head: [
      chalk.bold.white("#"),
      chalk.bold.white("Title"),
      chalk.bold.white("Ep"),
      chalk.bold.white("Format"),
      chalk.bold.white("Airing At"),
    ],
    colWidths: [5, 50, 8, 8, 18],
    wordWrap: true,
    style: {
      head: ["cyan"],
      border: ["gray"],
    },
  });

  schedules.forEach((schedule, index) => {
    const titleColored = chalk.green(getDisplayTitle(schedule));
    const epLabel = getEpisodeLabel(schedule);
    const formatLabel = getFormatLabel(schedule.media.format);
    const time = formatAiringTime(schedule.airingAt);
    const isAired = schedule.timeUntilAiring <= 0;

    const timeColored = isAired
      ? chalk.gray(time + " ✓")
      : chalk.yellow(time);

    table.push([
      chalk.dim(String(index + 1)),
      titleColored,
      chalk.white(epLabel),
      formatLabel,
      timeColored,
    ]);
  });

  console.log(
    chalk.bold.cyan(`\n  📺  Anime Episodes Releasing on ${dateLabel}\n`)
  );
  console.log(table.toString());

  const alreadyAired = schedules.filter((s) => s.timeUntilAiring <= 0).length;
  const upcoming = schedules.length - alreadyAired;

  console.log(
    chalk.dim(
      `\n  ${schedules.length} total  |  ${chalk.green(alreadyAired + " aired")}  |  ${chalk.yellow(upcoming + " upcoming")}\n`
    )
  );

  console.log(
    chalk.dim("  Data from AniList  •  https://anilist.co\n")
  );
}
