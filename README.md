# IS 542 Album Rater

A React + TypeScript web app that lets you **search Spotify albums**, open an album to view its **track list**, and **rate tracks**. Ratings are stored per-user using **Supabase Auth + database**.

## Project description

- **Search** for albums (and fallback to artist albums if no album matches)
- View **album details** and **track list**
- Save **track ratings (/10)** for signed-in users
- See a “top rated albums” section based on your saved ratings

This project uses the **Spotify Web API** for music metadata and **Supabase** for authentication + persistence of ratings.

## Instructions to run the project

### Prerequisites

- Node.js (LTS recommended)
- A **Spotify Developer** application (Client ID + configured Redirect URI)
- A **Supabase** project (URL + publishable/anon key)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create/update `.env` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key

VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=https://127.0.0.1:5173/spotify/callback
```

### 3) Configure Spotify Redirect URI

In the Spotify Developer Dashboard for your app, add this Redirect URI **exactly**:

- `https://127.0.0.1:5173/spotify/callback`

Local dev uses HTTPS via `mkcert` (`vite-plugin-mkcert`) so Spotify redirect requirements are satisfied.

### 4) Start the dev server

```bash
npm run dev
```

Then open:

- `https://127.0.0.1:5173/`

### 5) Connect Spotify

On the home page click **Connect Spotify** to complete the Authorization Code + PKCE flow, then search for an album.

## APIs used and how data is handled

### Spotify Web API

- **Auth flow**: Authorization Code with PKCE
  - Authorization happens in-browser via `https://accounts.spotify.com/authorize`
  - Tokens are exchanged/refreshed using `https://accounts.spotify.com/api/token`
- **Data**: Album/artist search, album details, artist albums
- **Token storage**:
  - Access/refresh token + expiry are stored in **`sessionStorage`** (not in source code).
  - No Spotify Client Secret is used in client-side code.
- **Rate limiting**:
  - Requests handle `429` by respecting the `Retry-After` header and applying exponential backoff.
- **Caching**:
  - Spotify responses are used for immediate display; persistent storage is for user ratings only.

Key files:
- `src/services/spotify/spotifyAuth.ts` (PKCE + refresh)
- `src/services/spotify/spotifyClient.ts` (fetch wrapper, error handling, 429 retry)
- `src/services/spotify/spotifyApi.ts` (Spotify endpoints)

### Supabase

- **Auth**: email/password sign up and sign in
- **Storage**: track ratings tied to the signed-in user

Key files:
- `src/utils/supabase.ts`
- `src/context/AuthContext.tsx`
- `src/services/supabase/trackRatings.ts`

## Additional features implemented

- **PKCE login + refresh token handling** for Spotify
- **HTTPS local dev** with `vite-plugin-mkcert`
- **Improved error messages** from Spotify responses to help debugging
- **Disconnect Spotify** clears tokens and reloads the app
- UI improvements:
  - Album page back navigation moved to a standard header position
  - Home page header keeps title centered while actions stay right-aligned
