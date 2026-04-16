import { type MouseEvent, useEffect, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import AlbumGrid from "../components/AlbumGrid";
import SearchForm from "../components/SearchForm";
import { useSpotifySearch } from "../hooks/useSpotifySearch";
import { useTopRatedAlbums } from "../hooks/useRatedAlbums";
import { UserAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  beginSpotifyLogin,
  clearSpotifyToken,
  isSpotifyConnected,
} from "../services/spotify/spotifyAuth";

export default function HomePage() {
  const { signOutUser } = UserAuth();
  const navigate = useNavigate();
  const [spotifyConnected, setSpotifyConnected] = useState(() =>
    isSpotifyConnected(),
  );

  useEffect(() => {
    setSpotifyConnected(isSpotifyConnected());
  }, []);

  const handleSignOut = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      await signOutUser();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const { searchTerm, setSearchTerm, albums, error, isLoading, handleSearch } =
    useSpotifySearch();
  const { session } = UserAuth();
  const userId = session?.user?.id;

  const {
    topRatedAlbums,
    isLoading: topRatedLoading,
    error: topRatedError,
  } = useTopRatedAlbums(userId, 4);

  return (
    <>
      <Container>
        <div className="main-header homepage-hero">
          <Row className="align-items-center">
            <Col xs={3} />
            <Col xs={6} className="text-center">
              <h1>Album Rater</h1>
              <p className="text-muted mb-0">
                Discover Spotify albums, rate tracks, and keep your favorites at
                a glance.
              </p>
            </Col>
            <Col xs={3} className="d-flex justify-content-end">
              {session && (
                <button
                  onClick={handleSignOut}
                  className="btn primary-action button-pill"
                >
                  Sign Out
                </button>
              )}
            </Col>
          </Row>
        </div>

        {!spotifyConnected && (
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <div className="text-muted">
              Connect to Spotify to search albums.
            </div>
            <button
              type="button"
              className="btn secondary-action button-pill"
              onClick={() => beginSpotifyLogin([])}
            >
              Connect Spotify
            </button>
          </div>
        )}
        {spotifyConnected && (
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <div className="text-muted">Spotify connected.</div>
            <button
              type="button"
              className="btn btn-outline-secondary button-pill"
              onClick={() => {
                clearSpotifyToken();
                setSpotifyConnected(false);
                window.location.reload();
              }}
            >
              Disconnect
            </button>
          </div>
        )}

        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
        />

        {error && <div className="text-danger mb-3">{error}</div>}
        {isLoading && <div className="mb-3">Loading albums…</div>}

        <AlbumGrid albums={albums} />

        {session && (
          <section className="my-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h2>Your top rated albums</h2>
                <p className="text-muted mb-0">
                  Average ratings for albums you have reviewed.
                </p>
              </div>
              <Link
                to="/rated-albums"
                className="btn secondary-action button-pill"
              >
                View all rated albums
              </Link>
            </div>

            {topRatedLoading && <div>Loading top rated albums…</div>}
            {topRatedError && (
              <div className="text-danger mb-3">{topRatedError}</div>
            )}

            {!topRatedLoading && topRatedAlbums.length === 0 && (
              <div className="text-muted mb-3">
                You have not rated any albums yet.
              </div>
            )}

            <Row xs={1} md={2} lg={4} className="g-3 mb-4">
              {topRatedAlbums.map((ratedAlbum) => (
                <Col key={ratedAlbum.album_id}>
                  <Card
                    as={Link}
                    to={`/album/${ratedAlbum.album_id}`}
                    className="h-100 text-decoration-none text-reset card-fade"
                  >
                    <Card.Img
                      variant="top"
                      src={
                        ratedAlbum.album.images?.[0]?.url ??
                        "https://via.placeholder.com/300"
                      }
                      alt={ratedAlbum.album.name}
                    />
                    <Card.Body>
                      <Card.Title className="h6">
                        {ratedAlbum.album.name}
                      </Card.Title>
                      <Card.Text className="text-muted mb-2">
                        {ratedAlbum.album.artists
                          ?.map((artist) => artist.name)
                          .join(", ") ?? "Unknown artist"}
                      </Card.Text>
                      <Card.Text className="mb-1">
                        {ratedAlbum.average_rating.toFixed(1)}/10 average
                      </Card.Text>
                      <Card.Text className="text-muted small">
                        {ratedAlbum.rating_count} track rating
                        {ratedAlbum.rating_count === 1 ? "" : "s"}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}
      </Container>
    </>
  );
}
