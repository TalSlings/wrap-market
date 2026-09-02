import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await createClient();
  const { data } = await s
    .from("listings")
    .select("id,created_at")
    .in("status", ["active", "incomplete"]);

  return [
    {
      url: "https://ksharim-baby.org.il",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://ksharim-baby.org.il/faq",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://ksharim-baby.org.il/safety",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...(data || []).map((listing: any) => ({
      url: `https://ksharim-baby.org.il/listing/${listing.id}`,
      lastModified: listing.created_at || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
