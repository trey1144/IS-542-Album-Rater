import { useState } from "react";
import type { SpotifyAlbum } from "../types/spotify";
import {
  searchAlbumsByArtistId,
  searchAlbum,
  searchArtist,
} from "../services/spotify/spotifyApi";

export function useSpotifySearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch() {
    setError("");
    setAlbums([]);

    if (!searchTerm.trim()) {
      setError("Please enter a search term.");
      return;
    }

    setIsLoading(true);

    try {
      const albumResponse = await searchAlbum(searchTerm, 20);
      const albumResults = albumResponse.items ?? [];

      if (albumResults.length > 0) {
        setAlbums(albumResults);
        return;
      }

      const artist = await searchArtist(searchTerm);
      if (!artist?.id) {
        setError("No albums or artists found for that search term.");
        return;
      }

      const artistAlbumResponse = await searchAlbumsByArtistId(artist.id, 20);
      const artistAlbums = artistAlbumResponse.items ?? [];

      if (artistAlbums.length === 0) {
        setError("No albums found for the matched artist.");
        return;
      }

      setAlbums(artistAlbums);
    } catch (error: any) {
      setError(error?.message ?? "Unable to fetch albums from Spotify.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    albums,
    error,
    isLoading,
    handleSearch,
  };
}
