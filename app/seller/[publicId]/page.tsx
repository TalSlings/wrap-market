import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SIZES, labelOf } from "@/lib/constants";
import ShareShelfButton from "@/components/ShareShelfButton";

export const dynamic = "force-dynamic";

export default async function SellerPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const s = await createClient();

  const [{ data: profileRows }, { data: idRows }] =
    await Promise.all([
      s.rpc("get_public_seller_profile", {
        p_public_seller_id: publicId,
      }),
      s.rpc("get_public_seller_listing_ids", {
        p_public_seller_id: publicId,
      }),
    ]);

  const profile = profileRows?.[0];

  if (!profile) {
    notFound();
  }

  const ids = (idRows || []).map(
    (x: any) => x.listing_id
  );

  let listings: any[] = [];

  if (ids.length > 0) {
    const { data } = await s
      .from("listings")
      .select(
        `id,design,model,price,size,shipping_available,
        manufacturer:manufacturers(name),
        images:listing_images(storage_path,image_type,position)`
      )
      .in("id", ids)
      .eq("status", "active");

    listings = data || [];
  }

  const order = new Map<string, number>(
    ids.map(
      (id: string, i: number) =>
        [id, i] as [string, number]
    )
  );

  listings.sort(
    (a, b) =>
      (order.get(String(a.id)) ?? 9999) -
      (order.get(String(b.id)) ?? 9999)
  );

  const enriched: any[] = [];

  for (const l of listings) {
    const image = (l.images || [])
      .filter((x: any) => x.image_type === "listing")
      .sort(
        (a: any, b: any) =>
          Number(a.position || 0) -
          Number(b.position || 0)
      )[0];

    let image_url: string | null = null;

    if (image) {
      const { data } = await s.storage
        .from("listing-images")
        .createSignedUrl(
          image.storage_path,
          3600
        );

      image_url = data?.signedUrl || null;
    }

    enriched.push({
      ...l,
      image_url,
    });
  }

  const title = profile.display_name
    ? `המדף של ${profile.display_name}`
    : "מדף המנשאים";

  return (
    <main className="page">
      <div className="section">
        <div
          className="toolbar"
          style={{
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>{title}</h1>
            <div className="muted">
              {profile.active_listing_count}{" "}
              {Number(profile.active_listing_count) === 1
                ? "מנשא למכירה"
                : "מנשאים למכירה"}
            </div>
          </div>

          <ShareShelfButton />
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="section muted">
          אין כרגע מודעות פעילות במדף הזה.
        </div>
      ) : (
        <div className="grid-mode">
          {enriched.map((l: any) => (
            <Link
              key={l.id}
              className="listing"
              href={`/listing/${l.id}`}
            >
              {l.image_url ? (
                <img
                  className="listing-img"
                  src={l.image_url}
                  alt=""
                />
              ) : (
                <div className="listing-img" />
              )}

              <div className="listing-body">
                <div className="brand">
                  {l.manufacturer?.name}
                </div>

                <div className="design">
                  {l.design}
                </div>

                {l.model && (
                  <div className="model">
                    {l.model}
                  </div>
                )}

                <div className="meta">
                  {labelOf(SIZES, l.size)} ·{" "}
                  {l.price} ₪
                </div>

                {l.shipping_available && (
                  <div className="muted">
                    🚚 משלוח זמין
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
