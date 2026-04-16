import { Col, Row } from "react-bootstrap";
import AlbumCard from "./AlbumCard";
import type { SpotifyAlbum } from "../types/spotify";

type AlbumGridProps = {
  albums: SpotifyAlbum[];
};

export default function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <Row className="gx-4 gy-4 mx-2">
      {albums.map((album) => (
        <Col key={album.id} xs={12} sm={6} md={4} lg={3}>
          <AlbumCard album={album} />
        </Col>
      ))}
    </Row>
  );
}
