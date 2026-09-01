"use client";


import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SIZES,
  GSM,
  CONDITIONS,
  CONDITION_HELP,
  DEFECTS,
  COLOR_PATTERNS,
} from "@/lib/constants";
import { sanitizeImage } from "@/lib/image";
import {
  HierarchicalMultiSelect,
  HierarchicalSingleSelect,
} from "@/components/HierarchicalSelect";
import HelpNote from "@/components/HelpNote";
import { helpText } from "@/lib/helpNotes";

export default function ListingForm({
  userId,
  manufacturers,
  materials,
  colors,
  regions,
  subregions,
  initial,
  allowIncomplete = false,
  helpNotes = [],
}: {
  [k: string]: any;
}) {
  const s = createClient();
  const formHelp = (key: string, fallback: string) =>
    helpText(helpNotes, key, "form", fallback);

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

  const [materialCompositionUnknown, setMaterialCompositionUnknown] =
    useState(initial?.material_composition_unknown ?? false);

  const [showNewMaterial, setShowNewMaterial] =
    useState(false);

  const [newMaterialName, setNewMaterialName] =
    useState("");

  const [newMaterialParent, setNewMaterialParent] =
    useState("");

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

  const [savedProfile, setSavedProfile] = useState<any | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(!!initial);

  const [saveDefaultsPrompt, setSaveDefaultsPrompt] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string>>({});
  const [incompletePrompt, setIncompletePrompt] =
    useState(false);
  const [incompleteErrors, setIncompleteErrors] =
    useState<Record<string, string>>({});
  const [saveDefaultsResolver, setSaveDefaultsResolver] =
    useState<((choice: "yes" | "no" | "skip") => void) | null>(null);

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

    let cancelled = false;

    s
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;

        setSavedProfile(data || null);

        if (data) {
          setContactName(data.display_name || "");
          setContactEmail(data.contact_email || "");
          setWhatsappNumber(data.whatsapp_number || "");
          setContactViaEmail(data.contact_via_email ?? false);
          setContactViaWhatsapp(data.contact_via_whatsapp ?? false);
          setShipping(data.shipping_available ?? true);
          setRegionIds(data.region_ids || []);
          setSubIds(data.subregion_ids || []);
        }

        setProfileLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initial, userId]);

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
        "יש לכתוב שם יצרן"
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
        "יש לכתוב שם חומר"
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

    const parent = localMaterials.find((m: any) => m.id === newMaterialParent);
    const familyName = (parent?.name || name).trim();
    const veganByFamily = !["משי", "צמר", "שיער בעלי חיים", "סיבים מן החי"].includes(familyName);
    const easyCareByFamily = ["כותנה", "סינתטיים"].includes(familyName);

    const payload: any = {
      name,
      parent_material_id:
        newMaterialParent || null,
      vegan: veganByFamily,
      easycare: easyCareByFamily,
      material_origin:
        newMaterialOrigin,
      is_selectable: true,
      status: "active",
      created_by: userId,
    };

    const { data, error } =
      await s
        .from("materials")
        .insert(payload)
        .select(
          "id,name,parent_material_id,vegan,easycare,material_origin,is_selectable,status"
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

  function normalizeExternalUrl(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      const parsed = new URL(withProtocol);

      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        throw new Error();
      }

      return parsed.toString();
    } catch {
      throw new Error(
        "הקישור למידע נוסף אינו כתובת תקינה"
      );
    }
  }

  function currentProfileValues() {
    return {
      display_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      whatsapp_number: whatsappNumber.trim() || null,
      contact_via_email: contactViaEmail,
      contact_via_whatsapp: contactViaWhatsapp,
      region_ids: regionIds,
      subregion_ids: subIds,
      shipping_available: shipping,
    };
  }

  function profileDiffers() {
    const current = currentProfileValues();

    if (!savedProfile) return true;

    const sorted = (x: string[] = []) => [...x].sort().join("|");

    return (
      (savedProfile.display_name || null) !== current.display_name ||
      (savedProfile.contact_email || null) !== current.contact_email ||
      (savedProfile.whatsapp_number || null) !== current.whatsapp_number ||
      !!savedProfile.contact_via_email !== current.contact_via_email ||
      !!savedProfile.contact_via_whatsapp !== current.contact_via_whatsapp ||
      sorted(savedProfile.region_ids || []) !== sorted(current.region_ids) ||
      sorted(savedProfile.subregion_ids || []) !== sorted(current.subregion_ids) ||
      !!savedProfile.shipping_available !== current.shipping_available
    );
  }

  function askSaveDefaults() {
    return new Promise<"yes" | "no" | "skip">((resolve) => {
      setSaveDefaultsResolver(() => resolve);
      setSaveDefaultsPrompt(true);
    });
  }

  function answerSaveDefaults(choice: "yes" | "no" | "skip") {
    saveDefaultsResolver?.(choice);
    setSaveDefaultsPrompt(false);
    setSaveDefaultsResolver(null);
  }

  async function maybeSaveDefaults() {
    if (!profileLoaded || !profileDiffers()) return;

    const choice = await askSaveDefaults();

    if (choice !== "yes") return;

    const values = currentProfileValues();

    const { error } = await s
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          ...values,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (!error) {
      setSavedProfile(values);
    }
  }

  function requiredFieldErrors(sum: number) {
    const errors: Record<string, string> = {};

    if (!manufacturerId && !newManufacturer.trim()) {
      errors.manufacturer =
        "צריך לבחור יצרן או להוסיף יצרן חדש";
    }

    if (!design.trim()) {
      errors.design = "צריך להזין עיצוב";
    }

    if (!price || Number(price) <= 0) {
      errors.price = "צריך להזין מחיר";
    }

    if (!size) {
      errors.size = "צריך לבחור מידה";
    }

    if (!condition) {
      errors.condition = "צריך לבחור מצב למנשא";
    }

    const hasExistingMainImage =
      (initial?.images || []).some(
        (x: any) => x.image_type === "listing"
      );

    if (
      mainImages.length < 1 &&
      !hasExistingMainImage
    ) {
      errors.mainImages =
        "צריך להוסיף לפחות תמונה ראשית אחת";
    }

    if (!shipping && !regionIds.length && !subIds.length) {
      errors.locations =
        "צריך לבחור לפחות אזור איסוף אחד או להציע משלוח";
    }

    if (!contactViaEmail && !contactViaWhatsapp) {
      errors.contactMethod =
        "צריך לבחור לפחות דרך אחת ליצירת קשר";
    }

    if (contactViaEmail && !contactEmail.trim()) {
      errors.contactEmail =
        "צריך להזין כתובת מייל";
    }

    if (contactViaWhatsapp && !whatsappNumber.trim()) {
      errors.whatsapp =
        "צריך להזין מספר WhatsApp";
    }

    if (
      !materialCompositionUnknown &&
      !mats.some((x) => x.material_id)
    ) {
      errors.materials =
        "צריך להוסיף לפחות חומר אחד";
    } else if (
      !materialCompositionUnknown &&
      Math.abs(sum - 100) > 0.001
    ) {
      errors.materials =
        "אחוזי החומרים צריכים להסתכם ב־100%";
    }

    return errors;
  }

  function scrollToFirstRequiredError(
    errors: Record<string, string>
  ) {
    const firstError = Object.keys(errors)[0];
    if (!firstError) return;

    requestAnimationFrame(() => {
      document
        .querySelector(
          `[data-required-field="${firstError}"]`
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    });
  }

  async function save(
    status: "draft" | "active" | "incomplete"
  ) {
    setBusy(true);
    setMsg("");

    try {
      const sum = mats
        .filter((x) => x.material_id)
        .reduce(
          (a, x) =>
            a + Number(x.percentage || 0),
          0
        );

      const errors =
        status === "active"
          ? requiredFieldErrors(sum)
          : {};

      if (
        status === "active" &&
        Object.keys(errors).length > 0
      ) {
        setFieldErrors(errors);

        if (allowIncomplete) {
          setIncompleteErrors(errors);
          setIncompletePrompt(true);
        } else {
          scrollToFirstRequiredError(errors);
        }

        setBusy(false);
        return;
      }

      if (status !== "active") {
        setFieldErrors({});
      }

      const mid =
        manufacturerId || newManufacturer.trim()
          ? await ensureManufacturer()
          : null;

      const normalizedMoreInfo =
        normalizeExternalUrl(moreInfo);

      const payload = {
        owner_id: userId,
        manufacturer_id: mid,
        design,
        model: model || null,
        price: Number(price || 0),
        description: description || null,
        size,
        size_note: sizeNote || null,
        gsm,
        condition,
        defects,
        defects_description: defDesc || null,
        shipping_available: shipping,
        more_info_url: normalizedMoreInfo,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        whatsapp_number: whatsappNumber || null,
        contact_via_email: contactViaEmail,
        contact_via_whatsapp: contactViaWhatsapp,
        colors: selectedColors,
        color_patterns: patterns,
        material_composition_unknown: materialCompositionUnknown,
        status,
      };

      let id = initial?.id;

      if (id) {
        const { error } = await s
          .from("listings")
          .update(payload)
          .eq("id", id);

        if (error) throw error;

        await s
          .from("listing_materials")
          .delete()
          .eq("listing_id", id);

        await s
          .from("listing_locations")
          .delete()
          .eq("listing_id", id);
      } else {
        const { data, error } = await s
          .from("listings")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        id = data.id;
      }

      const mr = mats
        .filter(
          (x) =>
            !materialCompositionUnknown &&
            x.material_id &&
            Number(x.percentage || 0) > 0
        )
        .map((x, i) => ({
          listing_id: id,
          material_id: x.material_id,
          percentage: Number(x.percentage),
          position: i,
        }));

      if (mr.length) {
        const { error } = await s
          .from("listing_materials")
          .insert(mr);

        if (error) throw error;
      }

      const selectedWholeRegions =
        new Set(regionIds);

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
        const sub = subregions.find(
          (x: any) => x.id === subId
        );

        if (!sub) continue;
        if (
          selectedWholeRegions.has(
            sub.region_id
          )
        ) {
          continue;
        }

        lr.push({
          listing_id: id,
          region_id: sub.region_id,
          subregion_id: subId,
        });
      }

      if (lr.length) {
        const { error } = await s
          .from("listing_locations")
          .insert(lr);

        if (error) throw error;
      }

      if (mainImages.length) {
        await upload(id, mainImages, "listing");
      }

      if (defectImages.length) {
        await upload(id, defectImages, "defect");
      }

      if (
        !initial &&
        (status === "active" ||
          status === "incomplete")
      ) {
        await maybeSaveDefaults();
      }

      if (
        status === "active" ||
        status === "incomplete"
      ) {
        setBusy(false);
        setPublishedListingId(id);
        return;
      }

      location.href = "/account";
    } catch (e: any) {
      setMsg(e.message || String(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className="muted"
        style={{ marginBottom: 12 }}
      >
        שדות המסומנים ב־* הם שדות חובה
      </div>
      <div className="section">
        <h2>
          זהות המנשא
          <HelpNote content={formHelp("form_overview", "את רוב פרטי המנשא אפשר למצוא על התווית, באתר היצרן או ב־WrapTrack. אם פרט מסוים אינו ידוע ולא ניתן לברר אותו, אפשר לבחור „לא ידוע”.")} />
        </h2>

        <div
          className="field"
          data-required-field="manufacturer"
        >
          <label>יצרן * <HelpNote content={formHelp("manufacturer", "brand — החברה שארגה את הבד.")} /></label>

          <select
            className="select"
            aria-label="יצרן"
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
              בחירת יצרן
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
                aria-label="יצרן חדש"
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
                placeholder="לא נמצא? אפשר לכתוב יצרן חדש"
              />

              <div className="toolbar">
                <button
                  type="button"
                  className="btn"
                  onClick={addManufacturerNow}
                >
                  הוספת יצרן
                </button>
                <HelpNote content={formHelp("manufacturer_add", "היצרן לא נמצא ברשימה? אפשר להוסיף אותו. יש לכתוב את השם המלא והמקובל באותיות לטיניות, אחרי שמוודאים שהוא אינו מופיע כבר באיות אחר. אל חשש — מנהלת תעבור בהמשך על יצרנים חדשים ותאחד או תתקן אותם במידת הצורך.")} />
              </div>
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
              {fieldErrors.manufacturer && (
            <div className="danger" role="alert">
              {fieldErrors.manufacturer}
            </div>
          )}
        </div>
          )}
        </div>

        <div
          className="field"
          data-required-field="design"
        >
          <label>עיצוב * <HelpNote content={formHelp("design", "design — למשל לה ויטה (של יארו) או אוקינמי (של אושה). ניתן לציין בעברית או באנגלית.")} /></label>

          <input
            className="input"
            aria-label="עיצוב"
            value={design}
            onChange={(e) =>
              setDesign(
                e.target.value
              )
            }
          />
          {fieldErrors.design && (
            <div className="danger" role="alert">
              {fieldErrors.design}
            </div>
          )}
        </div>

        <div className="field">
          <label>מודל <HelpNote content={formHelp("model", "model — מתייחס לצבעים או לחומרים של העיצוב.")} /></label>

          <input
            className="input"
            aria-label="מודל"
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

        <div
          className="field"
          data-required-field="size"
        >
          <label>מידה * <HelpNote content={formHelp("size", "צ׳יט שיט — אורכים משוערים:\nמידה 2 — 2.7–2.8 מ׳\nמידה 3 — 3.2 מ׳\nמידה 4 — 3.6–3.7 מ׳\nמידה 5 — 4.2 מ׳\nמידה 6 — 4.6–4.7 מ׳\nמידה 7 — 5.2 מ׳\nמידה 8 — 5.6–5.8 מ׳\nמידה 9 — 6.2 מ׳")} faqHref="/faq#sizes" /></label>

          <select
            className="select"
            aria-label="מידה"
            value={size}
            onChange={(e) =>
              setSize(
                e.target.value
              )
            }
          >
            <option value="">
              בחירת מידה
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

          {fieldErrors.size && (
            <div className="danger" role="alert">
              {fieldErrors.size}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            הערת מידה
            <HelpNote content={formHelp("size_note", "אפשר להוסיף מידע מדויק יותר, למשל: מנשא טבעות קצר, מידה 4 ארוכה, האורך המדוד של המנשא, אם הוא קוצר ממנשא אחר או המידות המדויקות של סקראפ.")} />
          </label>

          <input
            className="input"
            aria-label="הערת מידה"
            value={sizeNote}
            onChange={(e) =>
              setSizeNote(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>GSM <HelpNote content={formHelp("gsm", "GSM הוא משקל הבד בגרמים למטר רבוע. בדרך כלל אפשר למצוא אותו על התווית, באתר היצרן או ב־WrapTrack.")} faqHref="/faq#gsm" /></label>

          <select
            className="select"
            aria-label="GSM"
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

        <div
          data-required-field="materials"
          style={{ marginBottom: 8 }}
        >
          <b>הרכב חומרים *</b>

          {fieldErrors.materials && (
            <div className="danger" role="alert">
              {fieldErrors.materials}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={materialCompositionUnknown}
              onChange={(e) => {
                const checked = e.target.checked;
                setMaterialCompositionUnknown(checked);

                if (checked) {
                  setShowNewMaterial(false);
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.materials;
                    return next;
                  });
                }
              }}
            />{" "}
            הרכב לא ידוע
            <HelpNote content={formHelp("materials_unknown", "נא לסמן רק במצב שבאמת לא ניתן לברר.")} />
          </label>
        </div>

        {!materialCompositionUnknown && (
          <>

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
                  "flex-start",
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
                aria-label={`אחוז ${materialParents.find((x: any) => x.id === r.material_id)?.name || materialChildren.find((x: any) => x.id === r.material_id)?.name || "החומר"}`}
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

          <div className="toolbar">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowNewMaterial(!showNewMaterial);
                setMaterialMsg("");
              }}
            >
              לא מצאת חומר? הוספת חומר חדש
            </button>
            <HelpNote content={formHelp("material_add", "אם חסר חומר, אפשר להוסיף אותו ולעדכן כמיטב היכולת. בהמשך מנהלת תעבור על חומרים חדשים ותערוך אותם במידת הצורך.")} />
          </div>
        </div>

        {showNewMaterial && (
          <div
            className="section"
            style={{
              marginTop: 12,
              padding: 14,
            }}
          >
            <div
              className="toolbar"
              style={{
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>
                חומר חדש
              </h3>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowNewMaterial(false);
                  setMaterialMsg("");
                }}
              >
                סגירה
              </button>
            </div>

            <div className="field">
              <label>
                שם החומר
                <HelpNote content={formHelp("material_name", "הפורמט הוא שם ואז תיאור; למשל „כותנה מצרית” ולא רק „מצרית”.")} />
              </label>

              <input
                className="input"
                aria-label="שם החומר החדש"
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
                <HelpNote content={formHelp("material_parent", "יש לבחור את המשפחה המתאימה. אם יש ספק, מומלץ לבחור „שונות”.")} />
              </label>

              <select
                className="select"
                aria-label="קטגוריית אב לחומר החדש"
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
                <HelpNote content={formHelp("material_origin", "טבעי — הסיב גדל בצורתו כסיב, למשל כותנה או צמר. מלאכותי — מקור טבעי שעובד לסיב. סינתטי — סיב שמיוצר מפולימרים, למשל פוליאסטר או ניילון. אחר — כשלא ברור לאיזה סוג החומר שייך.")} faqHref="/faq#materials" />
              </label>

              <select
                className="select"
                aria-label="סוג החומר החדש"
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
          </>
        )}

        <div className="field">
          <label>צבעים <HelpNote content={formHelp("colors", "מומלץ לסמן את כל הצבעים שמופיעים במנשא, בלי להתעכב על דיוק מושלם. השפה מוגבלת בתיאור צבעים, ומה שנראה לאדם אחד כתום עשוי להיראות לאחר ורוד; מידה מסוימת של שונות ואי־ודאות היא צפויה.")} /></label>

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
                  aria-pressed={selectedColors.includes(c.key)}
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
          <label>מבנה הצביעה <HelpNote content={formHelp("color_patterns", "אין חובה לסמן. זהו סיווג נוסף שיכול לעזור בחיפוש — בעיקר בשלב שבו עוד נעזרים בהבדלים בין צבעי הבד בזמן הקשירה, וגם לחובבי פסים, אומברה, קשת ודוגמאות דומות.")} /></label>

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
                  aria-pressed={patterns.includes(k)}
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

        <div
          className="field"
          data-required-field="condition"
        >
          <label>מצב * <HelpNote content={formHelp("condition", `יש לבחור את רמת השימוש הכוללת; פגמים מתוארים בנפרד.\n\n${CONDITIONS.map(([key, label]) => `${label} — ${CONDITION_HELP[key]}`).join("\n")}`)} faqHref="/faq#condition" /></label>

          <select
            className="select"
            aria-label="מצב המנשא"
            value={condition}
            onChange={(e) =>
              setCondition(
                e.target.value
              )
            }
          >
            <option value="">
              בחירת מצב
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

          {fieldErrors.condition && (
            <div className="danger" role="alert">
              {fieldErrors.condition}
            </div>
          )}
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
                  aria-pressed={defects.includes(k)}
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
              aria-label="תיאור פגמים"
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

        <div
          className="field"
          data-required-field="price"
        >
          <label>מחיר * <HelpNote content={formHelp("price", "איך אפשר לקבוע מחיר למנשא יד שנייה?")} faqHref="/faq#pricing" /></label>

          <input
            className="input"
            aria-label="מחיר"
            inputMode="numeric"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value
              )
            }
          />
          {fieldErrors.price && (
            <div className="danger" role="alert">
              {fieldErrors.price}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            תיאור
          </label>

          <textarea
            className="textarea"
            aria-label="תיאור המודעה"
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
            משלוח זמין
            <HelpNote content={formHelp("shipping", "נהוג שדמי המשלוח משולמים על ידי הקונה, אלא אם סוכם אחרת.")} />
          </label>
        </div>

        <div data-required-field="locations">
        <HierarchicalMultiSelect
          label={shipping ? "אזורי איסוף — אופציונלי" : "אזורי איסוף *"}
          placeholder="בחירת אזורים"
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

        {fieldErrors.locations && (
          <div className="danger" role="alert">
            {fieldErrors.locations}
          </div>
        )}
        {shipping && !regionIds.length && !subIds.length && (
          <div className="muted">המודעה תפורסם עם משלוח בלבד.</div>
        )}
        </div>

        <div
          className="field"
          data-required-field="contactMethod"
        >
          <label>פרטי קשר למודעה *</label>
          <input
            className="input"
            aria-label="שם להצגה בפרטי הקשר"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="שם להצגה — אופציונלי"
          />

          {fieldErrors.contactMethod && (
            <div className="danger" role="alert">
              {fieldErrors.contactMethod}
            </div>
          )}
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
              aria-label="כתובת מייל ליצירת קשר"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="כתובת מייל ליצירת קשר"
            />
          )}

          {fieldErrors.contactEmail && (
            <div
              className="danger"
              data-required-field="contactEmail"
            >
              {fieldErrors.contactEmail}
            </div>
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
              aria-label="מספר WhatsApp ליצירת קשר"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="מספר טלפון ל־WhatsApp"
            />
          )}

          {fieldErrors.whatsapp && (
            <div
              className="danger"
              data-required-field="whatsapp"
            >
              {fieldErrors.whatsapp}
            </div>
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
            aria-label="קישור למידע נוסף"
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

        <div
          className="field"
          data-required-field="mainImages"
        >
          <label>
            תמונות ראשיות * — עד 9
          </label>

          <input
            className="input"
            type="file"
            aria-label="תמונות ראשיות"
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
          {fieldErrors.mainImages && (
            <div className="danger" role="alert">
              {fieldErrors.mainImages}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            תמונות פגמים — עד 4
          </label>

          <input
            className="input"
            type="file"
            aria-label="תמונות פגמים"
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
        <p
          className="danger"
          role="alert"
        >
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
            : initial?.id
              ? "שמירת שינויים"
              : "הוספת מודעה"}
        </button>
      </div>
      {incompletePrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="incomplete-listing-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 1100,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="section"
            style={{
              width: "min(560px, 100%)",
              margin: 0,
            }}
          >
            <h2 id="incomplete-listing-title">
              המודעה עדיין לא מלאה
            </h2>

            <p>
              חסרים במודעה פרטים שמוגדרים כשדות חובה.
              אפשר לחזור ולהשלים אותם, או לפרסם את המודעה
              כפי שהיא כמודעה חלקית.
            </p>

            <p className="muted">
              מודעות חלקיות מוצגות אחרי מודעות מלאות,
              ולכן צפויות לקבל פחות חשיפה.
            </p>

            <div className="toolbar" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setIncompletePrompt(false);
                  scrollToFirstRequiredError(
                    incompleteErrors
                  );
                }}
              >
                חזרה לעריכה
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIncompletePrompt(false);
                  save("incomplete");
                }}
              >
                פרסום מודעה חלקית
              </button>

              <button
                type="button"
                className="btn"
                onClick={() =>
                  setIncompletePrompt(false)
                }
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {saveDefaultsPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="section"
            style={{
              width: "min(520px, 100%)",
              margin: 0,
            }}
          >
            <h2>לשמור למודעות הבאות?</h2>

            <p>
              לשמור את פרטי הקשר, האזורים והמשלוח האלה כברירת מחדל למודעות הבאות?
            </p>

            <div className="toolbar">
              <button
                type="button"
                className="btn primary"
                onClick={() => answerSaveDefaults("yes")}
              >
                כן
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => answerSaveDefaults("no")}
              >
                לא
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => answerSaveDefaults("skip")}
              >
                דלגי
              </button>
            </div>
          </div>
        </div>
      )}

      {publishedListingId && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 1200,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="section"
            style={{
              width: "min(520px, 100%)",
              margin: 0,
            }}
          >
            <h2>המודעה פורסמה</h2>

            <p>
              מה תרצי לעשות עכשיו?
            </p>

            <div className="toolbar">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  location.href = `/listing/${publishedListingId}`;
                }}
              >
                צפייה במודעה
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  location.href = "/new";
                }}
              >
                הוספת מודעה נוספת
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  location.href = "/account";
                }}
              >
                לאזור שלי
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
