import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { AuthContextProvider } from "./context/AuthContext.tsx";

if (window.location.hostname === "localhost") {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.hostname = "127.0.0.1";
  window.location.replace(canonicalUrl.toString());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  </StrictMode>,
);
