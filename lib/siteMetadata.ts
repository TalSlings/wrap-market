import type { Metadata } from "next";

export const KSHARIM_NAME = "קשרים";
export const MARKET_NAME = "רק ארוגים (וטבעות)";

// These intentionally point to the same image for now. Keeping two constants
// lets the Ksharim brand receive its own share image later without changing
// every market page again.
export const KSHARIM_SHARE_IMAGE = "/opengraph-image";
export const MARKET_SHARE_IMAGE = "/opengraph-image";

type ShareMetadataOptions = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
};

function shareMetadata(
  siteName: string,
  defaultImage: string,
  { title, description, url, image }: ShareMetadataOptions
): Metadata {
  const shareImage = image || defaultImage;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName,
      title,
      description,
      url,
      images: [{ url: shareImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export function ksharimPageMetadata(options: ShareMetadataOptions): Metadata {
  return shareMetadata(KSHARIM_NAME, KSHARIM_SHARE_IMAGE, options);
}

export function marketPageMetadata(options: ShareMetadataOptions): Metadata {
  return shareMetadata(MARKET_NAME, MARKET_SHARE_IMAGE, options);
}

