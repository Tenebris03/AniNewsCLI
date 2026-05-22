"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSchedule = fetchSchedule;
exports.fetchCurrentlyAiring = fetchCurrentlyAiring;
const ANILIST_API = "https://graphql.anilist.co";
async function apiFetch(query, variables) {
    let attempt = 0;
    while (true) {
        const response = await fetch(ANILIST_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("Retry-After") || "0", 10);
            const wait = Math.max(retryAfter * 1000, 1000 * (attempt + 1));
            attempt++;
            if (attempt > 5) {
                throw new Error("Too many requests — try again in a minute");
            }
            await new Promise((resolve) => setTimeout(resolve, wait));
            continue;
        }
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response;
    }
}
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
async function fetchSchedule(date) {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);
    let page = 1;
    let hasNextPage = true;
    const allSchedules = [];
    while (hasNextPage) {
        const response = await apiFetch(SCHEDULE_QUERY, {
            start: startTimestamp,
            end: endTimestamp,
            page,
        });
        const data = (await response.json());
        if (data.data.Page.airingSchedules.length > 0) {
            allSchedules.push(...data.data.Page.airingSchedules);
        }
        hasNextPage = data.data.Page.pageInfo.hasNextPage;
        page++;
        await new Promise((resolve) => setTimeout(resolve, 750));
    }
    return allSchedules;
}
const CURRENTLY_AIRING_QUERY = `
query ($page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    media(status: RELEASING, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      format
      episodes
      nextAiringEpisode {
        episode
        airingAt
      }
      coverImage {
        medium
      }
    }
  }
}
`;
async function fetchCurrentlyAiring() {
    let page = 1;
    let hasNextPage = true;
    const allMedia = [];
    while (hasNextPage) {
        const response = await apiFetch(CURRENTLY_AIRING_QUERY, { page });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        if (data.data.Page.media.length > 0) {
            allMedia.push(...data.data.Page.media);
        }
        hasNextPage = data.data.Page.pageInfo.hasNextPage;
        page++;
        await new Promise((resolve) => setTimeout(resolve, 750));
    }
    return allMedia;
}
