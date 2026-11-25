import type { NextConfig } from "next";

// Files in public/ get `max-age=0` by default, so every repeat visit re-checks
// each image and track. Media here rarely changes, and a changed file gets a
// new name (see README, Media), so browsers may keep it for a day and serve it
// stale for a week while they re-check in the background.
const MEDIA_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const MEDIA_SOURCES = [
  "/audio/:file*",
  "/sfx/:file*",
  "/room/:file*",
  "/logos/:file*",
  "/placeholders/:file*",
  // Two segments on purpose: `/projects` alone is the all-projects page.
  "/projects/:dir/:file*",
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  headers() {
    return MEDIA_SOURCES.map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: MEDIA_CACHE }],
    }));
  },
};

export default nextConfig;
