"use client";

import { useMemo, useRef } from "react";

export type TreeParent = {
  id: string;
  name: string;
  selectable?: boolean;
};

export type TreeChild = {
  id: string;
  name: string;
  parent_id: string;
};

const boxStyle = {
  border: "1px solid #777",
  borderRadius: "var(--radius)",
  background: "var(--surface, white)",
} as const;

function closeOtherFilterDropdowns(
  current: HTMLDetailsElement | null
) {
  if (!current?.open) return;

  document
    .querySelectorAll<HTMLDetailsElement>(
      'details[data-filter-dropdown="true"][open]'
    )
    .forEach((details) => {
      if (details !== current) {
        details.open = false;
      }
    });
}

function DropdownSummary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <summary
      style={{
        cursor: "pointer",
        padding: "12px 14px",
        listStyle: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
      <span
        aria-hidden="true"
        style={{
          flex: "0 0 auto",
          fontSize: 16,
          lineHeight: 1,
          opacity: 0.75,
        }}
      >
        ▾
      </span>
    </summary>
  );
}

export function FlatMultiSelect({
  label,
  placeholder = "בחרי",
  options,
  selectedIds,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const closeWithEscape = (e: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (e.key !== "Escape" || !detailsRef.current?.open) return;

    e.preventDefault();
    detailsRef.current.open = false;
    detailsRef.current.querySelector("summary")?.focus();
  };

  const toggle = (id: string) => {
    const next = new Set(selected);

    if (next.has(id)) next.delete(id);
    else next.add(id);

    onChange([...next]);
  };

  const names = selectedIds
    .map((id) => options.find((x) => x.id === id)?.name)
    .filter(Boolean) as string[];

  const summary =
    names.length === 0
      ? placeholder
      : names.length <= 2
        ? names.join(", ")
        : `${names.length} נבחרו`;

  return (
    <div className="field">
      {label && <label>{label}</label>}

      <details
        ref={detailsRef}
        data-filter-dropdown="true"
        style={boxStyle}
        onToggle={() =>
          closeOtherFilterDropdowns(detailsRef.current)
        }
        onKeyDown={closeWithEscape}
      >
        <DropdownSummary>{summary}</DropdownSummary>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "8px 10px 12px",
            maxHeight: 320,
            overflowY: "auto",
            display: "grid",
            gap: 6,
          }}
        >
          {options.map((option) => (
            <label
              key={option.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span>{option.name}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

export function HierarchicalMultiSelect({
  label,
  placeholder = "בחרי",
  parents,
  children,
  selectedIds,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  parents: TreeParent[];
  children: TreeChild[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const closeWithEscape = (e: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (e.key !== "Escape" || !detailsRef.current?.open) return;

    e.preventDefault();
    detailsRef.current.open = false;
    detailsRef.current.querySelector("summary")?.focus();
  };

  const childMap = useMemo(() => {
    const map = new Map<string, TreeChild[]>();

    for (const child of children) {
      const arr = map.get(child.parent_id) || [];
      arr.push(child);
      map.set(child.parent_id, arr);
    }

    for (const arr of map.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
    }

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

    if (parent.selectable !== false) {
      ids.unshift(parent.id);
    }

    return ids;
  };

  const toggleParent = (parent: TreeParent) => {
    const ids = groupIds(parent);

    const allSelected =
      ids.length > 0 && ids.every((id) => selected.has(id));

    const next = new Set(selected);

    ids.forEach((id) => {
      if (allSelected) next.delete(id);
      else next.add(id);
    });

    onChange([...next]);
  };

  const toggleChild = (id: string) => {
    const next = new Set(selected);

    if (next.has(id)) next.delete(id);
    else next.add(id);

    onChange([...next]);
  };

  const names = selectedIds
    .map((id) => nameMap.get(id))
    .filter(Boolean) as string[];

  const summary =
    names.length === 0
      ? placeholder
      : names.length <= 2
        ? names.join(", ")
        : `${names.length} נבחרו`;

  return (
    <div className="field">
      {label && <label>{label}</label>}

      <details
        ref={detailsRef}
        data-filter-dropdown="true"
        style={boxStyle}
        onToggle={() =>
          closeOtherFilterDropdowns(detailsRef.current)
        }
        onKeyDown={closeWithEscape}
      >
        <DropdownSummary>{summary}</DropdownSummary>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "8px 10px 12px",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {parents.map((parent) => {
            const kids = childMap.get(parent.id) || [];
            const ids = groupIds(parent);

            const selectedCount = ids.filter((id) =>
              selected.has(id)
            ).length;

            const allSelected =
              ids.length > 0 && selectedCount === ids.length;

            const partial =
              selectedCount > 0 && !allSelected;

            return (
              <div key={parent.id} style={{ padding: "5px 0" }}>
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => toggleParent(parent)}
                  />

                  <span>
                    {partial ? "◩ " : ""}
                    {parent.name}
                  </span>
                </label>

                {kids.length > 0 && (
                  <div
                    style={{
                      marginInlineStart: 28,
                      paddingTop: 4,
                      display: "grid",
                      gap: 5,
                    }}
                  >
                    {kids.map((child) => (
                      <label
                        key={child.id}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          cursor: "pointer",
                          fontWeight: 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(child.id)}
                          onChange={() => toggleChild(child.id)}
                        />
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

export function HierarchicalSingleSelect({
  label,
  value,
  onChange,
  parents,
  children,
  placeholder = "בחרי",
}: {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  parents: TreeParent[];
  children: TreeChild[];
  placeholder?: string;
}) {
  const childMap = useMemo(() => {
    const map = new Map<string, TreeChild[]>();

    for (const child of children) {
      const arr = map.get(child.parent_id) || [];
      arr.push(child);
      map.set(child.parent_id, arr);
    }

    for (const arr of map.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "he"));
    }

    return map;
  }, [children]);

  const selectedName =
    parents.find((x) => x.id === value)?.name ||
    children.find((x) => x.id === value)?.name ||
    placeholder;

  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const closeWithEscape = (e: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (e.key !== "Escape" || !detailsRef.current?.open) return;

    e.preventDefault();
    detailsRef.current.open = false;
    detailsRef.current.querySelector("summary")?.focus();
  };

  const choose = (id: string) => {
    onChange(id);

    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };


  return (
    <div className="field" style={{ margin: 0 }}>
      {label && <label>{label}</label>}

      <details
        ref={detailsRef}
        data-filter-dropdown="true"
        style={boxStyle}
        onToggle={() =>
          closeOtherFilterDropdowns(detailsRef.current)
        }
        onKeyDown={closeWithEscape}
      >
        <DropdownSummary>{selectedName}</DropdownSummary>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "8px 10px 12px",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {parents.map((parent) => {
            const kids = childMap.get(parent.id) || [];

            return (
              <div key={parent.id} style={{ padding: "5px 0" }}>
                <div
                  style={{
                    fontWeight: 650,
                    paddingBottom: 4,
                  }}
                >
                  {parent.name}
                </div>

                {parent.selectable !== false && (
                  <button
                    type="button"
                    aria-pressed={value === parent.id}
                    onClick={() => choose(parent.id)}
                    style={{
                      appearance: "none",
                      WebkitAppearance: "none",
                      border: 0,
                      background: "transparent",
                      padding: "3px 0",
                      margin: 0,
                      marginInlineStart: 12,
                      width: "calc(100% - 12px)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "start",
                      font: "inherit",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "1px solid currentColor",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 16px",
                      }}
                    >
                      {value === parent.id && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "currentColor",
                          }}
                        />
                      )}
                    </span>
                    <span>{parent.name}</span>
                  </button>
                )}

                {kids.length > 0 && (
                  <div
                    style={{
                      marginInlineStart: 28,
                      paddingTop: 4,
                      display: "grid",
                      gap: 5,
                    }}
                  >
                    {kids.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        aria-pressed={value === child.id}
                        onClick={() => choose(child.id)}
                        style={{
                          appearance: "none",
                          WebkitAppearance: "none",
                          border: 0,
                          background: "transparent",
                          padding: "3px 0",
                          margin: 0,
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          textAlign: "start",
                          font: "inherit",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: "1px solid currentColor",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 16px",
                          }}
                        >
                          {value === child.id && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "currentColor",
                              }}
                            />
                          )}
                        </span>
                        <span>{child.name}</span>
                      </button>
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
