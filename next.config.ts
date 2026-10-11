import type { NextConfig } from "next";

// Build guard: NEXT_PUBLIC_ variables are copied into the browser bundle, so the service role key
// must never be one (by name or by value). The "server-only" import in src/lib/supabase/admin.ts
// covers the other leak: the build fails if a Client Component imports that file.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
for (const [name, value] of Object.entries(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && (name.includes("SERVICE_ROLE") || (!!serviceKey && value === serviceKey))) {
    throw new Error(`${name} exposes the Supabase service role key to the browser. Remove it; use SUPABASE_SERVICE_ROLE_KEY.`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
