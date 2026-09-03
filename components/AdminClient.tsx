"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WovenCorner } from "@/components/DesignMotifs";
import { createClient } from "@/lib/supabase/client";

type Tab =
  | "attention"
  | "listings"
  | "manufacturers"
  | "materials"
  | "users"
  | "notes"
  | "colors"
  | "regions";

type Placement = "search" | "listing" | "form";

const NOTE_SECTIONS = [
  ["form_overview", "פתיח — איפה מוצאים את פרטי המנשא"],
  ["filter_logic", "לוגיקת סינון — או / וגם"],
  ["manufacturer", "יצרן"],
  ["manufacturer_add", "הוספת יצרן חדש"],
  ["design", "עיצוב"],
  ["model", "מודל"],
  ["size", "מידה"],
  ["size_note", "הערת מידה"],
  ["materials", "חומרים"],
  ["materials_unknown", "הרכב חומרים לא ידוע"],
  ["material_add", "הוספת חומר חדש"],
  ["material_name", "שם חומר חדש"],
  ["material_parent", "קטגוריית חומר חדש"],
  ["material_origin", "סוג / מקור חומר חדש"],
  ["colors", "צבעים"],
  ["color_patterns", "תכונות / מבנה צבע"],
  ["color_pattern_single_color", "תכונת צבע — צבע חלק"],
  ["color_pattern_two_color_positive_negative", "תכונת צבע — דו צדדי"],
  ["color_pattern_stripes_ombre_symmetric", "תכונת צבע — פסים סימטרי"],
  ["color_pattern_stripes_ombre_asymmetric", "תכונת צבע — פסים אסימטרי"],
  ["color_pattern_rainbow", "תכונת צבע — קשת"],
  ["color_pattern_multicolor", "תכונת צבע — רב גוני"],
  ["gsm", "GSM"],
  ["condition", "מצב המנשא"],
  ["defects", "פגמים"],
  ["price", "מחיר"],
  ["locations", "אזורים / מסירה"],
  ["shipping", "משלוח"],
  ["contact", "פרטי קשר"],
  ["more_info_url", "מידע נוסף / קישור"],
  ["description", "תיאור חופשי"],
] as const;

const PLACEMENTS: {
  key: Placement;
  label: string;
}[] = [
  { key: "search", label: "שורת חיפוש / סינון" },
  { key: "listing", label: "דף מנשא" },
  { key: "form", label: "הוספה / עריכת מודעה" },
];

function statusLabel(status?: string | null) {
  if (status === "active") return "פעיל";
  if (status === "draft") return "טיוטה";
  if (status === "paused") return "מושהה";
  if (status === "incomplete") return "מודעה חלקית";
  if (status === "hidden") return "מוסתר";
  if (status === "merged") return "אוחד";
  return status || "—";
}

function reviewLabel(row: any) {
  if (!row?.created_by) return null;

  return row.reviewed_at
    ? "נבדק"
    : "דורש טיפול";
}

