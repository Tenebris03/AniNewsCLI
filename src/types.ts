export interface AnimeTitle {
  romaji: string;
  english: string | null;
}

export interface AiringSchedule {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  media: {
    id: number;
    title: AnimeTitle;
    format: string;
    status: string;
    episodes: number | null;
    coverImage: {
      medium: string;
    };
    siteUrl: string;
  };
}

export interface AniListResponse {
  data: {
    Page: {
      airingSchedules: AiringSchedule[];
      pageInfo: {
        hasNextPage: boolean;
      };
    };
  };
}
