import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  SIZES,
  GSM,
  CONDITIONS,
  DEFECTS,
  labelOf,
} from "@/lib/constants";
import ContactBox from "@/components/ContactBox";
import FavoriteButton from "@/components/FavoriteButton";
import type { Metadata } from "next";
import { FeatureBadge } from "@/components/DesignMotifs";
import { isEasyCareBlend } from "@/lib/materialFeatures";

export const dynamic = "force-dynamic";

function listingTitle(l: any) {
  return [l.manufacturer?.name, l.design, l.model]
    .filter(Boolean)
    .join(" — ") || "מנשא ארוג יד שנייה";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await createClient();
  const { data: l } = await s
    .from("listings")
    .select(`id,status,design,model,size,price,
      manufacturer:manufacturers(name),
      images:listing_images(storage_path,image_type,position)`)
    .eq("id", id)
    .maybeSingle();

  if (!l) {
    return { title: "המודעה לא נמצאה", robots: { index: false, follow: false } };
  }

  const title = listingTitle(l);
  const details = [
    l.size ? `מידה ${l.size}` : null,
    Number(l.price) > 0 ? `${l.price} ₪` : null,
  ].filter(Boolean).join(", ");
  const description = `${title}${details ? `, ${details}` : ""}. מנשא יד שנייה למכירה בישראל.`;
  const isPublic = ["active", "incomplete"].includes(l.status);
  const image = (l.images || [])
    .filter((x: any) => x.image_type === "listing")
    .sort((a: any, b: any) => Number(a.position || 0) - Number(b.position || 0))[0];
  let imageUrl: string | undefined;

  if (image) {
    const { data } = await s.storage
      .from("listing-images")
      .createSignedUrl(image.storage_path, 60 * 60 * 24 * 7);
    imageUrl = data?.signedUrl;
  }

  return {
    title,
    description,
    alternates: { canonical: `/listing/${id}` },
    robots: { index: isPublic, follow: isPublic },
    openGraph: {
      type: "website",
      locale: "he_IL",
      url: `/listing/${id}`,
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

function normalizeExternalUrl(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  const { data: l } = await s
    .from("listings")
    .select(
      `*,
      manufacturer:manufacturers(name),
      materials:listing_materials(
        percentage,
        material:materials(id,name,parent_material_id,vegan,material_origin)
      ),
      locations:listing_locations(
        region:regions(name),
        subregion:subregions(name)
      ),
      images:listing_images(
        storage_path,
        image_type,
        position
      )`
    )
    .eq("id", id)
    .single();

  if (!l) notFound();

  const { data: materialCatalog } = await s
    .from("materials")
    .select("id,name,parent_material_id");

  let initialFavorite = false;

  if (user) {
    const { data: favorite } = await s
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();

    initialFavorite = !!favorite;
  }

  const { data: sellerRows } = await s.rpc(
    "get_listing_seller_public_profile",
    {
      p_listing_id: id,
    }
  );

  const seller = sellerRows?.[0] || null;

  const urls: any[] = [];

  for (const im of l.images || []) {
    const { data } = await s.storage
      .from("listing-images")
      .createSignedUrl(im.storage_path, 3600);

    urls.push({
      ...im,
      url: data?.signedUrl,
    });
  }

  const main = urls
    .filter((x) => x.image_type === "listing")
    .sort((a, b) => a.position - b.position);

  const defectImages = urls
    .filter((x) => x.image_type === "defect")
    .sort((a, b) => a.position - b.position);

  const defectKeys = (l.defects || []).filter(
    (key: string) => key && key !== "none"
  );

  const moreInfoHref = normalizeExternalUrl(l.more_info_url);

  const locationMap = new Map<
    string,
    {
      wholeRegion: boolean;
      subNames: Set<string>;
    }
  >();

  for (const x of l.locations || []) {
    const regionName = x.region?.name;

    if (!regionName) {
      continue;
    }

    if (!locationMap.has(regionName)) {
      locationMap.set(regionName, {
        wholeRegion: false,
        subNames: new Set<string>(),
      });
    }

    const group = locationMap.get(regionName)!;

    if (!x.subregion?.name) {
      group.wholeRegion = true;
    } else {
      group.subNames.add(x.subregion.name);
    }
  }

  const locationGroups: {
    regionName: string;
    wholeRegion: boolean;
    subNames: string[];
  }[] = Array.from(locationMap.entries()).map(
    ([regionName, group]) => ({
      regionName,
      wholeRegion: group.wholeRegion,
      subNames: Array.from(group.subNames),
    })
  );

  return (
    <main className="page">
      <div className="section">
        {main[0]?.url ? (
          <img
            className="gallery-main"
            src={main[0].url}
            alt=""
          />
        ) : (
          <div
            className="gallery-main"
            role="img"
            aria-label="אין תמונה"
            style={{
              position: "relative",
              background: "#e5e5e5",
              overflow: "hidden",
              minHeight: 320,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "140%",
                height: 2,
                background: "#555",
                top: "50%",
                left: "-20%",
                transform: "rotate(-32deg)",
              }}
            />
          </div>
        )}

        <div className="thumbrow">
          {main.slice(1).map((x, i) => (
            <img
              className="thumb"
              key={i}
              src={x.url}
              alt=""
            />
          ))}
        </div>
      </div>

      {l.status === "incomplete" && (
        <div className="section notice">
          <strong>מודעה חלקית</strong>
          <div style={{ marginTop: 4 }}>
            המודעה פורסמה לפני שכל הפרטים הושלמו.
          </div>
        </div>
      )}

      <div className="section">
        <div
          className="toolbar"
          style={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            {l.status === "incomplete" && (
              <div
                className="badge"
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                }}
              >
                מודעה חלקית
              </div>
            )}

            <h1 style={{ marginTop: 0 }}>
              {l.manufacturer?.name ||
                (l.design ? l.design : "מודעה חלקית")}
            </h1>

            {l.manufacturer?.name && l.design && (
              <div className="design">
                {l.design}
              </div>
            )}

            {l.model && (
              <div className="model">
                {l.model}
              </div>
            )}
          </div>

          <FavoriteButton
            listingId={id}
            userId={user?.id}
            initialFavorite={initialFavorite}
          />
        </div>

        {l.size && (
          <p>
            {labelOf(SIZES, l.size)}
            {l.size_note && ` · ${l.size_note}`}
          </p>
        )}

        {Number(l.price) > 0 && (
          <p>{l.price} ₪</p>
        )}

        {l.gsm && l.gsm !== "unknown" && (
          <div className="details">
            <div>
              <b>GSM</b>
              <br />
              {labelOf(GSM, l.gsm)}
            </div>
          </div>
        )}
      </div>

      {(l.materials || []).length > 0 && (
        <div className="section">
          <h2>הרכב</h2>

          {isEasyCareBlend(l.materials || [], materialCatalog || []) && (
            <div className="icons" style={{ marginBottom: 8 }}>
              <FeatureBadge type="easycare" />
              <span className="muted">איזיקייר</span>
            </div>
          )}

          {(l.materials || []).map(
            (x: any, i: number) => (
              <p key={i}>
                {x.percentage}% {x.material?.name}
              </p>
            )
          )}
        </div>
      )}

      {(locationGroups.length > 0 ||
        l.shipping_available) && (
        <div className="section">
        <h2>מסירה</h2>

        <div>
          {locationGroups.map(
            ({ regionName, wholeRegion, subNames }) => (
              <div
                key={regionName}
                style={{ marginBottom: 14 }}
              >
                <div>
                  📍 <b>{regionName}</b>
                </div>

                <div
                  className="muted"
                  style={{
                    marginInlineStart: 24,
                    marginTop: 3,
                  }}
                >
                  {wholeRegion
                    ? "איסוף מכל האזור"
                    : subNames.join(" · ")}
                </div>
              </div>
            )
          )}
        </div>

        <p>
          {l.shipping_available
            ? "🚚 משלוח זמין"
            : "ללא משלוח"}
        </p>

        {l.shipping_available && (
          <p className="notice">
            דמי משלוח על חשבון הקונה אלא אם צוין אחרת.
          </p>
        )}
        </div>
      )}

      {l.description && (
        <div className="section">
          <h2>תיאור</h2>
          <p>{l.description}</p>
        </div>
      )}

      {moreInfoHref && (
        <div className="section">
          <a
            className="btn"
            href={moreInfoHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            מידע נוסף על המנשא ↗
          </a>
        </div>
      )}

      {(l.condition ||
        defectKeys.length > 0 ||
        l.defects_description ||
        defectImages.length > 0) && (
        <div className="section">
        <h2>מצב ופגמים</h2>

        {l.condition && (
          <p>
            <b>מצב המנשא:</b>{" "}
            {labelOf(CONDITIONS, l.condition)}
          </p>
        )}

        {defectKeys.length === 0 ? (
          <p>לא צוינו פגמים ידועים.</p>
        ) : (
          <>
            <div>
              <b>פגמים:</b>

              <ul>
                {defectKeys.map((key: string) => (
                  <li key={key}>
                    {labelOf(DEFECTS, key)}
                  </li>
                ))}
              </ul>
            </div>

            {l.defects_description && (
              <div>
                <b>פירוט הפגמים:</b>
                <p>{l.defects_description}</p>
              </div>
            )}
          </>
        )}

        {defectImages.length > 0 && (
          <div>
            <b>תמונות הפגמים:</b>

            <div
              className="thumbrow"
              style={{ marginTop: 8 }}
            >
              {defectImages.map((x, i) => (
                <img
                  className="thumb"
                  key={i}
                  src={x.url}
                  alt="תמונת פגם"
                />
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {seller?.public_seller_id && (
        <div className="section">
          <h2>
            {seller.display_name
              ? `עוד מהמדף של ${seller.display_name}`
              : "עוד מהמדף הזה"}
          </h2>

          <Link
            className="btn"
            href={`/seller/${seller.public_seller_id}`}
          >
            לכל המנשאים במדף
          </Link>
        </div>
      )}

      <ContactBox
        listingId={id}
        userId={user?.id}
      />
    </main>
  );
}
