import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource-variable/caveat";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/outfit";
import "./styles/main.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
