import { AniListResponse, AiringSchedule } from "./types.js";

const ANILIST_API = "https://graphql.anilist.co";

const SCHEDULE_QUERY = `
query ($start: Int, $end: Int, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    airingSchedules(
      airingAt_greater: $start,
      airingAt_lesser: $end,
      sort: TIME
    ) {
      id
      episode
      airingAt
      timeUntilAiring
      media {
        id
        title {
          romaji
          english
        }
        format
        status
        episodes
        coverImage {
          medium
        }
        siteUrl
      }
    }
  }
}
`;

export async function fetchSchedule(date: Date): Promise<AiringSchedule[]> {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
  const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

  let page = 1;
  let hasNextPage = true;
  const allSchedules: AiringSchedule[] = [];

  while (hasNextPage) {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: SCHEDULE_QUERY,
        variables: {
          start: startTimestamp,
          end: endTimestamp,
          page,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as AniListResponse;

    if (data.data.Page.airingSchedules.length > 0) {
      allSchedules.push(...data.data.Page.airingSchedules);
    }

    hasNextPage = data.data.Page.pageInfo.hasNextPage;
    page++;

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return allSchedules;
}
