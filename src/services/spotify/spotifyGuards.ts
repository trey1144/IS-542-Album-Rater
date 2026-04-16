import type {
  SpotifyAlbum,
  SpotifyAlbumDetails,
  SpotifyAlbumTrack,
  SpotifyAlbumsResponse,
  SpotifyArtist,
  SpotifyArtistsResponse,
  SpotifyImage,
  SpotifySearchResponse,
} from "../../types/spotify";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isSpotifyImage(value: unknown): value is SpotifyImage {
  return (
    isObject(value) &&
    isString(value.url) &&
    (value.height === undefined || isNumber(value.height)) &&
    (value.width === undefined || isNumber(value.width))
  );
}

export function isSpotifyArtist(value: unknown): value is SpotifyArtist {
  return isObject(value) && isString(value.id) && isString(value.name);
}

export function isSpotifyAlbum(value: unknown): value is SpotifyAlbum {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.release_date === undefined || isString(value.release_date)) &&
    (value.label === undefined || isString(value.label)) &&
    (value.total_tracks === undefined || isNumber(value.total_tracks)) &&
    (value.popularity === undefined || isNumber(value.popularity)) &&
    (value.images === undefined ||
      (Array.isArray(value.images) && value.images.every(isSpotifyImage))) &&
    (value.artists === undefined ||
      (Array.isArray(value.artists) && value.artists.every(isSpotifyArtist)))
  );
}

export function isSpotifyAlbumTrack(
  value: unknown,
): value is SpotifyAlbumTrack {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.duration_ms === undefined || isNumber(value.duration_ms)) &&
    (value.track_number === undefined || isNumber(value.track_number)) &&
    (value.preview_url === undefined ||
      value.preview_url === null ||
      isString(value.preview_url)) &&
    (value.artists === undefined ||
      (Array.isArray(value.artists) &&
        value.artists.every(
          (artist): artist is { name: string } =>
            isObject(artist) && isString(artist.name),
        ))) &&
    (value.explicit === undefined || typeof value.explicit === "boolean")
  );
}

export function isSpotifyAlbumDetails(
  value: unknown,
): value is SpotifyAlbumDetails {
  if (!isSpotifyAlbum(value)) {
    return false;
  }

  const maybeDetails = value as SpotifyAlbumDetails;

  if (
    maybeDetails.genres !== undefined &&
    !(Array.isArray(maybeDetails.genres) && maybeDetails.genres.every(isString))
  ) {
    return false;
  }

  const tracks = maybeDetails.tracks;

  if (tracks === undefined) {
    return true;
  }

  if (!isObject(tracks)) {
    return false;
  }

  const items = (tracks as { items?: unknown }).items;

  return (
    items === undefined ||
    (Array.isArray(items) && items.every(isSpotifyAlbumTrack))
  );
}

export function isSpotifyAlbumsResponse(
  value: unknown,
): value is SpotifyAlbumsResponse {
  return (
    isObject(value) &&
    (value.items === undefined ||
      (Array.isArray(value.items) && value.items.every(isSpotifyAlbum)))
  );
}

export function isSpotifyArtistsResponse(
  value: unknown,
): value is SpotifyArtistsResponse {
  return (
    isObject(value) &&
    (value.items === undefined ||
      (Array.isArray(value.items) && value.items.every(isSpotifyArtist)))
  );
}

export function isSpotifySearchResponse(
  value: unknown,
): value is SpotifySearchResponse {
  return (
    isObject(value) &&
    (value.albums === undefined || isSpotifyAlbumsResponse(value.albums)) &&
    (value.artists === undefined || isSpotifyArtistsResponse(value.artists))
  );
}
