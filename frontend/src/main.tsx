import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource-variable/outfit";
import "./index.css";
import "./material.css";
import "./motion.css";
import "./flavour-motion.css";
import "./spice-motion.css";
import "./cinematic-motion.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
