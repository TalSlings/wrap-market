import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/listing/"],
      disallow: [
        "/account",
        "/admin",
        "/auth/",
        "/login",
        "/new",
        "/suspended",
      ],
    },
    sitemap: "https://market.talslings.info/sitemap.xml",
    host: "https://market.talslings.info",
  };
}
