import ColorPatternHelp from "@/components/ColorPatternGuide";
import {
  COLOR_PATTERNS,
  COLOR_PATTERN_DESCRIPTIONS,
} from "@/lib/constants";

export default function ColorPatternChecklist({ selectedIds, onChange }: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
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
      <legend>תכונות צבע</legend>
      <div className="color-pattern-options">
        {COLOR_PATTERNS.map(([id, label]) => (
          <div key={id} className="color-pattern-option-row">
            <label className="color-pattern-option">
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
            <ColorPatternHelp patternId={id} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
