import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true
      },
      "/stt": "http://localhost:8000",
      "/cv": "http://localhost:8000",
      "/llm": "http://localhost:8000",
      "/health": "http://localhost:8000"
    }
  }
});
