import { notFound } from "next/navigation";
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

export const dynamic = "force-dynamic";

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
        material:materials(name,vegan,material_origin)
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

  const locationGroups = Array.from(
    (l.locations || []).reduce(
      (map: Map<string, Set<string>>, x: any) => {
        const regionName = x.region?.name;
        if (!regionName) return map;

        if (!map.has(regionName)) {
          map.set(regionName, new Set<string>());
        }

        if (x.subregion?.name) {
          map.get(regionName)!.add(x.subregion.name);
        }

        return map;
      },
      new Map<string, Set<string>>()
    )
  ).map(([regionName, subNames]) => ({
    regionName,
    subNames: Array.from(subNames),
  }));

  return (
    <main className="page">
      <div className="section">
        {main[0]?.url && (
          <img
            className="gallery-main"
            src={main[0].url}
            alt=""
          />
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

      <div className="section">
        <div
          className="toolbar"
          style={{
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={{ marginTop: 0 }}>
              {l.manufacturer?.name}
            </h1>

            <div className="design">
              {l.design}
            </div>

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

        <p>
          {labelOf(SIZES, l.size)}
          {l.size_note && ` · ${l.size_note}`}
        </p>

        <p>{l.price} ₪</p>

        <div className="details">
          <div>
            <b>GSM</b>
            <br />
            {labelOf(GSM, l.gsm)}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>הרכב</h2>

        {(l.materials || []).map(
          (x: any, i: number) => (
            <p key={i}>
              {x.percentage}% {x.material?.name}
            </p>
          )
        )}
      </div>

      <div className="section">
        <h2>מסירה</h2>

        <div>
          {locationGroups.map(
            ({ regionName, subNames }) => (
              <div
                key={regionName}
                style={{ marginBottom: 10 }}
              >
                <div>
                  📍 <b>{regionName}</b>
                </div>

                {subNames.length > 0 && (
                  <div
                    className="muted"
                    style={{ marginInlineStart: 24 }}
                  >
                    {subNames.join(" · ")}
                  </div>
                )}
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

      <div className="section">
        <h2>מצב ופגמים</h2>

        <p>
          <b>מצב המנשא:</b>{" "}
          {labelOf(CONDITIONS, l.condition)}
        </p>

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

      <ContactBox
        listingId={id}
        userId={user?.id}
      />
    </main>
  );
}
