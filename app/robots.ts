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
    sitemap: "https://ksharim-baby.org.il/sitemap.xml",
    host: "https://ksharim-baby.org.il",
  };
}
