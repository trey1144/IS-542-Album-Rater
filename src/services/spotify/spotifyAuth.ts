const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const REDIRECT_URI = import.meta.env
  .VITE_SPOTIFY_REDIRECT_URI as string | undefined;

const TOKEN_EXPIRY_MARGIN_MS = 30_000;
const STORAGE_KEY = "spotify_auth_v1";
const VERIFIER_KEY = "spotify_pkce_verifier_v1";
const STATE_KEY = "spotify_pkce_state_v1";
const REDIRECT_KEY = "spotify_pkce_redirect_uri_v1";

type SpotifyTokenResponse = {
  access_token: string;
  token_type: "Bearer" | string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
};

type StoredSpotifyAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

type SpotifyAuthState = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  tokenPromise: Promise<string> | null;
};

const authState: SpotifyAuthState = {
  accessToken: "",
  refreshToken: "",
  expiresAt: 0,
  scope: "",
  tokenPromise: null,
};

function assertSpotifyConfig(): void {
  if (!CLIENT_ID) {
    throw new Error(
      "Missing Spotify Client ID. Set VITE_SPOTIFY_CLIENT_ID in your environment.",
    );
  }

  if (!REDIRECT_URI) {
    throw new Error(
      "Missing Spotify Redirect URI. Set VITE_SPOTIFY_REDIRECT_URI (use https, or http://127.0.0.1 for local dev).",
    );
  }
}

function getClientId(): string {
  assertSpotifyConfig();
  return CLIENT_ID!;
}

function getRedirectUri(): string {
  assertSpotifyConfig();
  return REDIRECT_URI!;
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

async function createCodeChallenge(
  verifier: string,
): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

function isTokenValid(): boolean {
  return (
    authState.accessToken.length > 0 &&
    Date.now() + TOKEN_EXPIRY_MARGIN_MS < authState.expiresAt
  );
}

function loadStoredAuth(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredSpotifyAuth;
    if (
      typeof parsed?.accessToken !== "string" ||
      typeof parsed?.refreshToken !== "string" ||
      typeof parsed?.expiresAt !== "number"
    ) {
      return;
    }
    authState.accessToken = parsed.accessToken;
    authState.refreshToken = parsed.refreshToken;
    authState.expiresAt = parsed.expiresAt;
    authState.scope = typeof parsed.scope === "string" ? parsed.scope : "";
  } catch {
    // ignore
  }
}

function persistAuth(): void {
  const stored: StoredSpotifyAuth = {
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    expiresAt: authState.expiresAt,
    scope: authState.scope,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function isSpotifyConnected(): boolean {
  if (!authState.accessToken && !authState.refreshToken) {
    loadStoredAuth();
  }
  return Boolean(authState.accessToken || authState.refreshToken);
}

export async function beginSpotifyLogin(scopes: string[] = []): Promise<void> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  const verifier = randomString(96);
  const state = randomString(32);
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(REDIRECT_KEY, redirectUri);

  const url = new URL(SPOTIFY_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  if (scopes.length > 0) {
    url.searchParams.set("scope", scopes.join(" "));
  }

  window.location.assign(url.toString());
}

async function exchangeCodeForToken(code: string): Promise<void> {
  const clientId = getClientId();
  const redirectUri = sessionStorage.getItem(REDIRECT_KEY) ?? getRedirectUri();

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) {
    throw new Error("Spotify login verifier missing. Please try connecting again.");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }).toString(),
  });

  const json = (await response.json().catch(() => null)) as any;
  if (!response.ok) {
    throw new Error(
      `Spotify token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(json)}`,
    );
  }

  const data = json as SpotifyTokenResponse;
  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("Spotify token response is missing required fields.");
  }

  authState.accessToken = data.access_token;
  authState.expiresAt = Date.now() + data.expires_in * 1000;
  authState.scope = typeof data.scope === "string" ? data.scope : "";
  if (typeof data.refresh_token === "string") {
    authState.refreshToken = data.refresh_token;
  }

  persistAuth();
}

async function refreshSpotifyToken(): Promise<void> {
  const clientId = getClientId();
  if (!authState.refreshToken) {
    throw new Error("Spotify refresh token is missing. Please connect to Spotify.");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: authState.refreshToken,
    }).toString(),
  });

  const json = (await response.json().catch(() => null)) as any;
  if (!response.ok) {
    throw new Error(
      `Spotify token refresh failed: ${response.status} ${response.statusText} - ${JSON.stringify(json)}`,
    );
  }

  const data = json as SpotifyTokenResponse;
  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("Spotify refresh response is missing required fields.");
  }

  authState.accessToken = data.access_token;
  authState.expiresAt = Date.now() + data.expires_in * 1000;
  authState.scope = typeof data.scope === "string" ? data.scope : authState.scope;
  if (typeof data.refresh_token === "string") {
    authState.refreshToken = data.refresh_token;
  }
  persistAuth();
}

export async function completeSpotifyLoginFromRedirect(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    throw new Error(`Spotify authorization failed: ${error}`);
  }

  if (!code) {
    throw new Error("Spotify callback is missing an authorization code.");
  }

  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!expectedState || expectedState !== state) {
    throw new Error("Spotify authorization state mismatch. Please try again.");
  }

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  window.history.replaceState({}, document.title, url.pathname);

  await exchangeCodeForToken(code);

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
}

export async function getSpotifyToken(): Promise<string> {
  if (!authState.accessToken && !authState.refreshToken) {
    loadStoredAuth();
  }

  if (isTokenValid()) {
    return authState.accessToken;
  }

  if (!authState.tokenPromise) {
    authState.tokenPromise = (async () => {
      if (authState.refreshToken) {
        await refreshSpotifyToken();
        return authState.accessToken;
      }
      throw new Error("Spotify is not connected. Connect to Spotify to search.");
    })().finally(() => {
      authState.tokenPromise = null;
    });
  }

  return authState.tokenPromise;
}

export function clearSpotifyToken(): void {
  authState.accessToken = "";
  authState.refreshToken = "";
  authState.expiresAt = 0;
  authState.scope = "";
  authState.tokenPromise = null;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
}
