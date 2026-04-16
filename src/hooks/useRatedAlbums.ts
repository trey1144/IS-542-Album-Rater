import { useEffect, useState } from "react";
import type { RatedAlbumWithDetails } from "../types/trackRating";
import {
  fetchAllRatedAlbumSummaries,
  fetchTopRatedAlbumSummaries,
} from "../services/supabase/trackRatings";
import { getAlbumDetails } from "../services/spotify/spotifyApi";

import type { SpotifyAlbumDetails } from "../types/spotify";

function buildAlbumDetailsPlaceholder(albumId: string): SpotifyAlbumDetails {
  return {
    id: albumId,
    name: "Unknown album",
    images: [],
    artists: [],
  };
}

async function fetchAlbumDetailsOneByOne(
  albumIds: string[],
): Promise<SpotifyAlbumDetails[]> {
  const validIds = albumIds.filter((id) => typeof id === "string" && id.trim());
  return Promise.all(validIds.map((id) => getAlbumDetails(id)));
}

export function useTopRatedAlbums(userId?: string, limit = 4) {
  const [topRatedAlbums, setTopRatedAlbums] = useState<RatedAlbumWithDetails[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) {
        setTopRatedAlbums([]);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const summaries = await fetchTopRatedAlbumSummaries(userId, limit);
        const albumDetails = await fetchAlbumDetailsOneByOne(
          summaries.map((summary) => summary.album_id),
        );

        if (!active) return;

        setTopRatedAlbums(
          summaries.map((summary) => ({
            ...summary,
            album:
              albumDetails.find((album) => album.id === summary.album_id) ??
              buildAlbumDetailsPlaceholder(summary.album_id),
          })),
        );
      } catch (error: any) {
        if (!active) return;
        setError(error?.message ?? "Unable to load top rated albums.");
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userId, limit]);

  return { topRatedAlbums, isLoading, error };
}

export function useAllRatedAlbums(userId?: string) {
  const [allRatedAlbums, setAllRatedAlbums] = useState<RatedAlbumWithDetails[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) {
        setAllRatedAlbums([]);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const summaries = await fetchAllRatedAlbumSummaries(userId);
        const albumDetails = await fetchAlbumDetailsOneByOne(
          summaries.map((summary) => summary.album_id),
        );

        if (!active) return;

        setAllRatedAlbums(
          summaries.map((summary) => ({
            ...summary,
            album:
              albumDetails.find((album) => album.id === summary.album_id) ??
              buildAlbumDetailsPlaceholder(summary.album_id),
          })),
        );
      } catch (error: any) {
        if (!active) return;
        setError(error?.message ?? "Unable to load rated albums.");
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  return { allRatedAlbums, isLoading, error };
}
