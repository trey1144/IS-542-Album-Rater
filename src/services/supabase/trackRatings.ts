import { supabase } from "../../utils/supabase";
import type {
  RatedAlbumSummary,
  TrackRating,
  TrackRatingInput,
} from "../../types/trackRating";

type RatingRow = {
  album_id: string;
  track_id: string;
  rating: number;
};

function groupRatingsByAlbum(rows: RatingRow[]): RatedAlbumSummary[] {
  const albumMap = new Map<string, { total: number; count: number }>();

  rows.forEach((row) => {
    if (!row.album_id || typeof row.album_id !== "string") {
      return;
    }

    const albumId = row.album_id.trim();

    if (!albumId) {
      return;
    }

    const current = albumMap.get(albumId) ?? { total: 0, count: 0 };
    albumMap.set(albumId, {
      total: current.total + row.rating,
      count: current.count + 1,
    });
  });

  return Array.from(albumMap.entries()).map(([album_id, aggregate]) => ({
    album_id,
    rating_count: aggregate.count,
    average_rating: Number((aggregate.total / aggregate.count).toFixed(2)),
  }));
}

export async function fetchUserTrackRatings(
  userId: string,
): Promise<RatingRow[]> {
  const { data, error } = await (supabase.from("Track_Ratings") as any)
    .select("track_id, album_id, rating")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to load rated albums: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchTrackRatingsForAlbumByUser(
  albumId: string,
  userId: string,
): Promise<RatingRow[]> {
  const { data, error } = await (supabase.from("Track_Ratings") as any)
    .select("track_id, album_id, rating")
    .eq("album_id", albumId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to load track ratings for album: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchRatedAlbumSummariesForUser(
  userId: string,
): Promise<RatedAlbumSummary[]> {
  const ratings = await fetchUserTrackRatings(userId);
  return groupRatingsByAlbum(ratings).sort((a, b) =>
    b.average_rating === a.average_rating
      ? b.rating_count - a.rating_count
      : b.average_rating - a.average_rating,
  );
}

export async function fetchTopRatedAlbumSummaries(
  userId: string,
  limit = 4,
): Promise<RatedAlbumSummary[]> {
  return (await fetchRatedAlbumSummariesForUser(userId)).slice(0, limit);
}

export async function fetchAllRatedAlbumSummaries(
  userId: string,
): Promise<RatedAlbumSummary[]> {
  return await fetchRatedAlbumSummariesForUser(userId);
}

export async function upsertTrackRating(
  input: TrackRatingInput,
): Promise<TrackRating> {
  const { data, error } = await (supabase.from("Track_Ratings") as any)
    .upsert(input, { onConflict: "track_id,user_id" })
    .select();

  if (error) {
    throw new Error(`Unable to save track rating: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Track rating was not saved.");
  }

  return data[0];
}
