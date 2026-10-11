import type { MetadataRoute } from "next";

// Makes "Add to Home Screen" open Epoch like an app: own icon, no browser bar, dark splash screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Epoch",
    short_name: "Epoch",
    description: "Train yourself. One epoch at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1320",
    theme_color: "#0f1320",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
