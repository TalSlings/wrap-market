"use client";

import { useMemo } from "react";

export type TreeParent = { id: string; name: string; selectable?: boolean };
export type TreeChild = { id: string; name: string; parent_id: string };

type MultiProps = {
  label?: string;
  placeholder?: string;
  parents: TreeParent[];
  children: TreeChild[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function HierarchicalMultiSelect({
  label,
  placeholder = "בחרי",
  parents,
  children,
  selectedIds,
  onChange,
}: MultiProps) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const childMap = useMemo(() => {
    const map = new Map<string, TreeChild[]>();
    for (const child of children) {
      const arr = map.get(child.parent_id) || [];
      arr.push(child);
      map.set(child.parent_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
    return map;
  }, [children]);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    parents.forEach((x) => map.set(x.id, x.name));
    children.forEach((x) => map.set(x.id, x.name));
    return map;
  }, [parents, children]);

  const groupIds = (parent: TreeParent) => {
    const ids = (childMap.get(parent.id) || []).map((x) => x.id);
    if (parent.selectable !== false) ids.unshift(parent.id);
    return ids;
  };

  const toggleParent = (parent: TreeParent) => {
    const ids = groupIds(parent);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    onChange([...next]);
  };

  const toggleChild = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const selectedNames = selectedIds.map((id) => nameMap.get(id)).filter(Boolean) as string[];
  const summary = selectedNames.length === 0 ? placeholder : selectedNames.length <= 2 ? selectedNames.join(", ") : `${selectedNames.length} נבחרו`;

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <details style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface, white)" }}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", listStyle: "none" }}>{summary}</summary>
        <div style={{ borderTop: "1px solid var(--line)", padding: "8px 10px 12px", maxHeight: 360, overflowY: "auto" }}>
          {parents.map((parent) => {
            const kids = childMap.get(parent.id) || [];
            const ids = groupIds(parent);
            const selectedCount = ids.filter((id) => selected.has(id)).length;
            const allSelected = ids.length > 0 && selectedCount === ids.length;
            const partial = selectedCount > 0 && !allSelected;
            return (
              <div key={parent.id} style={{ padding: "5px 0" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 650, cursor: "pointer" }}>
                  <input type="checkbox" checked={allSelected} onChange={() => toggleParent(parent)} />
                  <span>{partial ? "◩ " : ""}{parent.name}</span>
                </label>
                {kids.length > 0 && (
                  <div style={{ marginInlineStart: 28, paddingTop: 4, display: "grid", gap: 5 }}>
                    {kids.map((child) => (
                      <label key={child.id} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontWeight: 400 }}>
                        <input type="checkbox" checked={selected.has(child.id)} onChange={() => toggleChild(child.id)} />
                        <span>{child.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

type SingleProps = {
  value: string;
  onChange: (id: string) => void;
  parents: TreeParent[];
  children: TreeChild[];
  placeholder?: string;
};

export function HierarchicalSingleSelect({
  value,
  onChange,
  parents,
  children,
  placeholder = "בחרי",
}: SingleProps) {
  const childMap = useMemo(() => {
    const map = new Map<string, TreeChild[]>();
    for (const child of children) {
      const arr = map.get(child.parent_id) || [];
      arr.push(child);
      map.set(child.parent_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
    return map;
  }, [children]);

  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {parents.map((parent) => {
        const kids = childMap.get(parent.id) || [];
        if (kids.length === 0) {
          return parent.selectable === false ? null : <option key={parent.id} value={parent.id}>{parent.name}</option>;
        }
        return (
          <optgroup key={parent.id} label={parent.name}>
            {parent.selectable !== false && <option value={parent.id}>{parent.name}</option>}
            {kids.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
          </optgroup>
        );
      })}
    </select>
  );
}
