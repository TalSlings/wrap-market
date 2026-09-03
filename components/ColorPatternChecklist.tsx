import ColorPatternHelp from "@/components/ColorPatternGuide";
import {
  COLOR_PATTERNS,
  COLOR_PATTERN_DESCRIPTIONS,
} from "@/lib/constants";

export default function ColorPatternChecklist({ selectedIds, onChange, intro }: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  intro?: string | false;
}) {
  const selected = new Set(selectedIds);

  const toggle = (id: string) => {
    onChange(
      selected.has(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <fieldset className="field color-pattern-filter">
      <legend>
        תכונות צבע
        <ColorPatternHelp intro={intro} />
      </legend>
      <div className="color-pattern-options">
        {COLOR_PATTERNS.map(([id, label]) => (
          <label key={id} className="color-pattern-option">
            <input
              type="checkbox"
              checked={selected.has(id)}
              onChange={() => toggle(id)}
            />
            <span>
              <b>{label}</b>
              <small>{COLOR_PATTERN_DESCRIPTIONS[id]}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
