import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/sipzone/",
  plugins: [react()],
  server: {
    proxy: {
      "/sipzone/api/rooms": { target: "http://localhost:8788", ws: true },
      "/api/rooms": { target: "http://localhost:8788", ws: true },
      ...Object.fromEntries(
        ["/api/auth", "/api/profile", "/api/account"].map((path) => [
          path,
          { target: "http://localhost:8789" },
        ]),
      ),
    },
  },
});
