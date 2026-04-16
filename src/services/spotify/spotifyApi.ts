import { spotifyFetch, SpotifyApiError } from "./spotifyClient";
import type {
  SpotifyAlbumDetails,
  SpotifyAlbumsResponse,
  SpotifyArtist,
  SpotifySearchResponse,
} from "../../types/spotify";
import {
  isSpotifyAlbumDetails,
  isSpotifyAlbumsResponse,
  isSpotifyArtist,
  isSpotifySearchResponse,
} from "./spotifyGuards";

function validateSearchResponse(response: unknown): SpotifySearchResponse {
  if (!isSpotifySearchResponse(response)) {
    throw new SpotifyApiError("Spotify search response is malformed.", 502);
  }

  return response;
}

function validateAlbumsResponse(response: unknown): SpotifyAlbumsResponse {
  if (!isSpotifyAlbumsResponse(response)) {
    throw new SpotifyApiError("Spotify albums response is malformed.", 502);
  }

  return response;
}

function validateAlbumDetailsResponse(response: unknown): SpotifyAlbumDetails {
  if (!isSpotifyAlbumDetails(response)) {
    throw new SpotifyApiError(
      "Spotify album details response is malformed.",
      502,
    );
  }

  return response;
}

export async function searchAlbum(
  query: string,
  _limit = 10,
): Promise<SpotifyAlbumsResponse> {
  if (!query.trim()) {
    throw new SpotifyApiError("searchAlbum requires a non-empty query.", 400);
  }

  const normalizedLimit = 1;
  const response = await spotifyFetch<unknown>(
    "search",
    {
      method: "GET",
    },
    {
      q: query,
      type: "album",
      limit: normalizedLimit,
    },
  );

  const searchResponse = validateSearchResponse(response);
  return searchResponse.albums ?? { items: [] };
}

export async function searchArtist(
  query: string,
): Promise<SpotifyArtist | null> {
  if (!query.trim()) {
    throw new SpotifyApiError("searchArtist requires a non-empty query.", 400);
  }

  const response = await spotifyFetch<unknown>(
    "search",
    {
      method: "GET",
    },
    {
      q: query,
      type: "artist",
      limit: 1,
    },
  );

  const searchResponse = validateSearchResponse(response);
  const artist = searchResponse.artists?.items?.[0] ?? null;

  if (artist !== null && !isSpotifyArtist(artist)) {
    throw new SpotifyApiError("Spotify artist response is malformed.", 502);
  }

  return artist;
}

export async function searchAlbumsByArtistId(
  artistId: string,
  _limit = 10,
): Promise<SpotifyAlbumsResponse> {
  return getArtistAlbums(artistId, 1);
}

export async function getArtistAlbums(
  artistId: string,
  _limit = 10,
): Promise<SpotifyAlbumsResponse> {
  if (!artistId.trim()) {
    throw new SpotifyApiError(
      "getArtistAlbums requires a valid artistId.",
      400,
    );
  }

  const response = await spotifyFetch<unknown>(
    `artists/${artistId}/albums`,
    {
      method: "GET",
    },
    {
      include_groups: "album",
      limit: 1,
    },
  );

  return validateAlbumsResponse(response);
}

export async function getAlbumDetails(
  albumId: string,
): Promise<SpotifyAlbumDetails> {
  if (!albumId.trim()) {
    throw new SpotifyApiError("getAlbumDetails requires a valid albumId.", 400);
  }

  const response = await spotifyFetch<unknown>(`albums/${albumId}`, {
    method: "GET",
  });

  return validateAlbumDetailsResponse(response);
}

function chunkAlbumIds(albumIds: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < albumIds.length; index += size) {
    chunks.push(albumIds.slice(index, index + size));
  }
  return chunks;
}

export async function getAlbumsByIds(
  albumIds: string[],
): Promise<SpotifyAlbumDetails[]> {
  const validIds = Array.from(
    new Set(albumIds.map((id) => id?.trim()).filter(Boolean) as string[]),
  );

  if (validIds.length === 0) {
    return [];
  }

  const albumChunks = chunkAlbumIds(validIds, 20);
  const responses = await Promise.all(
    albumChunks.map((chunk) =>
      spotifyFetch<unknown>(
        "albums",
        {
          method: "GET",
        },
        {
          ids: chunk.join(","),
        },
      ),
    ),
  );

  return responses.flatMap((response) => {
    const validated = validateAlbumsResponse(response);
    return validated.items ?? [];
  });
}
