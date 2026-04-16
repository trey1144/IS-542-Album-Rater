import { useEffect, useState } from "react";
import type { SpotifyAlbumDetails } from "../types/spotify";
import { getAlbumDetails } from "../services/spotify/spotifyApi";

export function useSpotifyAlbumDetails(albumId?: string) {
  const [album, setAlbum] = useState<SpotifyAlbumDetails | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!albumId) {
      setAlbum(null);
      setError("Album ID is missing.");
      return;
    }

    const controller = new AbortController();

    const loadAlbum = async () => {
      setIsLoading(true);
      setError("");

      try {
        const details = await getAlbumDetails(albumId);
        if (!controller.signal.aborted) {
          setAlbum(details);
        }
      } catch (error: any) {
        if (!controller.signal.aborted) {
          setError(error?.message ?? "Unable to load album details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadAlbum();

    return () => {
      controller.abort();
    };
  }, [albumId]);

  return { album, error, isLoading };
}
