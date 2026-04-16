import { Link } from "react-router-dom";
import { Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { UserAuth } from "../context/AuthContext";
import { useAllRatedAlbums } from "../hooks/useRatedAlbums";

export default function RatedAlbumsPage() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { allRatedAlbums, isLoading, error } = useAllRatedAlbums(userId);

  return (
    <Container className="py-5">
      <div className="main-header">
        <div>
          <h1>Your rated albums</h1>
          <p className="text-muted">
            Sorted by average rating from highest to lowest.
          </p>
        </div>
        <div className="page-actions">
          <Link
            to="/"
            className="btn btn-outline-secondary button-pill"
          >
            Back to search
          </Link>
        </div>
      </div>

      {isLoading && (
        <div>
          <Spinner animation="border" role="status" size="sm" /> Loading rated
          albums...
        </div>
      )}

      {error && <div className="text-danger mb-3">{error}</div>}

      {!isLoading && allRatedAlbums.length === 0 && (
        <div className="text-muted">You have not rated any albums yet.</div>
      )}

      <Row xs={1} md={2} lg={3} className="g-4">
        {allRatedAlbums.map((ratedAlbum) => (
          <Col key={ratedAlbum.album_id}>
            <Card
              as={Link}
              to={`/album/${ratedAlbum.album_id}`}
              className="h-100 text-decoration-none text-dark card-fade"
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
                <Card.Title>{ratedAlbum.album.name}</Card.Title>
                <Card.Text className="text-muted mb-2">
                  {ratedAlbum.album.artists
                    ?.map((artist) => artist.name)
                    .join(", ") ?? "Unknown artist"}
                </Card.Text>
                <Card.Text className="mb-2">
                  Average rating: {ratedAlbum.average_rating.toFixed(1)} / 10
                </Card.Text>
                <Card.Text className="text-muted small mb-3">
                  {ratedAlbum.rating_count} track rating
                  {ratedAlbum.rating_count === 1 ? "" : "s"}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
