const EASY_CARE_FAMILIES = new Set(["כותנה", "סינתטיים"]);

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
    let rootName = normalize(material?.name);

    while (material) {
      rootName = normalize(material.name);
      const parentId = material.parent_material_id;
      if (!parentId || visited.has(parentId)) break;
      visited.add(parentId);
      material = byId.get(parentId);
    }

    return EASY_CARE_FAMILIES.has(rootName);
  });
}

