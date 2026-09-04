export function listingDailyHash(value: string) {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function sortListingsByDailyDefault<T extends { id: string; status?: string }>(
  listings: T[],
  date = new Date().toISOString().slice(0, 10)
) {
  return [...listings]
    .sort(
      (a, b) =>
        listingDailyHash(a.id + date) - listingDailyHash(b.id + date)
    )
    .sort(
      (a, b) =>
        Number(a.status === "incomplete") -
        Number(b.status === "incomplete")
    );
}
