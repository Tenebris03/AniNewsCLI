#!/usr/bin/env node

import chalk from "chalk";
import { fetchSchedule, fetchCurrentlyAiring } from "./api.js";
import { displaySchedule } from "./display.js";
import { runTrackingUI } from "./track.js";

function showHelp(): void {
  console.log(`
  ${chalk.bold.cyan("AniNewsCLI")} - Anime episode release schedule

  ${chalk.bold("Usage:")}
    aninews                     Show today's releases
    aninews tomorrow            Show tomorrow's releases
    aninews yesterday           Show yesterday's releases
    aninews DD.MM.YYYY          Show releases for a specific date
    aninews track               Browse & track currently airing anime
    aninews --help              Show this help message

  ${chalk.bold("Examples:")}
    aninews
    aninews tomorrow
    aninews yesterday
    aninews 25.12.2025
    aninews track
`);
}

function parseDateArg(arg: string): { date: Date; label: string } | null {
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
    const parsed = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    if (isNaN(parsed.getTime())) {
      console.error(
        chalk.red("\n  Invalid date. Use format DD.MM.YYYY (e.g. 25.12.2025)\n")
      );
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

  console.error(
    chalk.red("\n  Invalid argument. Use 'tomorrow', 'yesterday', or DD.MM.YYYY\n")
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  if (args[0] === "track") {
    console.log(chalk.dim("\n  Fetching currently airing anime..."));
    try {
      const media = await fetchCurrentlyAiring();
      await runTrackingUI(media);
    } catch (error) {
      console.error(
        chalk.red(
          `\n  Failed to load tracking panel: ${(error as Error).message}\n`
        )
      );
      process.exit(1);
    }
    return;
  }

  const rawArg = args[0] || "";
  const parsed = parseDateArg(rawArg);
  if (!parsed) return;

  console.log(
    chalk.dim(`\n  Fetching anime schedule for ${parsed.label}...`)
  );

  try {
    const schedules = await fetchSchedule(parsed.date);
    displaySchedule(schedules, parsed.label);
  } catch (error) {
    console.error(
      chalk.red(
        `\n  Failed to fetch anime schedule: ${(error as Error).message}\n`
      )
    );
    process.exit(1);
  }
}

main();
