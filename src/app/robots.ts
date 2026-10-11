import type { MetadataRoute } from "next";

// Private app: ask every crawler to stay out (matches the noindex tag in the root layout).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
