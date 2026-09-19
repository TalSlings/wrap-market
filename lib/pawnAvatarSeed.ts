const PAWN_AVATAR_KEYS = [
  "pawn-01", "pawn-02", "pawn-03", "pawn-04", "pawn-05", "pawn-06",
  "pawn-07", "pawn-08", "pawn-09", "pawn-10", "pawn-11", "pawn-12",
] as const;

export function pawnAvatarForSeed(seed: string) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return PAWN_AVATAR_KEYS[(hash >>> 0) % PAWN_AVATAR_KEYS.length];
}
