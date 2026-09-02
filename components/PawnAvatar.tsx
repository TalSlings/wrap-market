"use client";

export const PAWN_AVATARS = [
  { key: "pawn-01", background: "#F3D900", pawn: "#FFF5A6", label: "צהוב" },
  { key: "pawn-02", background: "#F47A18", pawn: "#FFD8B6", label: "כתום" },
  { key: "pawn-03", background: "#F05243", pawn: "#FFD0CB", label: "קורל" },
  { key: "pawn-04", background: "#E95391", pawn: "#FFD3E4", label: "ורוד" },
  { key: "pawn-05", background: "#B733A7", pawn: "#F3C9EC", label: "מג׳נטה" },
  { key: "pawn-06", background: "#713BC1", pawn: "#DFD0F6", label: "סגול" },
  { key: "pawn-07", background: "#2257D7", pawn: "#CAD8FF", label: "כחול" },
  { key: "pawn-08", background: "#168EC9", pawn: "#C9EBFA", label: "תכלת" },
  { key: "pawn-09", background: "#08AFA7", pawn: "#C3F0EC", label: "טורקיז" },
  { key: "pawn-10", background: "#16A864", pawn: "#C7EFD7", label: "ירוק" },
  { key: "pawn-11", background: "#78B92B", pawn: "#DEF0BB", label: "ירוק בהיר" },
  { key: "pawn-12", background: "#C9C516", pawn: "#F1EFAF", label: "ליים" },
] as const;

export type PawnAvatarKey = (typeof PAWN_AVATARS)[number]["key"];

export function normalizePawnAvatar(value: unknown): PawnAvatarKey {
  return PAWN_AVATARS.some((avatar) => avatar.key === value)
    ? (value as PawnAvatarKey)
    : "pawn-01";
}

export function pawnAvatarForSeed(seed: string): PawnAvatarKey {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return PAWN_AVATARS[Math.abs(hash >>> 0) % PAWN_AVATARS.length].key;
}

export function PawnAvatar({
  avatarKey,
  size = 88,
  decorative = false,
}: {
  avatarKey: string;
  size?: number;
  decorative?: boolean;
}) {
  const avatar =
    PAWN_AVATARS.find((item) => item.key === avatarKey) || PAWN_AVATARS[0];

  return (
    <svg
      className="pawn-avatar"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `פיון ${avatar.label}`}
    >
      <circle cx="50" cy="50" r="49" fill={avatar.background} />
      <circle cx="50" cy="32" r="13" fill={avatar.pawn} />
      <path
        d="M38 47h24c0 10-3 17-8 21l15 15H31l15-15c-5-4-8-11-8-21Z"
        fill={avatar.pawn}
      />
    </svg>
  );
}

export function PawnAvatarPicker({
  value,
  onChange,
}: {
  value: PawnAvatarKey;
  onChange: (value: PawnAvatarKey) => void;
}) {
  return (
    <fieldset className="pawn-picker">
      <legend>בחירת תמונת פרופיל</legend>
      <div className="pawn-picker-grid">
        {PAWN_AVATARS.map((avatar) => (
          <label
            className={`pawn-choice${value === avatar.key ? " selected" : ""}`}
            key={avatar.key}
            title={avatar.label}
          >
            <input
              type="radio"
              name="pawn-avatar"
              value={avatar.key}
              checked={value === avatar.key}
              onChange={() => onChange(avatar.key)}
            />
            <PawnAvatar avatarKey={avatar.key} size={54} decorative />
            <span className="sr-only">{avatar.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