export default function AdminClient({
  userId,
  listings: initialListings,
  manufacturers: initialManufacturers,
  materials: initialMaterials,
  colors: initialColors,
  regions: initialRegions,
  subregions: initialSubregions,
  notes: initialNotes,
  sellers: initialSellers,
  allowIncomplete: initialAllowIncomplete,
}: {
  userId: string;
  listings: any[];
  manufacturers: any[];
  materials: any[];
  colors: any[];
  regions: any[];
  subregions: any[];
  notes: any[];
  sellers: any[];
  allowIncomplete: boolean;
}) {
  const s = createClient();

  const [tab, setTab] = useState<Tab>("attention");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const [listings, setListings] = useState(initialListings);
  const [manufacturers, setManufacturers] =
    useState(initialManufacturers);
  const [materials, setMaterials] = useState(initialMaterials);
  const [colors, setColors] = useState(initialColors);
  const [regions, setRegions] = useState(initialRegions);
  const [subregions, setSubregions] = useState(initialSubregions);
  const [notes, setNotes] = useState(initialNotes);
  const [sellers, setSellers] = useState(initialSellers);
  const [allowIncomplete, setAllowIncomplete] =
    useState(initialAllowIncomplete);

  const [manufacturerMerge, setManufacturerMerge] =
    useState<Record<string, string>>({});
  const [materialMerge, setMaterialMerge] =
    useState<Record<string, string>>({});

  const [noteSection, setNoteSection] =
    useState<string>("color_patterns");
  const [notePlacement, setNotePlacement] =
    useState<Placement>("form");

  const [newManufacturer, setNewManufacturer] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newMaterialParent, setNewMaterialParent] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newSubregion, setNewSubregion] = useState("");
  const [newSubregionParent, setNewSubregionParent] = useState("");

  const attentionManufacturers = useMemo(
    () =>
      manufacturers.filter(
        (x: any) => x.created_by && !x.reviewed_at
      ),
    [manufacturers]
  );

  const attentionMaterials = useMemo(
    () =>
      materials.filter(
        (x: any) => x.created_by && !x.reviewed_at
      ),
    [materials]
  );

  const attentionCount =
    attentionManufacturers.length +
    attentionMaterials.length;

  const tabs: {
    key: Tab;
    label: string;
  }[] = [
    {
      key: "attention",
      label: `דורש טיפול${attentionCount ? ` (${attentionCount})` : ""}`,
    },
    { key: "listings", label: `מודעות (${listings.length})` },
    {
      key: "manufacturers",
      label: `יצרנים (${manufacturers.length})`,
    },
    {
      key: "materials",
      label: `חומרים (${materials.length})`,
    },
    {
      key: "users",
      label: `משתמשות (${sellers.length})`,
    },
    { key: "notes", label: "הערות והנחיות" },
    { key: "colors", label: `צבעים (${colors.length})` },
    { key: "regions", label: `אזורים (${regions.length})` },
  ];

  const notify = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(""), 3000);
  };

  const activeManufacturers = manufacturers.filter(
    (x: any) => x.status === "active"
  );

  const activeMaterials = materials.filter(
    (x: any) => x.status === "active"
  );

  const filtered = (rows: any[]) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((x: any) =>
      JSON.stringify(x)
        .toLowerCase()
        .includes(needle)
    );
  };

  async function review(
    table: "manufacturers" | "materials",
    id: string
  ) {
    const reviewed_at = new Date().toISOString();

    const { error } = await s
      .from(table)
      .update({ reviewed_at })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    if (table === "manufacturers") {
      setManufacturers((rows) =>
        rows.map((x) =>
          x.id === id ? { ...x, reviewed_at } : x
        )
      );
    } else {
      setMaterials((rows) =>
        rows.map((x) =>
          x.id === id ? { ...x, reviewed_at } : x
        )
      );
    }

    notify("סומן כנבדק");
  }

  async function updateListingStatus(
    id: string,
    status: string
  ) {
    const { error } = await s
      .from("listings")
      .update({
        status,
        paused_at:
          status === "paused"
            ? new Date().toISOString()
            : null,
        deleted_at:
          status === "deleted"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setListings((rows) =>
      status === "deleted"
        ? rows.filter((x) => x.id !== id)
        : rows.map((x) =>
            x.id === id ? { ...x, status } : x
          )
    );
  }

  async function updateManufacturer(
    id: string,
    patch: Record<string, any>
  ) {
    const { error } = await s
      .from("manufacturers")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) =>
      rows.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      )
    );
  }

  async function renameManufacturer(
    id: string,
    currentName: string
  ) {
    const name = prompt("שם היצרן", currentName)?.trim();
    if (!name || name === currentName) return;

    await updateManufacturer(id, { name });
  }

  async function mergeManufacturer(fromId: string) {
    const targetId = manufacturerMerge[fromId];
    if (!targetId) {
      notify("בחרי יצרן שאליו מאחדים");
      return;
    }

    const target = manufacturers.find(
      (x: any) => x.id === targetId
    );

    if (
      !confirm(
        `לאחד את כל המודעות לתוך "${target?.name}"?`
      )
    ) {
      return;
    }

    const { error } = await s.rpc(
      "admin_merge_manufacturer",
      {
        p_from_id: fromId,
        p_into_id: targetId,
      }
    );

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) =>
      rows.map((x) =>
        x.id === fromId
          ? {
              ...x,
              status: "merged",
              reviewed_at: new Date().toISOString(),
            }
          : x
      )
    );

    setListings((rows) =>
      rows.map((x) =>
        x.manufacturer_id === fromId
          ? {
              ...x,
              manufacturer_id: targetId,
              manufacturer: {
                name: target?.name,
              },
            }
          : x
      )
    );

    notify("היצרנים אוחדו");
  }

  async function updateMaterial(
    id: string,
    patch: Record<string, any>
  ) {
    const { error } = await s
      .from("materials")
      .update(patch)
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setMaterials((rows) =>
      rows.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      )
    );
  }

  async function renameMaterial(
    id: string,
    currentName: string
  ) {
    const name = prompt("שם החומר", currentName)?.trim();
    if (!name || name === currentName) return;

    await updateMaterial(id, { name });
  }

  async function mergeMaterial(fromId: string) {
    const targetId = materialMerge[fromId];
    if (!targetId) {
      notify("בחרי חומר שאליו מאחדים");
      return;
    }

    const target = materials.find(
      (x: any) => x.id === targetId
    );

    if (
      !confirm(
        `לאחד את החומר לתוך "${target?.name}"? אחוזים במודעות קיימות יחוברו במקרה הצורך.`
      )
    ) {
      return;
    }

    const { error } = await s.rpc(
      "admin_merge_material",
      {
        p_from_id: fromId,
        p_into_id: targetId,
      }
    );

    if (error) {
      notify(error.message);
      return;
    }

    setMaterials((rows) =>
      rows.map((x) =>
        x.id === fromId
          ? {
              ...x,
              status: "hidden",
              reviewed_at: new Date().toISOString(),
            }
          : x
      )
    );

    notify("החומרים אוחדו");
  }

  async function addManufacturer() {
    const name = newManufacturer.trim();
    if (!name) return;

    const { data, error } = await s
      .from("manufacturers")
      .insert({
        name,
        status: "active",
        reviewed_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) => [...rows, data]);
    setNewManufacturer("");
  }

  async function addMaterial() {
    const name = newMaterial.trim();
    if (!name) return;

    const { data, error } = await s
      .from("materials")
      .insert({
        name,
        parent_material_id:
          newMaterialParent || null,
        status: "active",
        vegan: true,
        easycare: true,
        material_origin: "natural",
        is_selectable: true,
        reviewed_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setMaterials((rows) => [...rows, data]);
    setNewMaterial("");
    setNewMaterialParent("");
  }

  function noteFor(
    sectionKey: string,
    placement: Placement
  ) {
    const existing = notes.find(
      (x: any) =>
        x.section_key === sectionKey &&
        x.placement === placement
    );

    const label =
      NOTE_SECTIONS.find(([key]) => key === sectionKey)?.[1] ||
      sectionKey;

    return (
      existing || {
        section_key: sectionKey,
        section_label: label,
        placement,
        content: "",
        is_visible: false,
        image_1_path: null,
        image_2_path: null,
      }
    );
  }

  const currentNote = noteFor(
    noteSection,
    notePlacement
  );

  function updateCurrentNote(patch: Record<string, any>) {
    setNotes((rows) => {
      const index = rows.findIndex(
        (x: any) =>
          x.section_key === noteSection &&
          x.placement === notePlacement
      );

      const next = {
        ...currentNote,
        ...patch,
      };

      if (index < 0) {
        return [...rows, next];
      }

      return rows.map((x, i) =>
        i === index ? next : x
      );
    });
  }

  async function saveCurrentNote() {
    const note = noteFor(
      noteSection,
      notePlacement
    );

    const { data, error } = await s
      .from("help_notes")
      .upsert(
        {
          section_key: note.section_key,
          section_label: note.section_label,
          placement: note.placement,
          content: note.content || null,
          is_visible: !!note.is_visible,
          image_1_path: note.image_1_path || null,
          image_2_path: note.image_2_path || null,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        {
          onConflict: "section_key,placement",
        }
      )
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setNotes((rows) => {
      const without = rows.filter(
        (x: any) =>
          !(
            x.section_key === data.section_key &&
            x.placement === data.placement
          )
      );

      return [...without, data];
    });

    notify("ההערה נשמרה");
  }

  async function uploadNoteImage(
    file: File,
    slot: 1 | 2
  ) {
    const safeName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const path =
      `${noteSection}/${notePlacement}/` +
      `${Date.now()}-${slot}-${safeName}`;

    const { error } = await s.storage
      .from("help-images")
      .upload(path, file, {
        upsert: false,
      });

    if (error) {
      notify(error.message);
      return;
    }

    updateCurrentNote(
      slot === 1
        ? { image_1_path: path }
        : { image_2_path: path }
    );

    notify("התמונה הועלתה; שמרי את ההערה");
  }

  function imageUrl(path?: string | null) {
    if (!path) return null;

    return s.storage
      .from("help-images")
      .getPublicUrl(path).data.publicUrl;
  }

  async function setSellerSuspended(
    userIdToChange: string,
    suspended: boolean
  ) {
    const { error } = await s.rpc(
      "admin_set_user_suspended",
      {
        p_user_id: userIdToChange,
        p_suspended: suspended,
      }
    );

    if (error) {
      notify(error.message);
      return;
    }

    setSellers((rows) =>
      rows.map((x: any) =>
        x.user_id === userIdToChange
          ? { ...x, is_suspended: suspended }
          : x
      )
    );
  }

  async function pauseSellerListings(
    userIdToPause: string
  ) {
    if (
      !confirm(
        "להשהות עכשיו את כל המודעות הפעילות של המשתמשת?"
      )
    ) {
      return;
    }

    const { data, error } = await s.rpc(
      "admin_pause_user_listings",
      {
        p_user_id: userIdToPause,
      }
    );

    if (error) {
      notify(error.message);
      return;
    }

    setListings((rows) =>
      rows.map((x: any) =>
        x.owner_id === userIdToPause &&
        x.status === "active"
          ? { ...x, status: "paused" }
          : x
      )
    );

    setSellers((rows) =>
      rows.map((x: any) =>
        x.user_id === userIdToPause
          ? { ...x, active_listing_count: 0 }
          : x
      )
    );

    notify(`הושהו ${Number(data || 0)} מודעות`);
  }

  async function setSellerAdmin(
    userIdToChange: string,
    makeAdmin: boolean
  ) {
    const { error } = await s.rpc(
      "admin_set_admin",
      {
        p_user_id: userIdToChange,
        p_is_admin: makeAdmin,
      }
    );

    if (error) {
      notify(error.message);
      return;
    }

    setSellers((rows) =>
      rows.map((x: any) =>
        x.user_id === userIdToChange
          ? { ...x, is_admin: makeAdmin }
          : x
      )
    );
  }

  async function toggleIncompleteListings() {
    const next = !allowIncomplete;

    const { error } = await s
      .from("site_settings")
      .update({
        allow_incomplete_listings: next,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("singleton", true);

    if (error) {
      notify(error.message);
      return;
    }

    setAllowIncomplete(next);
    notify(
      next
        ? "פרסום מודעות חלקיות הופעל"
        : "פרסום מודעות חלקיות הושבת"
    );
  }

  async function updateColor(
    id: string,
    patch: Record<string, any>
  ) {
    const { error } = await s
      .from("colors")
      .update(patch)
      .eq("id", id);

    if (!error) {
      setColors((rows) =>
        rows.map((x) =>
          x.id === id ? { ...x, ...patch } : x
        )
      );
    }
  }

  async function updateRegion(
    table: "regions" | "subregions",
    id: string,
    patch: Record<string, any>
  ) {
    const { error } = await s
      .from(table)
      .update(patch)
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    if (table === "regions") {
      setRegions((rows) =>
        rows.map((x) =>
          x.id === id ? { ...x, ...patch } : x
        )
      );
    } else {
      setSubregions((rows) =>
        rows.map((x) =>
          x.id === id ? { ...x, ...patch } : x
        )
      );
    }
  }

  async function addRegion() {
    const name = newRegion.trim();
    if (!name) return;

    const { data, error } = await s
      .from("regions")
      .insert({
        name,
        active: true,
        sort_order:
          Math.max(
            0,
            ...regions.map((x: any) =>
              Number(x.sort_order || 0)
            )
          ) + 1,
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setRegions((rows) => [...rows, data]);
    setNewRegion("");
  }

  async function addSubregion() {
    const name = newSubregion.trim();
    if (!name || !newSubregionParent) return;

    const siblings = subregions.filter(
      (x: any) =>
        x.region_id === newSubregionParent
    );

    const { data, error } = await s
      .from("subregions")
      .insert({
        name,
        region_id: newSubregionParent,
        active: true,
        sort_order:
          Math.max(
            0,
            ...siblings.map((x: any) =>
              Number(x.sort_order || 0)
            )
          ) + 1,
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setSubregions((rows) => [...rows, data]);
    setNewSubregion("");
  }

  function CatalogRow({
    type,
    row,
  }: {
    type: "manufacturer" | "material";
    row: any;
  }) {
    const isManufacturer =
      type === "manufacturer";

    const mergeOptions = isManufacturer
      ? activeManufacturers.filter(
          (x: any) => x.id !== row.id
        )
      : activeMaterials.filter(
          (x: any) => x.id !== row.id
        );

    const mergeValue = isManufacturer
      ? manufacturerMerge[row.id] || ""
      : materialMerge[row.id] || "";

    return (
      <div className="section account-card">
        <div
          className="toolbar"
          style={{ flexWrap: "wrap" }}
        >
          <b>{row.name}</b>

          <span className="badge">
            {statusLabel(row.status)}
          </span>

          {reviewLabel(row) && (
            <span className="badge">
              {reviewLabel(row)}
            </span>
          )}
        </div>

        {!isManufacturer && (
          <div className="muted">
            {row.parent_material_id
              ? `תחת: ${
                  materials.find(
                    (x: any) =>
                      x.id === row.parent_material_id
                  )?.name || "לא ידוע"
                }`
              : "חומר־אב"}
          </div>
        )}

        <div
          className="toolbar"
          style={{
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn"
            onClick={() =>
              isManufacturer
                ? renameManufacturer(
                    row.id,
                    row.name
                  )
                : renameMaterial(
                    row.id,
                    row.name
                  )
            }
          >
            שינוי שם
          </button>

          {!row.reviewed_at &&
            row.created_by && (
              <button
                className="btn primary"
                onClick={() =>
                  review(
                    isManufacturer
                      ? "manufacturers"
                      : "materials",
                    row.id
                  )
                }
              >
                אישור כנבדק
              </button>
            )}

          {!isManufacturer && (
            <>
              <select
                className="select"
                value={
                  row.parent_material_id || ""
                }
                onChange={(e) =>
                  updateMaterial(row.id, {
                    parent_material_id:
                      e.target.value || null,
                  })
                }
              >
                <option value="">
                  ללא חומר־אב
                </option>

                {materials
                  .filter(
                    (x: any) =>
                      !x.parent_material_id &&
                      x.id !== row.id
                  )
                  .map((x: any) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.name}
                    </option>
                  ))}
              </select>

              <select
                className="select"
                value={
                  row.material_origin ||
                  "natural"
                }
                onChange={(e) =>
                  updateMaterial(row.id, {
                    material_origin:
                      e.target.value,
                  })
                }
              >
                <option value="natural">
                  טבעי
                </option>
                <option value="manmade">
                  מלאכותי
                </option>
                <option value="synthetic">
                  סינתטי
                </option>
              </select>

              <label className="chip">
                <input
                  type="checkbox"
                  checked={!!row.vegan}
                  onChange={(e) =>
                    updateMaterial(row.id, {
                      vegan:
                        e.target.checked,
                    })
                  }
                />{" "}
                טבעוני
              </label>

              <label className="chip">
                <input
                  type="checkbox"
                  checked={row.easycare !== false}
                  onChange={(e) =>
                    updateMaterial(row.id, {
                      easycare: e.target.checked,
                    })
                  }
                />{" "}
                איזיקייר
              </label>

              <label className="chip">
                <input
                  type="checkbox"
                  checked={
                    row.is_selectable !==
                    false
                  }
                  onChange={(e) =>
                    updateMaterial(row.id, {
                      is_selectable:
                        e.target.checked,
                    })
                  }
                />{" "}
                ניתן לבחירה
              </label>
            </>
          )}

          <select
            className="select"
            value={mergeValue}
            onChange={(e) => {
              if (isManufacturer) {
                setManufacturerMerge(
                  (old) => ({
                    ...old,
                    [row.id]:
                      e.target.value,
                  })
                );
              } else {
                setMaterialMerge(
                  (old) => ({
                    ...old,
                    [row.id]:
                      e.target.value,
                  })
                );
              }
            }}
          >
            <option value="">
              איחוד לתוך...
            </option>

            {mergeOptions.map(
              (x: any) => (
                <option
                  key={x.id}
                  value={x.id}
                >
                  {x.name}
                </option>
              )
            )}
          </select>

          <button
            className="btn"
            disabled={!mergeValue}
            onClick={() =>
              isManufacturer
                ? mergeManufacturer(row.id)
                : mergeMaterial(row.id)
            }
          >
            איחוד
          </button>

          <button
            className="btn"
            onClick={() =>
              isManufacturer
                ? updateManufacturer(
                    row.id,
                    {
                      status:
                        row.status ===
                        "active"
                          ? "hidden"
                          : "active",
                    }
                  )
                : updateMaterial(
                    row.id,
                    {
                      status:
                        row.status ===
                        "active"
                          ? "hidden"
                          : "active",
                    }
                  )
            }
          >
            {row.status === "active"
              ? "הסתרה"
              : "הפעלה"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section">
        <h2>הגדרות הלוח</h2>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            checked={allowIncomplete}
            onChange={toggleIncompleteListings}
          />
          לאפשר פרסום מודעות חלקיות
        </label>

        <p className="muted" style={{ marginBottom: 0 }}>
          כשהאפשרות כבויה, מודעות שכבר פורסמו כחלקיות
          נשמרות במערכת אבל אינן מוצגות לציבור ומתנהגות
          כמו טיוטות באזור האישי.
        </p>
      </div>

      <div
        className="toolbar"
        style={{ flexWrap: "wrap" }}
      >
        {tabs.map((x) => (
          <button
            type="button"
            key={x.key}
            className={
              "btn " +
              (tab === x.key
                ? "primary"
                : "")
            }
            onClick={() => {
              setTab(x.key);
              setQ("");
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className="notice"
          role="status"
          aria-live="polite"
        >
          {msg}
        </div>
      )}

      {tab !== "notes" &&
        tab !== "attention" && (
          <div className="field">
            <label>חיפוש</label>
            <input
              className="input"
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="חיפוש בתוך הטאב..."
            />
          </div>
        )}

      {tab === "attention" && (
        <div className="section">
          <h2>דורש טיפול</h2>

          {attentionCount === 0 ? (
            <p className="muted">
              אין כרגע פריטים שממתינים לבדיקה.
            </p>
          ) : (
            <>
              {attentionManufacturers.length >
                0 && (
                <>
                  <h3>
                    יצרנים שנוספו ע״י
                    משתמשות
                  </h3>

                  {attentionManufacturers.map(
                    (x: any) => (
                      <CatalogRow
                        key={x.id}
                        type="manufacturer"
                        row={x}
                      />
                    )
                  )}
                </>
              )}

              {attentionMaterials.length >
                0 && (
                <>
                  <h3>
                    חומרים שנוספו ע״י
                    משתמשות
                  </h3>

                  {attentionMaterials.map(
                    (x: any) => (
                      <CatalogRow
                        key={x.id}
                        type="material"
                        row={x}
                      />
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === "listings" && (
        <div className="section">
          <h2>מודעות</h2>

          {filtered(listings).map(
            (l: any) => (
              <div
                className="section account-card listing-management-card"
                key={l.id}
              >
                <WovenCorner />
                <div>
                  <b>
                    {l.manufacturer?.name} ·{" "}
                    {l.design}
                  </b>
                  {l.model && (
                    <> · {l.model}</>
                  )}
                </div>

                <div className="muted">
                  {l.price} ₪ ·{" "}
                  {statusLabel(l.status)}
                </div>

                <div
                  className="toolbar"
                  style={{ marginTop: 8 }}
                >
                  <Link
                    className="btn"
                    href={`/listing/${l.id}`}
                  >
                    צפייה
                  </Link>

                  <Link
                    className="btn"
                    href={`/listing/${l.id}/edit`}
                  >
                    עריכה
                  </Link>

                  <button
                    className="btn"
                    onClick={() =>
                      updateListingStatus(
                        l.id,
                        l.status === "active"
                          ? "paused"
                          : "active"
                      )
                    }
                  >
                    {l.status === "active"
                      ? "השהיה"
                      : "הפעלה"}
                  </button>

                  <button
                    className="btn danger"
                    onClick={() => {
                      if (
                        confirm(
                          "להסיר את המודעה?"
                        )
                      ) {
                        updateListingStatus(
                          l.id,
                          "deleted"
                        );
                      }
                    }}
                  >
                    הסרה
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {tab === "manufacturers" && (
        <div className="section">
          <h2>יצרנים</h2>

          <div className="toolbar">
            <input
              className="input"
              value={newManufacturer}
              onChange={(e) =>
                setNewManufacturer(
                  e.target.value
                )
              }
              placeholder="יצרן חדש"
            />

            <button
              className="btn primary"
              onClick={addManufacturer}
            >
              הוספה
            </button>
          </div>

          {filtered(manufacturers).map(
            (x: any) => (
              <CatalogRow
                key={x.id}
                type="manufacturer"
                row={x}
              />
            )
          )}
        </div>
      )}

      {tab === "materials" && (
        <div className="section">
          <h2>חומרים</h2>

          <div
            className="toolbar"
            style={{ flexWrap: "wrap" }}
          >
            <input
              className="input"
              value={newMaterial}
              onChange={(e) =>
                setNewMaterial(
                  e.target.value
                )
              }
              placeholder="חומר חדש"
            />

            <select
              className="select"
              value={newMaterialParent}
              onChange={(e) =>
                setNewMaterialParent(
                  e.target.value
                )
              }
            >
              <option value="">
                ללא חומר־אב
              </option>

              {materials
                .filter(
                  (x: any) =>
                    !x.parent_material_id
                )
                .map((x: any) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.name}
                  </option>
                ))}
            </select>

            <button
              className="btn primary"
              onClick={addMaterial}
            >
              הוספה
            </button>
          </div>

          {filtered(materials).map(
            (x: any) => (
              <CatalogRow
                key={x.id}
                type="material"
                row={x}
              />
            )
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="section">
          <h2>משתמשות</h2>

          <p className="muted">
            מוצג רק מידע שנחוץ לניהול הלוח:
            כינוי, המדף והמודעות. אין כאן מיילים.
          </p>

          {filtered(sellers).map(
            (seller: any) => {
              const sellerListings =
                listings.filter(
                  (l: any) =>
                    l.owner_id === seller.user_id
                );

              return (
                <div
                  key={seller.user_id}
                  className="section account-card"
                >
                  <div
                    className="toolbar"
                    style={{ flexWrap: "wrap" }}
                  >
                    <b>
                      {seller.display_name ||
                        "משתמשת ללא כינוי"}
                    </b>

                    {seller.is_suspended && (
                      <span className="badge">
                        מושהית
                      </span>
                    )}

                    {seller.is_admin && (
                      <span className="badge">
                        מנהלת
                      </span>
                    )}

                    <span className="muted">
                      {seller.active_listing_count} פעילות ·{" "}
                      {seller.total_listing_count} סה״כ
                    </span>
                  </div>

                  <div
                    className="toolbar"
                    style={{
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      className="btn"
                      href={`/seller/${seller.public_seller_id}`}
                    >
                      צפייה במדף
                    </Link>

                    <button
                      type="button"
                      className={
                        seller.is_suspended
                          ? "btn"
                          : "btn danger"
                      }
                      disabled={seller.user_id === userId}
                      onClick={() =>
                        setSellerSuspended(
                          seller.user_id,
                          !seller.is_suspended
                        )
                      }
                    >
                      {seller.is_suspended
                        ? "ביטול השהיה"
                        : "השהיית משתמשת"}
                    </button>

                    <button
                      type="button"
                      className="btn danger"
                      onClick={() =>
                        pauseSellerListings(
                          seller.user_id
                        )
                      }
                    >
                      השהיית כל המודעות
                    </button>

                    <button
                      type="button"
                      className="btn"
                      disabled={
                        seller.user_id === userId &&
                        seller.is_admin
                      }
                      onClick={() =>
                        setSellerAdmin(
                          seller.user_id,
                          !seller.is_admin
                        )
                      }
                    >
                      {seller.is_admin
                        ? "הסרת הרשאת מנהלת"
                        : "הפיכה למנהלת"}
                    </button>
                  </div>

                  {sellerListings.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {sellerListings.map(
                        (l: any) => (
                          <div
                            key={l.id}
                            className="toolbar"
                            style={{
                              marginTop: 6,
                              justifyContent:
                                "space-between",
                            }}
                          >
                            <Link
                              href={`/listing/${l.id}`}
                            >
                              {l.manufacturer?.name} ·{" "}
                              {l.design}
                              {l.model
                                ? ` · ${l.model}`
                                : ""}
                            </Link>

                            <span className="badge">
                              {statusLabel(l.status)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="section">
          <h2>הערות והנחיות</h2>

          <p className="muted">
            לכל סעיף אפשר לשמור נוסח
            נפרד לכל מקום שבו הוא מופיע.
          </p>

          <div
            className="toolbar"
            style={{ flexWrap: "wrap" }}
          >
            <select
              className="select"
              value={noteSection}
              onChange={(e) =>
                setNoteSection(
                  e.target.value
                )
              }
            >
              {NOTE_SECTIONS.map(
                ([key, label]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              className="select"
              value={notePlacement}
              onChange={(e) =>
                setNotePlacement(
                  e.target
                    .value as Placement
                )
              }
            >
              {PLACEMENTS.map((x) => (
                <option
                  key={x.key}
                  value={x.key}
                >
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={
                  !!currentNote.is_visible
                }
                onChange={(e) =>
                  updateCurrentNote({
                    is_visible:
                      e.target.checked,
                  })
                }
              />{" "}
              להציג את ההערה
            </label>
          </div>

          <div className="field">
            <label>תוכן ההערה</label>

            <textarea
              className="input"
              rows={7}
              value={
                currentNote.content || ""
              }
              onChange={(e) =>
                updateCurrentNote({
                  content:
                    e.target.value,
                })
              }
              placeholder="כתבי כאן את ההסבר שיוצג למשתמשת..."
            />
          </div>

          <div className="field">
            <label>
              תמונות דוגמה — עד שתיים
            </label>

            <div
              className="toolbar"
              style={{ flexWrap: "wrap" }}
            >
              {[1, 2].map((slot) => {
                const path =
                  slot === 1
                    ? currentNote.image_1_path
                    : currentNote.image_2_path;

                const url =
                  imageUrl(path);

                return (
                  <div
                    key={slot}
                    className="section"
                  >
                    {url && (
                      <img
                        src={url}
                        alt=""
                        style={{
                          maxWidth: 220,
                          maxHeight: 160,
                          objectFit:
                            "contain",
                          display: "block",
                          marginBottom: 8,
                        }}
                      />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file =
                          e.target
                            .files?.[0];

                        if (file) {
                          uploadNoteImage(
                            file,
                            slot as 1 | 2
                          );
                        }
                      }}
                    />

                    {path && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() =>
                          updateCurrentNote(
                            slot === 1
                              ? {
                                  image_1_path:
                                    null,
                                }
                              : {
                                  image_2_path:
                                    null,
                                }
                          )
                        }
                      >
                        הסרה מההערה
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="btn primary"
            onClick={saveCurrentNote}
          >
            שמירת ההערה
          </button>
        </div>
      )}

      {tab === "colors" && (
        <div className="section">
          <h2>צבעים</h2>

          {colors.map((x: any) => (
            <div
              className="section account-card"
              key={x.id}
            >
              <div
                className="toolbar"
                style={{
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display:
                      "inline-block",
                    background: x.hex,
                    border:
                      "1px solid rgba(0,0,0,.2)",
                  }}
                />

                <input
                  className="input"
                  value={x.label || ""}
                  onChange={(e) =>
                    setColors((rows) =>
                      rows.map((r) =>
                        r.id === x.id
                          ? {
                              ...r,
                              label:
                                e.target
                                  .value,
                            }
                          : r
                      )
                    )
                  }
                  onBlur={() =>
                    updateColor(x.id, {
                      label: x.label,
                    })
                  }
                />

                <input
                  className="input"
                  value={x.hex || ""}
                  onChange={(e) =>
                    setColors((rows) =>
                      rows.map((r) =>
                        r.id === x.id
                          ? {
                              ...r,
                              hex:
                                e.target
                                  .value,
                            }
                          : r
                      )
                    )
                  }
                  onBlur={() =>
                    updateColor(x.id, {
                      hex: x.hex,
                    })
                  }
                />

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={!!x.active}
                    onChange={(e) =>
                      updateColor(x.id, {
                        active:
                          e.target
                            .checked,
                      })
                    }
                  />{" "}
                  פעיל
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "regions" && (
        <div className="section">
          <h2>אזורים</h2>

          <div
            className="toolbar"
            style={{ flexWrap: "wrap" }}
          >
            <input
              className="input"
              value={newRegion}
              onChange={(e) =>
                setNewRegion(
                  e.target.value
                )
              }
              placeholder="אזור־גג חדש"
            />

            <button
              className="btn primary"
              onClick={addRegion}
            >
              הוספת אזור
            </button>
          </div>

          <div
            className="toolbar"
            style={{ flexWrap: "wrap" }}
          >
            <input
              className="input"
              value={newSubregion}
              onChange={(e) =>
                setNewSubregion(
                  e.target.value
                )
              }
              placeholder="תת־אזור חדש"
            />

            <select
              className="select"
              value={
                newSubregionParent
              }
              onChange={(e) =>
                setNewSubregionParent(
                  e.target.value
                )
              }
            >
              <option value="">
                בחרי אזור־גג
              </option>

              {regions.map(
                (x: any) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.name}
                  </option>
                )
              )}
            </select>

            <button
              className="btn primary"
              onClick={addSubregion}
            >
              הוספת תת־אזור
            </button>
          </div>

          {regions.map((r: any) => (
            <div
              className="section account-card"
              key={r.id}
            >
              <div
                className="toolbar"
                style={{
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="input"
                  value={r.name || ""}
                  onChange={(e) =>
                    setRegions((rows) =>
                      rows.map((x) =>
                        x.id === r.id
                          ? {
                              ...x,
                              name:
                                e.target
                                  .value,
                            }
                          : x
                      )
                    )
                  }
                  onBlur={() =>
                    updateRegion(
                      "regions",
                      r.id,
                      { name: r.name }
                    )
                  }
                />

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={!!r.active}
                    onChange={(e) =>
                      updateRegion(
                        "regions",
                        r.id,
                        {
                          active:
                            e.target
                              .checked,
                        }
                      )
                    }
                  />{" "}
                  פעיל
                </label>
              </div>

              <div
                style={{
                  marginInlineStart: 22,
                }}
              >
                {subregions
                  .filter(
                    (x: any) =>
                      x.region_id === r.id
                  )
                  .map((x: any) => (
                    <div
                      key={x.id}
                      className="toolbar"
                      style={{
                        marginTop: 8,
                      }}
                    >
                      <input
                        className="input"
                        value={
                          x.name || ""
                        }
                        onChange={(e) =>
                          setSubregions(
                            (rows) =>
                              rows.map(
                                (z) =>
                                  z.id ===
                                  x.id
                                    ? {
                                        ...z,
                                        name:
                                          e
                                            .target
                                            .value,
                                      }
                                    : z
                              )
                          )
                        }
                        onBlur={() =>
                          updateRegion(
                            "subregions",
                            x.id,
                            {
                              name: x.name,
                            }
                          )
                        }
                      />

                      <label className="chip">
                        <input
                          type="checkbox"
                          checked={
                            !!x.active
                          }
                          onChange={(e) =>
                            updateRegion(
                              "subregions",
                              x.id,
                              {
                                active:
                                  e.target
                                    .checked,
                              }
                            )
                          }
                        />{" "}
                        פעיל
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

}
