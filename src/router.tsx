import { createBrowserRouter } from "react-router-dom";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import HomePage from "./pages/HomePage";
import AlbumPage from "./pages/AlbumPage";
import RatedAlbumsPage from "./pages/RatedAlbumsPage";
import PrivateRoute from "./components/PrivateRoute";
import SpotifyCallbackPage from "./pages/SpotifyCallbackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/album/:albumId",
    element: (
      <PrivateRoute>
        <AlbumPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/rated-albums",
    element: (
      <PrivateRoute>
        <RatedAlbumsPage />
      </PrivateRoute>
    ),
  },
  { path: "/spotify/callback", element: <SpotifyCallbackPage /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
]);
