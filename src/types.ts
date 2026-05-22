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

export interface CurrentlyAiringMedia {
  id: number;
  title: AnimeTitle;
  format: string;
  episodes: number | null;
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
  } | null;
  coverImage: {
    medium: string;
  };
}

export interface AiringMediaResponse {
  data: {
    Page: {
      media: CurrentlyAiringMedia[];
      pageInfo: {
        hasNextPage: boolean;
      };
    };
  };
}

export interface TrackedShow {
  mediaId: number;
  title: string;
  addedAt: string;
}

export interface TrackedConfig {
  tracked: Record<number, TrackedShow>;
}
