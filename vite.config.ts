import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://<user>.github.io/Card-creater/ on GitHub Pages.
  base: "/Card-creater/",
  plugins: [react()],
});
