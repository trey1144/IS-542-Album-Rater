import { clearSpotifyToken, getSpotifyToken } from "./spotifyAuth";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1/";
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

export type SpotifyQueryParams = Record<
  string,
  string | number | boolean | undefined
>;

export class SpotifyApiError extends Error {
  public readonly status: number;
  public readonly details?: string;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    status: number,
    details?: string,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

function buildSpotifyUrl(
  endpoint: string,
  queryParams?: SpotifyQueryParams,
): string {
  const sanitizedPath = endpoint
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const url = new URL(sanitizedPath, SPOTIFY_API_BASE_URL);

  if (queryParams) {
    const searchParams = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });

    url.search = searchParams.toString();
  }

  return url.toString();
}

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const json = await response.json();

    if (json?.error?.message) {
      return String(json.error.message);
    }

    return JSON.stringify(json);
  } catch {
    return response.statusText || "Spotify returned an unknown error.";
  }
}

async function handleSpotifyResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  const details = await parseErrorBody(response);
  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
  const detailSuffix = details ? ` - ${details}` : "";

  throw new SpotifyApiError(
    `Spotify API request failed (${response.status} ${response.statusText})${detailSuffix}.`,
    response.status,
    details,
    retryAfter,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function spotifyFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: SpotifyQueryParams,
): Promise<T> {
  const token = await getSpotifyToken();
  const url = buildSpotifyUrl(endpoint, queryParams);
  const method = (options.method ?? "GET").toString().toUpperCase();

  if (method !== "GET") {
    throw new SpotifyApiError(
      `spotifyFetch only supports GET requests, got ${method}.`,
      400,
    );
  }

  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const requestOptions: RequestInit = {
    ...options,
    method,
    headers,
  };

  let response = await fetch(url, requestOptions);
  let attempt = 0;

  while (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const backoffMs = Number.isFinite(retryAfterSeconds)
      ? Math.max(0, retryAfterSeconds) * 1000
      : BASE_BACKOFF_MS * 2 ** attempt;

    await sleep(backoffMs);
    attempt += 1;
    response = await fetch(url, requestOptions);
  }

  if (response.status === 401) {
    clearSpotifyToken();
    const freshToken = await getSpotifyToken();
    headers.set("Authorization", `Bearer ${freshToken}`);
    response = await fetch(url, { ...requestOptions, headers });
  }

  return handleSpotifyResponse<T>(response);
}
