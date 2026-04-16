import type { SpotifyAlbumDetails } from "./spotify";

export type TrackRating = {
  id?: string;
  track_id: string;
  user_id: string;
  album_id: string;
  rating: number;
  created_at?: string;
  updated_at?: string;
};

export type TrackRatingInput = Omit<TrackRating, "id" | "created_at" | "updated_at">;

export type RatedAlbumSummary = {
  album_id: string;
  rating_count: number;
  average_rating: number;
};

export type RatedAlbumWithDetails = RatedAlbumSummary & {
  album: SpotifyAlbumDetails;
};
