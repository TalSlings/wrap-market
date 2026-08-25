const NOT_EASY_CARE = new Set([
  "משי",
  "שיער בעלי חיים",
  "פשתן",
  "קנבוס",
  "המפ",
]);

const normalize = (value?: string | null) =>
  (value || "").trim().toLocaleLowerCase("he");

export function isEasyCareBlend(
  listingMaterials: any[] = [],
  materialCatalog: any[] = []
) {
  if (!listingMaterials.length) return false;

  const byId = new Map(
    materialCatalog.map((material: any) => [material.id, material])
  );

  return listingMaterials.every((row: any) => {
    let material = row.material || row;
    const visited = new Set<string>();

    while (material) {
      if (NOT_EASY_CARE.has(normalize(material.name))) return false;
      const parentId = material.parent_material_id;
      if (!parentId || visited.has(parentId)) break;
      visited.add(parentId);
      material = byId.get(parentId);
    }

    return true;
  });
}
