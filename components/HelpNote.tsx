import type { ReactNode } from "react";

export default function HelpNote({ content, label = "הסבר נוסף" }: { content?: ReactNode; label?: string }) {
  if (content == null || content === false || (typeof content === "string" && !content.trim())) return null;
  return (
    <details className="help-note">
      <summary aria-label={label} title={label}>ⓘ</summary>
      <div className="help-note-content">{content}</div>
    </details>
  );
}

