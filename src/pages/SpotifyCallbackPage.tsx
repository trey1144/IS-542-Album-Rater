import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  beginSpotifyLogin,
  clearSpotifyToken,
  completeSpotifyLoginFromRedirect,
} from "../services/spotify/spotifyAuth";

export default function SpotifyCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    (async () => {
      try {
        await completeSpotifyLoginFromRedirect();
        navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Spotify login failed.");
      }
    })();
  }, [navigate]);

  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">Connecting to Spotify…</h1>
      {error ? (
        <div>
          <div className="text-danger mb-3">{error}</div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                clearSpotifyToken();
                beginSpotifyLogin([]);
              }}
            >
              Reset & try again
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => navigate("/", { replace: true })}
            >
              Back to home
            </button>
          </div>
        </div>
      ) : (
        <div className="text-muted">Finishing authentication.</div>
      )}
    </div>
  );
}

