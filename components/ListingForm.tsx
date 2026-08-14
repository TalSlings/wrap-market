"use client";


import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SIZES,
  GSM,
  CONDITIONS,
  DEFECTS,
  COLOR_PATTERNS,
} from "@/lib/constants";
import { sanitizeImage } from "@/lib/image";
import {
  HierarchicalMultiSelect,
  HierarchicalSingleSelect,
} from "@/components/HierarchicalSelect";

export default function ListingForm({
  userId,
  manufacturers,
  materials,
  colors,
  regions,
  subregions,
  initial,
}: {
  [k: string]: any;
}) {
  const s = createClient();

  const [localManufacturers, setLocalManufacturers] =
    useState<any[]>(manufacturers);

  const [localMaterials, setLocalMaterials] =
    useState<any[]>(materials);

  const [manufacturerId, setManufacturerId] = useState(
    initial?.manufacturer_id || ""
  );

  const [newManufacturer, setNewManufacturer] = useState("");
  const [manufacturerMsg, setManufacturerMsg] = useState("");

  const [design, setDesign] = useState(initial?.design || "");
  const [model, setModel] = useState(initial?.model || "");

  const [price, setPrice] = useState(
    String(initial?.price || "")
  );

  const [description, setDescription] = useState(
    initial?.description || ""
  );

  const [size, setSize] = useState(initial?.size || "");

  const [sizeNote, setSizeNote] = useState(
    initial?.size_note || ""
  );

  const [gsm, setGsm] = useState(
    initial?.gsm || "unknown"
  );

  const [condition, setCondition] = useState(
    initial?.condition || ""
  );

  const [defects, setDefects] = useState<string[]>(
    initial?.defects || ["none"]
  );

  const [defDesc, setDefDesc] = useState(
    initial?.defects_description || ""
  );

  const [shipping, setShipping] = useState(
    initial?.shipping_available ?? true
  );

  const [moreInfo, setMoreInfo] = useState(
    initial?.more_info_url || ""
  );

  const [contactName, setContactName] = useState(initial?.contact_name || "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initial?.whatsapp_number || "");
  const [contactViaEmail, setContactViaEmail] = useState(initial?.contact_via_email ?? false);
  const [contactViaWhatsapp, setContactViaWhatsapp] = useState(initial?.contact_via_whatsapp ?? false);

  const [selectedColors, setSelectedColors] =
    useState<string[]>(
      initial?.colors || []
    );

  const [patterns, setPatterns] =
    useState<string[]>(
      initial?.color_patterns || []
    );

  const [mats, setMats] = useState<any[]>(
    initial?.materials?.map((x: any) => ({
      material_id: x.material_id,
      percentage: String(x.percentage),
    })) || [
      {
        material_id: "",
        percentage: "",
      },
    ]
  );

  const [showNewMaterial, setShowNewMaterial] =
    useState(false);

  const [newMaterialName, setNewMaterialName] =
    useState("");

  const [newMaterialParent, setNewMaterialParent] =
    useState("");

  const [newMaterialVegan, setNewMaterialVegan] =
    useState(true);

  const [newMaterialOrigin, setNewMaterialOrigin] =
    useState("natural");

  const [materialMsg, setMaterialMsg] = useState("");

  const [regionIds, setRegionIds] =
    useState<string[]>(
      initial?.locations?.map(
        (x: any) => x.region_id
      ) || []
    );

  const [subIds, setSubIds] =
    useState<string[]>(
      initial?.locations
        ?.map((x: any) => x.subregion_id)
        .filter(Boolean) || []
    );

  const [mainImages, setMainImages] =
    useState<File[]>([]);

  const [defectImages, setDefectImages] =
    useState<File[]>([]);

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (a: string[], v: string) =>
    a.includes(v)
      ? a.filter((x) => x !== v)
      : [...a, v];

  const materialParents = useMemo(
    () =>
      localMaterials
        .filter(
          (m: any) =>
            !m.parent_material_id &&
            m.status !== "hidden"
        )
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          selectable:
            m.is_selectable !== false,
        }))
        .sort((a: any, b: any) =>
          a.name.localeCompare(
            b.name,
            "he"
          )
        ),
    [localMaterials]
  );

  const materialChildren = useMemo(
    () =>
      localMaterials
        .filter(
          (m: any) =>
            m.parent_material_id &&
            m.status !== "hidden" &&
            m.is_selectable !== false
        )
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          parent_id:
            m.parent_material_id,
        })),
    [localMaterials]
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
      subregions.map((x: any) => ({
        id: x.id,
        name: x.name,
        parent_id: x.region_id,
      })),
    [subregions]
  );

  const selectedLocations = useMemo(
    () => [
      ...regionIds,
      ...subIds,
    ],
    [regionIds, subIds]
  );

  const setSelectedLocations = (
    ids: string[]
  ) => {
    const regionSet = new Set(
      regions.map(
        (r: any) => r.id
      )
    );

    const subSet = new Set(
      subregions.map(
        (x: any) => x.id
      )
    );

    setRegionIds(
      ids.filter((id) =>
        regionSet.has(id)
      )
    );

    setSubIds(
      ids.filter((id) =>
        subSet.has(id)
      )
    );
  };

  useEffect(() => {
    if (initial) return;

    try {
      const x = JSON.parse(
        sessionStorage.getItem(
          "wrap-market-last-publish"
        ) || "{}"
      );

      if (x.shipping !== undefined) {
        setShipping(x.shipping);
      }

      if (x.regionIds) {
        setRegionIds(x.regionIds);
      }

      if (x.subIds) {
        setSubIds(x.subIds);
      }
    } catch {}
  }, [initial]);

  const toggleDef = (
    v: string
  ) => {
    if (v === "none") {
      setDefects(["none"]);
    } else {
      setDefects(
        toggle(
          defects.filter(
            (x) => x !== "none"
          ),
          v
        )
      );
    }
  };

  async function addManufacturerNow() {
    const name =
      newManufacturer.trim();

    if (!name) {
      setManufacturerMsg(
        "כתבי שם יצרן"
      );
      return "";
    }

    const existing =
      localManufacturers.find(
        (m: any) =>
          m.name
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (existing) {
      setManufacturerId(
        existing.id
      );

      setNewManufacturer("");

      setManufacturerMsg(
        "היצרן כבר קיים ונבחר"
      );

      return existing.id;
    }

    const { data, error } =
      await s
        .from("manufacturers")
        .insert({
          name,
          created_by: userId,
        })
        .select(
          "id,name,status"
        )
        .single();

    if (error) {
      setManufacturerMsg(
        error.message
      );
      return "";
    }

    setLocalManufacturers(
      (prev) =>
        [...prev, data].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "he"
            )
        )
    );

    setManufacturerId(
      data.id
    );

    setNewManufacturer("");

    setManufacturerMsg(
      "היצרן נוסף ונבחר"
    );

    return data.id;
  }

  async function ensureManufacturer() {
    if (manufacturerId) {
      return manufacturerId;
    }

    if (!newManufacturer.trim()) {
      throw new Error(
        "צריך לבחור או להוסיף יצרן"
      );
    }

    const id =
      await addManufacturerNow();

    if (!id) {
      throw new Error(
        "לא הצלחנו להוסיף את היצרן"
      );
    }

    return id;
  }

  async function addMaterialNow() {
    setMaterialMsg("");

    const name =
      newMaterialName.trim();

    if (!name) {
      setMaterialMsg(
        "כתבי שם חומר"
      );
      return;
    }

    const existing =
      localMaterials.find(
        (m: any) =>
          m.name
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (existing) {
      setMaterialMsg(
        "החומר כבר קיים ברשימה"
      );
      return;
    }

    const payload: any = {
      name,
      parent_material_id:
        newMaterialParent || null,
      vegan:
        newMaterialVegan,
      material_origin:
        newMaterialOrigin,
      is_selectable: true,
      status: "active",
    };

    const { data, error } =
      await s
        .from("materials")
        .insert(payload)
        .select(
          "id,name,parent_material_id,vegan,material_origin,is_selectable,status"
        )
        .single();

    if (error) {
      setMaterialMsg(
        error.message
      );
      return;
    }

    setLocalMaterials(
      (prev) => [
        ...prev,
        data,
      ]
    );

    setMats((prev) => {
      const emptyIndex =
        prev.findIndex(
          (x) =>
            !x.material_id
        );

      if (
        emptyIndex >= 0
      ) {
        const next = [
          ...prev,
        ];

        next[emptyIndex] = {
          ...next[
            emptyIndex
          ],
          material_id:
            data.id,
        };

        return next;
      }

      if (prev.length < 10) {
        return [
          ...prev,
          {
            material_id:
              data.id,
            percentage: "",
          },
        ];
      }

      return prev;
    });

    setNewMaterialName("");
    setNewMaterialParent("");
    setNewMaterialVegan(true);
    setNewMaterialOrigin(
      "natural"
    );

    setShowNewMaterial(false);

    setMaterialMsg(
      "החומר נוסף ונבחר"
    );
  }

  async function upload(
    id: string,
    files: File[],
    kind:
      | "listing"
      | "defect"
  ) {
    for (
      let i = 0;
      i < files.length;
      i++
    ) {
      const blob =
        await sanitizeImage(
          files[i]
        );

      const path =
        `${userId}/${id}/${kind}-${Date.now()}-${i}.jpg`;

      const { error } =
        await s.storage
          .from(
            "listing-images"
          )
          .upload(
            path,
            blob,
            {
              contentType:
                "image/jpeg",
            }
          );

      if (error) {
        throw error;
      }

      const { error: e } =
        await s
          .from(
            "listing_images"
          )
          .insert({
            listing_id: id,
            owner_id: userId,
            storage_path:
              path,
            image_type: kind,
            position: i,
          });

      if (e) {
        throw e;
      }
    }
  }

  async function save(
    status:
      | "draft"
      | "active"
  ) {
    setBusy(true);
    setMsg("");

    try {
      const mid =
        await ensureManufacturer();

      const sum = mats
        .filter(
          (x) =>
            x.material_id
        )
        .reduce(
          (a, x) =>
            a +
            Number(
              x.percentage ||
                0
            ),
          0
        );

      if (
        status ===
        "active"
      ) {
        if (
          !design ||
          !price ||
          !size ||
          !condition
        ) {
          throw new Error(
            "חסרים שדות חובה"
          );
        }

        if (
          !initial &&
          mainImages.length <
            1
        ) {
          throw new Error(
            "צריך לפחות תמונה אחת"
          );
        }

        if (
          !mats.some(
            (x) =>
              x.material_id
          ) ||
          Math.abs(
            sum - 100
          ) > 0.001
        ) {
          throw new Error(
            "הרכב החומרים צריך להסתכם ב־100%"
          );
        }

        if (
          !regionIds.length &&
          !subIds.length
        ) {
          throw new Error(
            "צריך לבחור לפחות אזור אחד"
          );
        }

        if (!contactViaEmail && !contactViaWhatsapp) {
          throw new Error("צריך לבחור לפחות דרך אחת ליצירת קשר");
        }

        if (contactViaEmail && !contactEmail.trim()) {
          throw new Error("סימנת פנייה במייל, אבל לא הזנת כתובת מייל");
        }

        if (contactViaWhatsapp && !whatsappNumber.trim()) {
          throw new Error("סימנת פנייה ב־WhatsApp, אבל לא הזנת מספר");
        }
      }

      const payload = {
        owner_id: userId,
        manufacturer_id:
          mid,
        design,
        model:
          model || null,
        price: Number(
          price || 0
        ),
        description:
          description ||
          null,
        size,
        size_note:
          sizeNote ||
          null,
        gsm,
        condition,
        defects,
        defects_description:
          defDesc || null,
        shipping_available:
          shipping,
        more_info_url:
          moreInfo || null,
        contact_name:
          contactName || null,
        contact_email:
          contactEmail || null,
        whatsapp_number:
          whatsappNumber || null,
        contact_via_email:
          contactViaEmail,
        contact_via_whatsapp:
          contactViaWhatsapp,
        colors:
          selectedColors,
        color_patterns:
          patterns,
        status,
      };

      let id = initial?.id;

      if (id) {
        const { error } =
          await s
            .from(
              "listings"
            )
            .update(
              payload
            )
            .eq(
              "id",
              id
            );

        if (error) {
          throw error;
        }

        await s
          .from(
            "listing_materials"
          )
          .delete()
          .eq(
            "listing_id",
            id
          );

        await s
          .from(
            "listing_locations"
          )
          .delete()
          .eq(
            "listing_id",
            id
          );
      } else {
        const {
          data,
          error,
        } = await s
          .from(
            "listings"
          )
          .insert(
            payload
          )
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        id = data.id;
      }

      const mr = mats
        .filter(
          (x) =>
            x.material_id
        )
        .map(
          (x, i) => ({
            listing_id:
              id,
            material_id:
              x.material_id,
            percentage:
              Number(
                x.percentage
              ),
            position: i,
          })
        );

      if (mr.length) {
        const { error } =
          await s
            .from(
              "listing_materials"
            )
            .insert(mr);

        if (error) {
          throw error;
        }
      }

      const selectedWholeRegions = new Set(regionIds);

      const lr: {
        listing_id: string;
        region_id: string;
        subregion_id: string | null;
      }[] = [];

      for (const regionId of regionIds) {
        lr.push({
          listing_id: id,
          region_id: regionId,
          subregion_id: null,
        });
      }

      for (const subId of subIds) {
        const sub = subregions.find((x: any) => x.id === subId);

        if (!sub) continue;
        if (selectedWholeRegions.has(sub.region_id)) continue;

        lr.push({
          listing_id: id,
          region_id: sub.region_id,
          subregion_id: subId,
        });
      }

      if (lr.length) {
        const { error } =
          await s
            .from(
              "listing_locations"
            )
            .insert(lr);

        if (error) {
          throw error;
        }
      }

      if (
        mainImages.length
      ) {
        await upload(
          id,
          mainImages,
          "listing"
        );
      }

      if (
        defectImages.length
      ) {
        await upload(
          id,
          defectImages,
          "defect"
        );
      }

      sessionStorage.setItem(
        "wrap-market-last-publish",
        JSON.stringify({
          shipping,
          regionIds,
          subIds,
        })
      );

      location.href =
        status === "active"
          ? `/listing/${id}`
          : "/account";
    } catch (e: any) {
      setMsg(
        e.message ||
          String(e)
      );

      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section">
        <h2>
          זהות המנשא
        </h2>

        <div className="field">
          <label>
            יצרן ⓘ
          </label>

          <select
            className="select"
            value={
              manufacturerId
            }
            onChange={(e) => {
              setManufacturerId(
                e.target.value
              );

              setManufacturerMsg(
                ""
              );
            }}
          >
            <option value="">
              בחרי יצרן
            </option>

            {localManufacturers.map(
              (m: any) => (
                <option
                  key={m.id}
                  value={m.id}
                >
                  {m.name}
                </option>
              )
            )}
          </select>

          {!manufacturerId && (
            <div
              style={{
                display:
                  "grid",
                gap: 8,
                marginTop: 8,
              }}
            >
              <input
                className="input"
                value={
                  newManufacturer
                }
                onChange={(
                  e
                ) =>
                  setNewManufacturer(
                    e.target
                      .value
                  )
                }
                placeholder="לא מצאת? כתבי יצרן חדש"
              />

              <button
                type="button"
                className="btn"
                onClick={
                  addManufacturerNow
                }
              >
                הוספת יצרן
              </button>
            </div>
          )}

          {manufacturerMsg && (
            <div
              className="notice"
              style={{
                marginTop: 8,
              }}
            >
              {
                manufacturerMsg
              }
            </div>
          )}
        </div>

        <div className="field">
          <label>
            עיצוב ⓘ
          </label>

          <input
            className="input"
            value={design}
            onChange={(e) =>
              setDesign(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>
            מודל ⓘ
          </label>

          <input
            className="input"
            value={model}
            onChange={(e) =>
              setModel(
                e.target.value
              )
            }
          />
        </div>

        <div
          style={{
            height: 1,
            background:
              "var(--line)",
            margin: "22px 0",
          }}
        />

        <div className="field">
          <label>
            מידה ⓘ
          </label>

          <select
            className="select"
            value={size}
            onChange={(e) =>
              setSize(
                e.target.value
              )
            }
          >
            <option value="">
              בחרי
            </option>

            {SIZES.map(
              ([k, l]) => (
                <option
                  key={k}
                  value={k}
                >
                  {l}
                </option>
              )
            )}
          </select>
        </div>

        <div className="field">
          <label>
            הערת מידה
          </label>

          <input
            className="input"
            value={sizeNote}
            onChange={(e) =>
              setSizeNote(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>
            GSM ⓘ
          </label>

          <select
            className="select"
            value={gsm}
            onChange={(e) =>
              setGsm(
                e.target.value
              )
            }
          >
            {GSM.map(
              ([k, l]) => (
                <option
                  key={k}
                  value={k}
                >
                  {l}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="section">
        <h2>
          חומרים וצבע
        </h2>

        {mats.map(
          (r, i) => (
            <div
              className="material-row"
              key={i}
              style={{
                display:
                  "flex",
                gap: 8,
                alignItems:
                  "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                }}
              >
                <HierarchicalSingleSelect
                  value={
                    r.material_id
                  }
                  onChange={(
                    id
                  ) => {
                    const n = [
                      ...mats,
                    ];

                    n[i] = {
                      ...n[i],
                      material_id:
                        id,
                    };

                    setMats(n);
                  }}
                  parents={
                    materialParents
                  }
                  children={
                    materialChildren
                  }
                  placeholder="חומר"
                />
              </div>

              <input
                className="input"
                style={{
                  width: 90,
                }}
                inputMode="decimal"
                placeholder="%"
                value={
                  r.percentage
                }
                onChange={(e) => {
                  const n = [
                    ...mats,
                  ];

                  n[i] = {
                    ...n[i],
                    percentage:
                      e.target
                        .value,
                  };

                  setMats(n);
                }}
              />

              <button
                type="button"
                className="btn"
                aria-label="הסרת חומר"
                onClick={() =>
                  setMats(
                    mats.filter(
                      (
                        _,
                        index
                      ) =>
                        index !== i
                    )
                  )
                }
              >
                הסר
              </button>
            </div>
          )
        )}

        <div className="toolbar">
          {mats.length < 10 && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                setMats([
                  ...mats,
                  {
                    material_id:
                      "",
                    percentage:
                      "",
                  },
                ])
              }
            >
              ＋ חומר
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={() => {
              setShowNewMaterial(
                !showNewMaterial
              );

              setMaterialMsg(
                ""
              );
            }}
          >
            לא מצאת חומר?
            הוסיפי חדש
          </button>
        </div>

        {showNewMaterial && (
          <div
            className="section"
            style={{
              marginTop: 12,
              padding: 14,
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              חומר חדש
            </h3>

            <div className="field">
              <label>
                שם החומר
              </label>

              <input
                className="input"
                value={
                  newMaterialName
                }
                onChange={(e) =>
                  setNewMaterialName(
                    e.target
                      .value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                שייך לקטגוריה
              </label>

              <select
                className="select"
                value={
                  newMaterialParent
                }
                onChange={(e) =>
                  setNewMaterialParent(
                    e.target
                      .value
                  )
                }
              >
                <option value="">
                  ללא קטגוריית אב
                </option>

                {materialParents.map(
                  (m: any) => (
                    <option
                      key={m.id}
                      value={m.id}
                    >
                      {m.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label>
                סוג חומר
              </label>

              <select
                className="select"
                value={
                  newMaterialOrigin
                }
                onChange={(e) =>
                  setNewMaterialOrigin(
                    e.target
                      .value
                  )
                }
              >
                <option value="natural">
                  טבעי
                </option>

                <option value="artificial">
                  מלאכותי
                </option>

                <option value="synthetic">
                  סינתטי
                </option>

                <option value="other">
                  אחר
                </option>
              </select>
            </div>

            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={
                    newMaterialVegan
                  }
                  onChange={(
                    e
                  ) =>
                    setNewMaterialVegan(
                      e.target
                        .checked
                    )
                  }
                />{" "}
                טבעוני
              </label>
            </div>

            <button
              type="button"
              className="btn primary"
              onClick={
                addMaterialNow
              }
            >
              הוספת חומר
            </button>
          </div>
        )}

        {materialMsg && (
          <div
            className="notice"
            style={{
              marginTop: 8,
            }}
          >
            {materialMsg}
          </div>
        )}

        <div className="field">
          <label>
            צבעים
          </label>

          <div className="chips">
            {colors.map(
              (c: any) => (
                <button
                  type="button"
                  key={c.key}
                  className={
                    "chip " +
                    (selectedColors.includes(
                      c.key
                    )
                      ? "active"
                      : "")
                  }
                  onClick={() =>
                    setSelectedColors(
                      toggle(
                        selectedColors,
                        c.key
                      )
                    )
                  }
                >
                  <span
                    className="swatch"
                    style={{
                      display:
                        "inline-block",
                      background:
                        c.hex,
                    }}
                  />{" "}
                  {c.label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="field">
          <label>
            מבנה הצביעה
          </label>

          <div className="chips">
            {COLOR_PATTERNS.map(
              ([k, l]) => (
                <button
                  type="button"
                  key={k}
                  className={
                    "chip " +
                    (patterns.includes(
                      k
                    )
                      ? "active"
                      : "")
                  }
                  onClick={() =>
                    setPatterns(
                      toggle(
                        patterns,
                        k
                      )
                    )
                  }
                >
                  {l}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <h2>
          מצב
        </h2>

        <div className="field">
          <label>
            מצב
          </label>

          <select
            className="select"
            value={condition}
            onChange={(e) =>
              setCondition(
                e.target.value
              )
            }
          >
            <option value="">
              בחרי
            </option>

            {CONDITIONS.map(
              ([k, l]) => (
                <option
                  key={k}
                  value={k}
                >
                  {l}
                </option>
              )
            )}
          </select>
        </div>

        <div className="field">
          <label>
            פגמים
          </label>

          <div className="chips">
            {DEFECTS.map(
              ([k, l]) => (
                <button
                  type="button"
                  key={k}
                  className={
                    "chip " +
                    (defects.includes(
                      k
                    )
                      ? "active"
                      : "")
                  }
                  onClick={() =>
                    toggleDef(k)
                  }
                >
                  {l}
                </button>
              )
            )}
          </div>
        </div>

        {!defects.includes(
          "none"
        ) && (
          <div className="field">
            <label>
              תיאור פגמים
            </label>

            <textarea
              className="textarea"
              value={defDesc}
              onChange={(e) =>
                setDefDesc(
                  e.target
                    .value
                )
              }
            />
          </div>
        )}
      </div>

      <div className="section">
        <h2>
          מכירה ומסירה
        </h2>

        <div className="field">
          <label>
            מחיר
          </label>

          <input
            className="input"
            inputMode="numeric"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>
            תיאור
          </label>

          <textarea
            className="textarea"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={shipping}
              onChange={(e) =>
                setShipping(
                  e.target
                    .checked
                )
              }
            />{" "}
            משלוח זמין ⓘ
          </label>

          <div className="notice">
            דמי משלוח על חשבון
            הקונה אלא אם צוין
            אחרת.
          </div>
        </div>

        <HierarchicalMultiSelect
          label="אזורים"
          placeholder="בחרי אזורים"
          parents={
            regionParents
          }
          children={
            regionChildren
          }
          selectedIds={
            selectedLocations
          }
          onChange={
            setSelectedLocations
          }
        />

        <div className="field">
          <label>פרטי קשר למודעה</label>
          <input
            className="input"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="שם להצגה — אופציונלי"
          />
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={contactViaEmail}
              onChange={(e) => setContactViaEmail(e.target.checked)}
            />{" "}
            לאפשר פנייה במייל
          </label>

          {contactViaEmail && (
            <input
              className="input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="כתובת מייל ליצירת קשר"
            />
          )}
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={contactViaWhatsapp}
              onChange={(e) => setContactViaWhatsapp(e.target.checked)}
            />{" "}
            לאפשר פנייה ב־WhatsApp
          </label>

          {contactViaWhatsapp && (
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="מספר טלפון ל־WhatsApp"
            />
          )}
        </div>

        <div className="notice">
          פרטי הקשר יוצגו רק למשתמשות מחוברות.
        </div>

        <div className="field">
          <label>
            קישור למידע נוסף
          </label>

          <input
            className="input"
            type="url"
            value={moreInfo}
            onChange={(e) =>
              setMoreInfo(
                e.target.value
              )
            }
            placeholder="WrapTrack / אתר היצרן"
          />
        </div>
      </div>

      <div className="section">
        <h2>
          תמונות
        </h2>

        <div className="notice">
          יש אנשים בתמונה?
          מומלץ לכסות או לטשטש
          פנים, במיוחד של ילדים,
          לפני ההעלאה.
        </div>

        <div className="field">
          <label>
            תמונות ראשיות — עד 9
          </label>

          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setMainImages(
                Array.from(
                  e.target
                    .files || []
                ).slice(0, 9)
              )
            }
          />
        </div>

        <div className="field">
          <label>
            תמונות פגמים — עד 4
          </label>

          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setDefectImages(
                Array.from(
                  e.target
                    .files || []
                ).slice(0, 4)
              )
            }
          />
        </div>
      </div>

      {msg && (
        <p className="danger">
          {msg}
        </p>
      )}

      <div className="toolbar">
        <button
          className="btn"
          disabled={busy}
          onClick={() =>
            save("draft")
          }
        >
          שמירת טיוטה
        </button>

        <button
          className="btn primary"
          disabled={busy}
          onClick={() =>
            save("active")
          }
        >
          {busy
            ? "שומרת..."
            : "פרסום מודעה"}
        </button>
      </div>
    </div>
  );
}
