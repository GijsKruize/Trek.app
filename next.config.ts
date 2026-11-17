import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8090", pathname: "/api/files/**" },
      { protocol: "http", hostname: "localhost", port: "8090", pathname: "/api/files/**" },
    ],
    // The image host above is this project's own local PocketBase (see
    // README setup) — a private IP, but not attacker-controlled, so
    // Next 16's extra SSRF guard on private-IP hosts (on top of the
    // remotePatterns allowlist already restricting protocol/port/path)
    // doesn't apply here. Revisit if PocketBase ever moves off localhost.
    dangerouslyAllowLocalIP: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
