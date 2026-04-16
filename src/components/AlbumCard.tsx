import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { SpotifyAlbum } from "../types/spotify";

type AlbumCardProps = {
  album: SpotifyAlbum;
};

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Card
      as={Link}
      to={`/album/${encodeURIComponent(album.id)}`}
      className="mb-3 h-100 album-card text-decoration-none text-reset"
    >
      <div className="album-card-image-wrapper">
        <Card.Img
          variant="top"
          src={album.images?.[0]?.url ?? "https://via.placeholder.com/150"}
          alt={album.name ?? "Album cover"}
        />
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="album-card-title text-truncate">
          {album.name ?? "Unknown Album"}
        </Card.Title>
        <Card.Text className="text-muted mb-3">
          {album.artists?.map((artist) => artist.name).join(", ") ??
            "Unknown artist"}
        </Card.Text>
        <div className="mt-auto">
          <Card.Text className="text-secondary">
            {album.release_date ?? "No release date"}
          </Card.Text>
        </div>
      </Card.Body>
    </Card>
  );
}
