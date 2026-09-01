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
      url: "https://market.talslings.info",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://market.talslings.info/faq",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...(data || []).map((listing: any) => ({
      url: `https://market.talslings.info/listing/${listing.id}`,
      lastModified: listing.created_at || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
