export type SpotifyImage = {
  url: string;
  height?: number;
  width?: number;
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  release_date?: string;
  images?: SpotifyImage[];
  artists?: { name: string }[];
  label?: string;
  total_tracks?: number;
  popularity?: number;
};

export type SpotifyAlbumTrack = {
  id: string;
  name: string;
  duration_ms?: number;
  track_number?: number;
  preview_url?: string | null;
  artists?: { name: string }[];
  explicit?: boolean;
};

export type SpotifyAlbumDetails = SpotifyAlbum & {
  genres?: string[];
  tracks?: {
    items?: SpotifyAlbumTrack[];
  };
};

export type SpotifyArtist = {
  id: string;
  name: string;
};

export type SpotifyArtistsResponse = {
  items?: SpotifyArtist[];
};

export type SpotifySearchResponse = {
  artists?: SpotifyArtistsResponse;
  albums?: SpotifyAlbumsResponse;
};

export type SpotifyAlbumsResponse = {
  items?: SpotifyAlbum[];
};
