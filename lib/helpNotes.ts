export type HelpNoteRow = {
  section_key: string;
  placement: "form" | "search" | "listing";
  content?: string | null;
  is_visible?: boolean | null;
};

export function helpText(
  rows: HelpNoteRow[] | undefined,
  sectionKey: string,
  placement: HelpNoteRow["placement"],
  fallback: string
): string | false {
  const row = rows?.find(
    (item) => item.section_key === sectionKey && item.placement === placement
  );

  if (!row) return fallback;
  if (!row.is_visible || !row.content?.trim()) return false;
  return row.content.trim();
}
