import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { useSpotifyAlbumDetails } from "../hooks/useSpotifyAlbumDetails";
import { useTrackRatings } from "../hooks/useTrackRatings";
import { UserAuth } from "../context/AuthContext";

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs < 0) {
    return "--:--";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AlbumPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { album, error, isLoading } = useSpotifyAlbumDetails(albumId);
  const {
    savedRatings,
    draftRatings,
    submitting,
    errors,
    loadError,
    setDraftRating,
    submitRating,
  } = useTrackRatings(albumId, userId);

  const trackItems = useMemo(
    () => album?.tracks?.items ?? [],
    [album?.tracks?.items],
  );

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="outline-secondary"
          onClick={() => navigate(-1)}
          className="button-pill"
        >
          Back
        </Button>
        <Link to="/" className="btn btn-outline-secondary button-pill">
          Home
        </Link>
      </div>

      {isLoading && (
        <div>
          <Spinner animation="border" role="status" size="sm" /> Loading album
          details...
        </div>
      )}

      {error && <div className="text-danger mb-3">{error}</div>}

      {album && (
        <>
          <Row className="align-items-center mb-4">
            <Col xs={12} md={4} className="mb-3 mb-md-0">
              <img
                src={
                  album.images?.[0]?.url ?? "https://via.placeholder.com/300"
                }
                alt={album.name}
                className="img-fluid rounded"
              />
            </Col>

            <Col xs={12} md={8}>
              <h1>{album.name}</h1>
              <p className="text-muted mb-1">
                {album.artists?.map((artist) => artist.name).join(", ") ??
                  "Unknown artist"}
              </p>
              <p className="mb-1">
                Released: {album.release_date ?? "Unknown"}
              </p>
              <p className="mb-1">Label: {album.label ?? "Unknown"}</p>
              <p className="mb-1">
                Tracks: {album.total_tracks ?? trackItems.length}
              </p>
              {album.genres && album.genres.length > 0 && (
                <p className="mb-0">Genres: {album.genres.join(", ")}</p>
              )}
            </Col>
          </Row>

          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h2 className="h5">Track list</h2>
                <Link
                  to="/"
                  className="btn btn-outline-secondary btn-sm button-pill"
                >
                  Return to search
                </Link>
              </div>

              {loadError && <div className="text-danger mb-3">{loadError}</div>}

              <ListGroup as="ol" numbered>
                {trackItems.map((track) => (
                  <ListGroup.Item
                    as="li"
                    key={track.id}
                    className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3"
                  >
                    <div className="flex-grow-1">
                      <div className="fw-semibold">
                        {track.track_number}. {track.name}
                      </div>
                      <div className="text-muted small mb-2">
                        {track.artists
                          ?.map((artist) => artist.name)
                          .join(", ") ?? "Unknown artist"}
                      </div>
                      <div className="text-muted small">
                        {formatDuration(track.duration_ms)}
                      </div>
                    </div>

                    <div className="d-flex flex-column align-items-start align-items-md-end">
                      <Form.Group
                        className="mb-2"
                        controlId={`rating-${track.id}`}
                      >
                        <Form.Label className="small mb-1">Rate /10</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          max={10}
                          step={1}
                          value={draftRatings[track.id] ?? ""}
                          onChange={(event) =>
                            setDraftRating(track.id, event.target.value)
                          }
                          style={{ width: "100px" }}
                        />
                      </Form.Group>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => submitRating(track.id)}
                        disabled={submitting[track.id]}
                      >
                        {submitting[track.id] ? "Saving…" : "Save"}
                      </Button>
                      {savedRatings[track.id] !== undefined && (
                        <div className="text-success small mt-2">
                          Saved {savedRatings[track.id]}/10
                        </div>
                      )}
                      {errors[track.id] && (
                        <div className="text-danger small mt-2">
                          {errors[track.id]}
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
