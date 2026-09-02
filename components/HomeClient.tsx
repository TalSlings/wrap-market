"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import ImpressionTracker from "@/components/ImpressionTracker";
import { FeatureBadge, LooseThread, WovenCorner } from "@/components/DesignMotifs";
import ShareButton from "@/components/ShareButton";
import HelpNote from "@/components/HelpNote";
import {
  SORTS,
  SIZES,
  GSM,
  CONDITIONS,
  CONDITION_HELP,
  DEFECTS,
  COLOR_PATTERNS,
  labelOf,
} from "@/lib/constants";
import {
  FlatMultiSelect,
  HierarchicalMultiSelect,
} from "@/components/HierarchicalSelect";
import { createClient } from "@/lib/supabase/client";
import { helpText } from "@/lib/helpNotes";

const rank: any = {
  lte_180: 180,
  "190": 190,
  "200": 200,
  "210": 210,
  "220": 220,
  "230": 230,
  "240": 240,
  "250": 250,
  "260": 260,
  "270": 270,
  "280": 280,
  "290": 290,
  "300": 300,
  "310": 310,
  "320": 320,
  "330": 330,
  "340": 340,
  gte_350: 350,
};

const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export default function HomeClient({
  listings,
  manufacturers,
  materials,
  colors,
  regions,
  subregions,
  userId,
  favoriteIds = [],
  initial,
  helpNotes = [],
}: {
  [k: string]: any;
}) {
  const searchHelp = (key: string, fallback: string) =>
    helpText(helpNotes, key, "search", fallback);
  const [q, setQ] = useState(initial?.q || "");
  const [manufacturerIds, setManufacturerIds] = useState<string[]>(
    initial?.manufacturerIds || []
  );
  const [sizes, setSizes] = useState<string[]>(initial?.sizes || []);
  const [mats, setMats] = useState<string[]>(initial?.mats || []);
  const [regs, setRegs] = useState<string[]>(initial?.regs || []);
  const [subs, setSubs] = useState<string[]>(initial?.subs || []);
  const [colorKeys, setColorKeys] = useState<string[]>(
    initial?.colorKeys || []
  );
  const [colorPatterns, setColorPatterns] = useState<string[]>(
    initial?.colorPatterns || []
  );
  const [conditions, setConditions] = useState<string[]>(
    initial?.conditions || []
  );
  const [defectFilters, setDefectFilters] = useState<string[]>(
    initial?.defectFilters || []
  );

  const [vegan, setVegan] = useState(!!initial?.vegan);
  const [natural, setNatural] = useState(!!initial?.natural);
  const [easyCare, setEasyCare] = useState(!!initial?.easyCare);
  const [shippingOnly, setShippingOnly] = useState(!!initial?.shippingOnly);
  const [gmin, setGmin] = useState(initial?.gmin || "");
  const [gmax, setGmax] = useState(initial?.gmax || "");
  const [unknown, setUnknown] = useState(initial?.unknown !== false);
  const [priceMin, setPriceMin] = useState(initial?.priceMin || "");
  const [priceMax, setPriceMax] = useState(initial?.priceMax || "");
  const [sort, setSort] = useState(initial?.sort || "stable_random");
  const [grid, setGrid] = useState(!!initial?.grid);

  const favoriteSet = useMemo(
    () => new Set(favoriteIds),
    [favoriteIds]
  );

  const manufacturerOptions = useMemo(
    () =>
      manufacturers.map((m: any) => ({
        id: m.id,
        name: m.name,
      })),
    [manufacturers]
  );

  const sizeOptions = useMemo(
    () =>
      SIZES.map(([id, name]) => ({
        id,
        name,
      })),
    []
  );

  const patternOptions = useMemo(
    () =>
      COLOR_PATTERNS.map(([id, name]) => ({
        id,
        name,
      })),
    []
  );

  const conditionOptions = useMemo(
    () =>
      CONDITIONS.map(([id, name]) => ({
        id,
        name,
      })),
    []
  );

  const defectOptions = useMemo(
    () =>
      DEFECTS.map(([id, name]) => ({
        id,
        name,
      })),
    []
  );

  const materialParents = useMemo(
    () =>
      materials
        .filter(
          (m: any) =>
            !m.parent_material_id &&
            m.status !== "hidden"
        )
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          selectable: m.is_selectable !== false,
        }))
        .sort((a: any, b: any) =>
          a.name.localeCompare(b.name, "he")
        ),
    [materials]
  );

  const materialChildren = useMemo(
    () =>
      materials
        .filter(
          (m: any) =>
            m.parent_material_id &&
            m.status !== "hidden"
        )
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          parent_id: m.parent_material_id,
        })),
    [materials]
  );

  const regionParents = useMemo(
    () =>
      regions.map((r: any) => ({
        id: r.id,
        name: r.name,
        selectable: true,
      })),
    [regions]
  );

  const regionChildren = useMemo(
    () =>
      subregions.map((s: any) => ({
        id: s.id,
        name: s.name,
        parent_id: s.region_id,
      })),
    [subregions]
  );

  const selectedLocations = useMemo(
    () => [...regs, ...subs],
    [regs, subs]
  );

  const setSelectedLocations = (ids: string[]) => {
    const regionSet = new Set(regions.map((r: any) => r.id));
    const subSet = new Set(subregions.map((s: any) => s.id));

    setRegs(ids.filter((id) => regionSet.has(id)));
    setSubs(ids.filter((id) => subSet.has(id)));
  };

  const clearFilters = () => {
    setQ("");
    setManufacturerIds([]);
    setSizes([]);
    setMats([]);
    setRegs([]);
    setSubs([]);
    setColorKeys([]);
    setColorPatterns([]);
    setConditions([]);
    setDefectFilters([]);
    setVegan(false);
    setNatural(false);
    setEasyCare(false);
    setShippingOnly(false);
    setGmin("");
    setGmax("");
    setUnknown(true);
    setPriceMin("");
    setPriceMax("");
  };

  const advancedActive =
    !!q ||
    colorKeys.length > 0 ||
    colorPatterns.length > 0 ||
    conditions.length > 0 ||
    defectFilters.length > 0 ||
    !!gmin ||
    !!gmax ||
    unknown === false ||
    priceMin !== "" ||
    priceMax !== "";

  const out = useMemo(() => {
    let x = listings.filter((l: any) => {
      const text =
        `${l.manufacturer?.name || ""} ${l.design} ${l.model || ""} ${l.description || ""} ${l.size}`.toLowerCase();

      if (q && !text.includes(q.toLowerCase())) return false;

      if (
        manufacturerIds.length &&
        !manufacturerIds.includes(l.manufacturer_id)
      ) {
        return false;
      }

      if (sizes.length && !sizes.includes(l.size)) return false;

      const lm = l.materials || [];

      if ((vegan || natural || easyCare) && (l.material_composition_unknown || lm.length === 0)) return false;

      if (
        mats.length &&
        !lm.some((m: any) => mats.includes(m.material_id))
      ) {
        return false;
      }

      if (
        colorKeys.length &&
        !(l.colors || []).some((c: string) =>
          colorKeys.includes(c)
        )
      ) {
        return false;
      }

      if (
        colorPatterns.length &&
        !(l.color_patterns || []).some((p: string) =>
          colorPatterns.includes(p)
        )
      ) {
        return false;
      }

      if (
        conditions.length &&
        !conditions.includes(l.condition)
      ) {
        return false;
      }

      if (
        defectFilters.length &&
        !(l.defects || []).some((d: string) =>
          defectFilters.includes(d)
        )
      ) {
        return false;
      }

      if (
        vegan &&
        !lm.every((m: any) => m.material?.vegan)
      ) {
        return false;
      }

      if (
        natural &&
        !lm.every(
          (m: any) =>
            m.material?.material_origin === "natural"
        )
      ) {
        return false;
      }

      if (
        easyCare &&
        !lm.every((m: any) => m.material?.easycare)
      ) {
        return false;
      }

      if (shippingOnly && !l.shipping_available) return false;

      if (regs.length || subs.length) {
        const matches = (l.locations || []).some(
          (z: any) =>
            regs.includes(z.region_id) ||
            (z.subregion_id &&
              subs.includes(z.subregion_id))
        );

        if (!matches) return false;
      }

      if (gmin || gmax) {
        if (l.gsm === "unknown") {
          if (!unknown) return false;
        } else {
          const r = rank[l.gsm] || 0;
          if (gmin && r < (rank[gmin] || 0)) return false;
          if (gmax && r > (rank[gmax] || 999)) return false;
        }
      }

      const price = Number(l.price || 0);

      if (
        priceMin !== "" &&
        price < Number(priceMin)
      ) {
        return false;
      }

      if (
        priceMax !== "" &&
        price > Number(priceMax)
      ) {
        return false;
      }

      return true;
    });

    x = [...x];

    if (sort === "price_asc") {
      x.sort((a: any, b: any) => a.price - b.price);
    } else if (sort === "price_desc") {
      x.sort((a: any, b: any) => b.price - a.price);
    } else if (sort === "newest") {
      x.sort(
        (a: any, b: any) =>
          Date.parse(b.created_at) -
          Date.parse(a.created_at)
      );
    } else if (sort === "oldest") {
      x.sort(
        (a: any, b: any) =>
          Date.parse(a.created_at) -
          Date.parse(b.created_at)
      );
    } else if (sort === "manufacturer") {
      x.sort((a: any, b: any) =>
        (a.manufacturer?.name || "").localeCompare(
          b.manufacturer?.name || "",
          "he"
        )
      );
    } else {
      const d = new Date().toISOString().slice(0, 10);
      x.sort(
        (a: any, b: any) =>
          hash(a.id + d) -
          hash(b.id + d)
      );
    }

    // Partial listings always appear after complete listings,
    // regardless of the selected sort. JS sort is stable, so
    // the chosen ordering is preserved inside each group.
    x.sort(
      (a: any, b: any) =>
        Number(a.status === "incomplete") -
        Number(b.status === "incomplete")
    );

    return x;
  }, [
    listings,
    q,
    manufacturerIds,
    sizes,
    mats,
    regs,
    subs,
    colorKeys,
    colorPatterns,
    conditions,
    defectFilters,
    vegan,
    natural,
    easyCare,
    shippingOnly,
    gmin,
    gmax,
    unknown,
    priceMin,
    priceMax,
    sort,
  ]);

  const save = async () => {
    if (!userId) {
      location.href = "/login";
      return;
    }

    const name = prompt("שם לחיפוש");
    if (!name) return;

    const { error } = await createClient()
      .from("saved_searches")
      .insert({
        user_id: userId,
        name,
        filters: {
          q,
          manufacturerIds,
          sizes,
          mats,
          regs,
          subs,
          colorKeys,
          colorPatterns,
          conditions,
          defectFilters,
          vegan,
          natural,
          easyCare,
          shippingOnly,
          gmin,
          gmax,
          unknown,
          priceMin,
          priceMax,
        },
        sort_key: sort,
      });

    if (error) {
      alert(`לא הצלחנו לשמור את החיפוש: ${error.message}`);
      return;
    }

    alert("החיפוש נשמר");
  };

  const share = () => {
    const raw = JSON.stringify({
      q,
      manufacturerIds,
      sizes,
      mats,
      regs,
      subs,
      colorKeys,
      colorPatterns,
      conditions,
      defectFilters,
      vegan,
      natural,
      easyCare,
      shippingOnly,
      gmin,
      gmax,
      unknown,
      priceMin,
      priceMax,
      sort,
      grid,
    });

    navigator.clipboard.writeText(
      `${location.origin}/?shared=${encodeURIComponent(
        btoa(
          unescape(
            encodeURIComponent(raw)
          )
        )
      )}`
    );

    alert("הקישור הועתק");
  };

  async function openListing(
    e: React.MouseEvent<HTMLAnchorElement>,
    listingId: string
  ) {
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();

    await createClient().rpc(
      "increment_listing_click",
      { p_listing_id: listingId }
    );

    location.href = `/listing/${listingId}`;
  }

  return (
    <main className="page">
      <div className="filters">
        <div>
          <b>סינון</b>
          <HelpNote content={searchHelp("filter_logic", "כשבוחרים כמה אפשרויות בתוך אותו סוג סינון, תופיע מודעה שמתאימה לפחות לאחת מהן. בין סוגי סינון שונים נדרשת התאמה לכולם.")} />
        </div>
        <FlatMultiSelect
          label="יצרן"
          placeholder="כל היצרנים"
          options={manufacturerOptions}
          selectedIds={manufacturerIds}
          onChange={setManufacturerIds}
        />

        <FlatMultiSelect
          label="מידה"
          placeholder="כל המידות"
          options={sizeOptions}
          selectedIds={sizes}
          onChange={setSizes}
        />
        <HierarchicalMultiSelect
          label="חומרים"
          placeholder="כל החומרים"
          parents={materialParents}
          children={materialChildren}
          selectedIds={mats}
          onChange={setMats}
        />

        <div className="chips">
          <label className="chip">
            <input
              type="checkbox"
              checked={vegan}
              onChange={(e) => setVegan(e.target.checked)}
            />{" "}
            טבעוני
          </label>

          <label className="chip">
            <input
              type="checkbox"
              checked={natural}
              onChange={(e) => setNatural(e.target.checked)}
            />{" "}
            חומרים טבעיים
          </label>

          <label className="chip">
            <input
              type="checkbox"
              checked={easyCare}
              onChange={(e) => setEasyCare(e.target.checked)}
            />{" "}
            איזיקייר
          </label>
        </div>

        <HierarchicalMultiSelect
          label="אזורים"
          placeholder="כל האזורים"
          parents={regionParents}
          children={regionChildren}
          selectedIds={selectedLocations}
          onChange={setSelectedLocations}
        />

        <label className="chip">
          <input type="checkbox" checked={shippingOnly} onChange={(e) => setShippingOnly(e.target.checked)} />{" "}
          רק מודעות שמציעות משלוח
        </label>

        <details
          className="section"
          style={{ marginTop: 8 }}
        >
          <summary style={{ cursor: "pointer" }}>
            <b>חיפוש מתקדם</b>
            {advancedActive ? " · פעיל" : ""}
          </summary>

          <div style={{ paddingTop: 12 }}>
            <div className="field">
              <label>מחיר</label>
              <div className="toolbar">
                <input
                  className="input"
                  aria-label="מחיר מינימום"
                  inputMode="numeric"
                  placeholder="מ־"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
                <input
                  className="input"
                  aria-label="מחיר מקסימום"
                  inputMode="numeric"
                  placeholder="עד־"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>GSM <HelpNote content={searchHelp("gsm", "אפשר לכלול בתוצאות גם מודעות שבהן ה־GSM לא ידוע.")} faqHref="/faq#gsm" /></label>
              <div className="toolbar">
                <select
                  className="select"
                  aria-label="GSM מינימום"
                  value={gmin}
                  onChange={(e) => setGmin(e.target.value)}
                >
                  <option value="">מ־הכול</option>
                  {GSM.filter(([k]) => k !== "unknown").map(
                    ([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    )
                  )}
                </select>

                <select
                  className="select"
                  aria-label="GSM מקסימום"
                  value={gmax}
                  onChange={(e) => setGmax(e.target.value)}
                >
                  <option value="">עד הכול</option>
                  {GSM.filter(([k]) => k !== "unknown").map(
                    ([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    )
                  )}
                </select>
              </div>

              <label>
                <input
                  type="checkbox"
                  checked={unknown}
                  onChange={(e) => setUnknown(e.target.checked)}
                />{" "}
                לכלול גם GSM לא ידוע
              </label>
            </div>

            <div className="field">
              <label>צבע</label>
              <div className="chips">
                {colors.map((c: any) => {
                  const active = colorKeys.includes(c.key);

                  return (
                    <button
                      type="button"
                      key={c.key}
                      className={
                        "chip " +
                        (active ? "active" : "")
                      }
                      onClick={() =>
                        setColorKeys(
                          active
                            ? colorKeys.filter(
                                (x) => x !== c.key
                              )
                            : [...colorKeys, c.key]
                        )
                      }
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={active}
                      style={{
                        width: 34,
                        height: 34,
                        padding: 4,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          display: "block",
                          background: c.hex,
                          border:
                            "1px solid rgba(0,0,0,.18)",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <FlatMultiSelect
              label="תכונות צבע"
              placeholder="כל תכונות הצבע"
              options={patternOptions}
              selectedIds={colorPatterns}
              onChange={setColorPatterns}
              optionHelp={Object.fromEntries(
                COLOR_PATTERNS.map(([id]) => [
                  id,
                  {
                    content: searchHelp(`color_pattern_${id}`, ""),
                    faqHref: "/faq#color-patterns",
                  },
                ])
              )}
            />

            <FlatMultiSelect
              label={
                <>
                  מצב המנשא
                  <HelpNote
                    content={searchHelp(
                      "condition",
                      CONDITIONS.map(
                        ([key, label]) => `${label} — ${CONDITION_HELP[key]}`
                      ).join("\n")
                    )}
                    faqHref="/faq#condition"
                  />
                </>
              }
              placeholder="כל המצבים"
              options={conditionOptions}
              selectedIds={conditions}
              onChange={setConditions}
            />

            <FlatMultiSelect
              label="פגמים"
              placeholder="כל סוגי הפגמים"
              options={defectOptions}
              selectedIds={defectFilters}
              onChange={setDefectFilters}
            />

            <div className="field">
              <label>חיפוש חופשי</label>
              <input
                className="input"
                aria-label="חיפוש חופשי"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="יצרן, עיצוב, מודל..."
              />
            </div>
          </div>
        </details>

        <div className="toolbar">
          <button
            type="button"
            className="btn"
            onClick={clearFilters}
          >
            ניקוי סינון
          </button>
        </div>
      </div>

      <div className="toolbar results-toolbar">
        <b>{out.length} מודעות</b>

        <select
          className="select"
          aria-label="מיון המודעות"
          style={{ width: "auto" }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORTS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>

        <button
          className="btn"
          onClick={() => setGrid(!grid)}
        >
          {grid ? "☰ רשימה" : "▦ גריד"}
        </button>

        <button className="btn" onClick={save}>
          שמרי חיפוש
        </button>

        <button className="btn" onClick={share}>
          שתפי
        </button>
      </div>

      <div className={grid ? "grid-mode" : ""}>
        {out.map((l: any) => (
          <div className="listing-share-wrap" key={l.id}>
          <Link
            className={
              "listing " +
              (l.status === "incomplete"
                ? "incomplete-listing"
                : "")
            }
            href={`/listing/${l.id}`}
            onClick={(e) => openListing(e, l.id)}
          >
            <WovenCorner />
            {l.image_url ? (
              <img
                className="listing-img"
                src={l.image_url}
                alt=""
              />
            ) : (
              <div
                className="listing-img"
                aria-label="אין תמונה"
                role="img"
                style={{
                  position: "relative",
                  background: "#e5e5e5",
                  overflow: "hidden",
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
                    transformOrigin: "center",
                  }}
                />
              </div>
            )}

            {l.status === "incomplete" && (
              <div
                className="badge"
                style={{
                  position: "absolute",
                  insetInlineStart: 8,
                  top: 8,
                  zIndex: 3,
                }}
              >
                מודעה חלקית
              </div>
            )}

            <div
              style={{
                position: "absolute",
                insetInlineEnd: 8,
                top: 8,
                zIndex: 2,
              }}
            >
              <FavoriteButton
                listingId={l.id}
                userId={userId}
                initialFavorite={favoriteSet.has(l.id)}
                compact
              />
            </div>

            <ImpressionTracker listingId={l.id} />

            <div className="listing-body">
              {l.manufacturer?.name && (
                <div className="brand">
                  {l.manufacturer.name}
                </div>
              )}

              {l.design && (
                <div className="design">
                  {l.design}
                </div>
              )}

              {l.model && (
                <div className="model">
                  {l.model}
                </div>
              )}

              {(l.size || Number(l.price) > 0) && (
                <div className="meta">
                  {l.size && labelOf(SIZES, l.size)}
                  {l.size && Number(l.price) > 0 ? " · " : ""}
                  {Number(l.price) > 0 ? `${l.price} ₪` : ""}
                </div>
              )}

              <div className="materials">
                {l.material_composition_unknown ? (
                  <div>הרכב לא ידוע</div>
                ) : (
                  (l.materials || [])
                    .slice(0, 3)
                    .map((m: any, i: number) => (
                      <div key={i}>
                        {m.percentage}% {m.material?.name}
                      </div>
                    ))
                )}

                {!l.material_composition_unknown &&
                  (l.materials || []).length > 3 && (
                  <div>…</div>
                )}
              </div>

              {(l.locations || []).length > 0 && (
                <div className="location">
                  📍 {l.locations?.[0]?.region?.name || ""}
                  {(l.locations || []).length > 1
                    ? " +1"
                    : ""}
                </div>
              )}

              <div className="icons">
                <span className="shipping-feature">
                  {l.shipping_available && (
                    <FeatureBadge type="shipping" />
                  )}
                </span>

                <span className="material-features">
                  {(l.materials || []).length > 0 &&
                    (l.materials || []).every(
                      (m: any) => m.material?.vegan
                    ) && <FeatureBadge type="vegan" />}

                  {(l.materials || []).length > 0 &&
                    (l.materials || []).every(
                      (m: any) =>
                        m.material?.material_origin ===
                        "natural"
                    ) && <FeatureBadge type="natural" />}

                  {(l.materials || []).length > 0 &&
                    (l.materials || []).every(
                      (m: any) => m.material?.easycare
                    ) && (
                    <FeatureBadge type="easycare" />
                  )}
                </span>
              </div>
            </div>
          </Link>
          <div className="card-share-action">
            <ShareButton
              url={`/listing/${l.id}`}
              title={[l.manufacturer?.name, l.design].filter(Boolean).join(" — ")}
              label="שיתוף המודעה"
              compact
            />
          </div>
          </div>
        ))}
      </div>
    </main>
  );
}
