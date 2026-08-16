"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab =
  | "listings"
  | "manufacturers"
  | "materials"
  | "colors"
  | "regions";

function AddedByUser({ row }: { row: any }) {
  if (!row?.created_by) return null;

  return (
    <span
      className="badge"
      title="הפריט נוסף דרך האתר על־ידי משתמשת"
    >
      נוסף ע״י משתמשת
    </span>
  );
}

function statusLabel(status?: string | null) {
  if (status === "active") return "פעיל";
  if (status === "draft") return "טיוטה";
  if (status === "paused") return "מושהה";
  if (status === "hidden") return "מוסתר";
  if (status === "merged") return "אוחד";
  if (status === "pending") return "ממתין";
  return status || "—";
}

export default function AdminClient({
  listings: initialListings,
  manufacturers: initialManufacturers,
  materials: initialMaterials,
  colors: initialColors,
  regions: initialRegions,
  subregions: initialSubregions,
}: {
  listings: any[];
  manufacturers: any[];
  materials: any[];
  colors: any[];
  regions: any[];
  subregions: any[];
}) {
  const s = createClient();

  const [tab, setTab] = useState<Tab>("listings");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const [listings, setListings] = useState(initialListings);
  const [manufacturers, setManufacturers] =
    useState(initialManufacturers);
  const [materials, setMaterials] = useState(initialMaterials);
  const [colors, setColors] = useState(initialColors);
  const [regions, setRegions] = useState(initialRegions);
  const [subregions, setSubregions] = useState(initialSubregions);

  const [newManufacturer, setNewManufacturer] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newMaterialParent, setNewMaterialParent] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newSubregion, setNewSubregion] = useState("");
  const [newSubregionParent, setNewSubregionParent] = useState("");

  const tabs: { key: Tab; label: string }[] = [
    { key: "listings", label: "מודעות" },
    { key: "manufacturers", label: "יצרנים" },
    { key: "materials", label: "חומרים" },
    { key: "colors", label: "צבעים" },
    { key: "regions", label: "אזורים" },
  ];

  const notify = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(""), 2500);
  };

  const filteredListings = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return listings;

    return listings.filter((l: any) =>
      `${l.manufacturer?.name || ""} ${l.design || ""} ${
        l.model || ""
      } ${l.status || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [listings, q]);

  const filteredManufacturers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return manufacturers;

    return manufacturers.filter((x: any) =>
      `${x.name || ""} ${x.status || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [manufacturers, q]);

  const filteredMaterials = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return materials;

    return materials.filter((x: any) =>
      `${x.name || ""} ${x.status || ""} ${
        x.material_origin || ""
      }`
        .toLowerCase()
        .includes(needle)
    );
  }, [materials, q]);

  async function updateListingStatus(id: string, status: string) {
    const { error } = await s
      .from("listings")
      .update({
        status,
        paused_at:
          status === "paused" ? new Date().toISOString() : null,
        deleted_at:
          status === "deleted" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setListings((rows) =>
      status === "deleted"
        ? rows.filter((x) => x.id !== id)
        : rows.map((x) => (x.id === id ? { ...x, status } : x))
    );

    notify("המודעה עודכנה");
  }

  async function renameManufacturer(id: string, currentName: string) {
    const name = prompt("שם היצרן", currentName)?.trim();
    if (!name || name === currentName) return;

    const { error } = await s
      .from("manufacturers")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) =>
      rows.map((x) => (x.id === id ? { ...x, name } : x))
    );
    notify("שם היצרן עודכן");
  }

  async function manufacturerStatus(id: string, status: string) {
    const { error } = await s
      .from("manufacturers")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) =>
      rows.map((x) => (x.id === id ? { ...x, status } : x))
    );
    notify("היצרן עודכן");
  }

  async function addManufacturer() {
    const name = newManufacturer.trim();
    if (!name) return;

    const { data, error } = await s
      .from("manufacturers")
      .insert({ name, status: "active" })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setManufacturers((rows) =>
      [...rows, data].sort((a, b) =>
        a.name.localeCompare(b.name, "he")
      )
    );
    setNewManufacturer("");
    notify("היצרן נוסף");
  }

  async function mergeManufacturer(fromId: string) {
    const options = manufacturers.filter(
      (x: any) => x.id !== fromId && x.status === "active"
    );

    const targetName = prompt(
      "לאיזה יצרן לאחד? כתבי את השם המדויק:\n\n" +
        options
          .slice(0, 30)
          .map((x: any) => x.name)
          .join("\n")
    )?.trim();

    if (!targetName) return;

    const target = options.find(
      (x: any) => x.name.toLowerCase() === targetName.toLowerCase()
    );

    if (!target) {
      notify("לא נמצא יצרן בשם הזה");
      return;
    }

    const { error } = await s.rpc("admin_merge_manufacturer", {
      p_from_id: fromId,
      p_into_id: target.id,
    });

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
              merged_into_id: target.id,
            }
          : x
      )
    );

    setListings((rows) =>
      rows.map((x) =>
        x.manufacturer_id === fromId
          ? {
              ...x,
              manufacturer_id: target.id,
              manufacturer: { name: target.name },
            }
          : x
      )
    );

    notify("היצרנים אוחדו");
  }

  async function updateMaterial(id: string, patch: Record<string, any>) {
    const { error } = await s
      .from("materials")
      .update(patch)
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setMaterials((rows) =>
      rows.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
    notify("החומר עודכן");
  }

  async function renameMaterial(id: string, currentName: string) {
    const name = prompt("שם החומר", currentName)?.trim();
    if (!name || name === currentName) return;
    await updateMaterial(id, { name });
  }

  async function addMaterial() {
    const name = newMaterial.trim();
    if (!name) return;

    const { data, error } = await s
      .from("materials")
      .insert({
        name,
        parent_material_id: newMaterialParent || null,
        status: "active",
        vegan: true,
        material_origin: "natural",
        is_selectable: true,
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
    notify("החומר נוסף");
  }

  async function updateColor(id: string, patch: Record<string, any>) {
    const { error } = await s.from("colors").update(patch).eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setColors((rows) =>
      rows.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }

  async function updateRegion(id: string, patch: Record<string, any>) {
    const { error } = await s.from("regions").update(patch).eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setRegions((rows) =>
      rows.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }

  async function updateSubregion(
    id: string,
    patch: Record<string, any>
  ) {
    const { error } = await s
      .from("subregions")
      .update(patch)
      .eq("id", id);

    if (error) {
      notify(error.message);
      return;
    }

    setSubregions((rows) =>
      rows.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }

  async function addRegion() {
    const name = newRegion.trim();
    if (!name) return;

    const nextSort =
      Math.max(0, ...regions.map((x: any) => Number(x.sort_order || 0))) +
      1;

    const { data, error } = await s
      .from("regions")
      .insert({
        name,
        active: true,
        sort_order: nextSort,
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setRegions((rows) => [...rows, data]);
    setNewRegion("");
    notify("האזור נוסף");
  }

  async function addSubregion() {
    const name = newSubregion.trim();
    if (!name || !newSubregionParent) return;

    const siblings = subregions.filter(
      (x: any) => x.region_id === newSubregionParent
    );
    const nextSort =
      Math.max(
        0,
        ...siblings.map((x: any) => Number(x.sort_order || 0))
      ) + 1;

    const { data, error } = await s
      .from("subregions")
      .insert({
        name,
        region_id: newSubregionParent,
        active: true,
        sort_order: nextSort,
      })
      .select("*")
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setSubregions((rows) => [...rows, data]);
    setNewSubregion("");
    notify("תת־האזור נוסף");
  }

  return (
    <>
      <div className="toolbar" style={{ flexWrap: "wrap" }}>
        {tabs.map((x) => (
          <button
            type="button"
            key={x.key}
            className={"btn " + (tab === x.key ? "primary" : "")}
            onClick={() => {
              setTab(x.key);
              setQ("");
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {msg && <div className="notice">{msg}</div>}

      <div className="field">
        <label>חיפוש</label>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש בתוך הטאב..."
        />
      </div>

      {tab === "listings" && (
        <div className="section">
          <h2>מודעות</h2>

          {filteredListings.map((l: any) => (
            <div className="section account-card" key={l.id}>
              <div>
                <b>
                  {l.manufacturer?.name} · {l.design}
                </b>
                {l.model && <> · {l.model}</>}
              </div>

              <div className="muted">
                {l.price} ₪ · {statusLabel(l.status)}
              </div>

              <div className="toolbar" style={{ marginTop: 8 }}>
                <Link className="btn" href={`/listing/${l.id}`}>
                  צפייה
                </Link>

                <Link className="btn" href={`/listing/${l.id}/edit`}>
                  עריכה
                </Link>

                {l.status !== "active" && (
                  <button
                    className="btn"
                    onClick={() =>
                      updateListingStatus(l.id, "active")
                    }
                  >
                    הפעלה
                  </button>
                )}

                {l.status === "active" && (
                  <button
                    className="btn"
                    onClick={() =>
                      updateListingStatus(l.id, "paused")
                    }
                  >
                    השהיה
                  </button>
                )}

                <button
                  className="btn danger"
                  onClick={() => {
                    if (confirm("להסיר את המודעה מהלוח?")) {
                      updateListingStatus(l.id, "deleted");
                    }
                  }}
                >
                  הסרה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "manufacturers" && (
        <div className="section">
          <h2>יצרנים</h2>

          <div className="toolbar">
            <input
              className="input"
              value={newManufacturer}
              onChange={(e) => setNewManufacturer(e.target.value)}
              placeholder="יצרן חדש"
            />
            <button className="btn primary" onClick={addManufacturer}>
              הוספה
            </button>
          </div>

          {filteredManufacturers.map((x: any) => (
            <div className="section account-card" key={x.id}>
              <div className="toolbar">
                <b>{x.name}</b>
                <span className="badge">{statusLabel(x.status)}</span>
                <AddedByUser row={x} />
              </div>

              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  onClick={() => renameManufacturer(x.id, x.name)}
                >
                  שינוי שם
                </button>

                {x.status !== "active" && (
                  <button
                    className="btn"
                    onClick={() => manufacturerStatus(x.id, "active")}
                  >
                    אישור / הפעלה
                  </button>
                )}

                {x.status === "active" && (
                  <button
                    className="btn"
                    onClick={() => manufacturerStatus(x.id, "hidden")}
                  >
                    הסתרה
                  </button>
                )}

                {x.status !== "merged" && (
                  <button
                    className="btn"
                    onClick={() => mergeManufacturer(x.id)}
                  >
                    איחוד לתוך יצרן אחר
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "materials" && (
        <div className="section">
          <h2>חומרים</h2>

          <div className="toolbar">
            <input
              className="input"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              placeholder="חומר חדש"
            />

            <select
              className="select"
              value={newMaterialParent}
              onChange={(e) => setNewMaterialParent(e.target.value)}
            >
              <option value="">ללא חומר־אב</option>
              {materials
                .filter((x: any) => !x.parent_material_id)
                .map((x: any) => (
                  <option value={x.id} key={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>

            <button className="btn primary" onClick={addMaterial}>
              הוספה
            </button>
          </div>

          {filteredMaterials.map((x: any) => (
            <div className="section account-card" key={x.id}>
              <div className="toolbar">
                <b>{x.name}</b>
                <span className="badge">{statusLabel(x.status)}</span>
                <AddedByUser row={x} />
              </div>

              <div className="muted">
                {x.parent_material_id
                  ? `תחת: ${
                      materials.find(
                        (p: any) => p.id === x.parent_material_id
                      )?.name || "לא ידוע"
                    }`
                  : "חומר־אב"}
              </div>

              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  onClick={() => renameMaterial(x.id, x.name)}
                >
                  שינוי שם
                </button>

                <select
                  className="select"
                  value={x.parent_material_id || ""}
                  onChange={(e) =>
                    updateMaterial(x.id, {
                      parent_material_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">ללא חומר־אב</option>
                  {materials
                    .filter(
                      (p: any) =>
                        !p.parent_material_id && p.id !== x.id
                    )
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>

                <select
                  className="select"
                  value={x.material_origin || ""}
                  onChange={(e) =>
                    updateMaterial(x.id, {
                      material_origin: e.target.value,
                    })
                  }
                >
                  <option value="natural">טבעי</option>
                  <option value="manmade">מלאכותי</option>
                  <option value="synthetic">סינתטי</option>
                </select>

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={!!x.vegan}
                    onChange={(e) =>
                      updateMaterial(x.id, {
                        vegan: e.target.checked,
                      })
                    }
                  />{" "}
                  טבעוני
                </label>

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={x.is_selectable !== false}
                    onChange={(e) =>
                      updateMaterial(x.id, {
                        is_selectable: e.target.checked,
                      })
                    }
                  />{" "}
                  ניתן לבחירה
                </label>

                {x.status !== "active" ? (
                  <button
                    className="btn"
                    onClick={() =>
                      updateMaterial(x.id, { status: "active" })
                    }
                  >
                    אישור / הפעלה
                  </button>
                ) : (
                  <button
                    className="btn"
                    onClick={() =>
                      updateMaterial(x.id, { status: "hidden" })
                    }
                  >
                    הסתרה
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "colors" && (
        <div className="section">
          <h2>צבעים</h2>

          {colors.map((x: any) => (
            <div className="section account-card" key={x.id}>
              <div className="toolbar">
                <span
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: "inline-block",
                    background: x.hex,
                    border: "1px solid rgba(0,0,0,.2)",
                  }}
                />
                <b>{x.label}</b>
              </div>

              <div className="toolbar" style={{ marginTop: 8 }}>
                <input
                  className="input"
                  value={x.label || ""}
                  onChange={(e) =>
                    setColors((rows) =>
                      rows.map((r) =>
                        r.id === x.id
                          ? { ...r, label: e.target.value }
                          : r
                      )
                    )
                  }
                  onBlur={() =>
                    updateColor(x.id, { label: x.label })
                  }
                />

                <input
                  className="input"
                  value={x.hex || ""}
                  onChange={(e) =>
                    setColors((rows) =>
                      rows.map((r) =>
                        r.id === x.id
                          ? { ...r, hex: e.target.value }
                          : r
                      )
                    )
                  }
                  onBlur={() => updateColor(x.id, { hex: x.hex })}
                />

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={!!x.active}
                    onChange={(e) =>
                      updateColor(x.id, {
                        active: e.target.checked,
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

          <div className="toolbar">
            <input
              className="input"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="אזור־גג חדש"
            />

            <button className="btn primary" onClick={addRegion}>
              הוספת אזור
            </button>
          </div>

          <div className="toolbar">
            <input
              className="input"
              value={newSubregion}
              onChange={(e) => setNewSubregion(e.target.value)}
              placeholder="תת־אזור חדש"
            />

            <select
              className="select"
              value={newSubregionParent}
              onChange={(e) => setNewSubregionParent(e.target.value)}
            >
              <option value="">בחרי אזור־גג</option>
              {regions.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>

            <button className="btn primary" onClick={addSubregion}>
              הוספת תת־אזור
            </button>
          </div>

          {regions.map((r: any) => (
            <div className="section account-card" key={r.id}>
              <div className="toolbar">
                <input
                  className="input"
                  value={r.name || ""}
                  onChange={(e) =>
                    setRegions((rows) =>
                      rows.map((x) =>
                        x.id === r.id
                          ? { ...x, name: e.target.value }
                          : x
                      )
                    )
                  }
                  onBlur={() =>
                    updateRegion(r.id, { name: r.name })
                  }
                />

                <label className="chip">
                  <input
                    type="checkbox"
                    checked={!!r.active}
                    onChange={(e) =>
                      updateRegion(r.id, {
                        active: e.target.checked,
                      })
                    }
                  />{" "}
                  פעיל
                </label>
              </div>

              <div style={{ marginInlineStart: 22 }}>
                {subregions
                  .filter((x: any) => x.region_id === r.id)
                  .map((x: any) => (
                    <div
                      key={x.id}
                      className="toolbar"
                      style={{ marginTop: 8 }}
                    >
                      <input
                        className="input"
                        value={x.name || ""}
                        onChange={(e) =>
                          setSubregions((rows) =>
                            rows.map((z) =>
                              z.id === x.id
                                ? { ...z, name: e.target.value }
                                : z
                            )
                          )
                        }
                        onBlur={() =>
                          updateSubregion(x.id, { name: x.name })
                        }
                      />

                      <label className="chip">
                        <input
                          type="checkbox"
                          checked={!!x.active}
                          onChange={(e) =>
                            updateSubregion(x.id, {
                              active: e.target.checked,
                            })
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
