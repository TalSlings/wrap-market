export type SiteSection = "market" | "educators" | "general";

type SearchParamsReader = {
  get(name: string): string | null;
};

const MARKET_ACCOUNT_TABS = new Set([
  "listings",
  "deleted",
  "favorites",
  "searches",
]);

function startsWithRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function getSiteSection(
  pathname: string,
  searchParams?: SearchParamsReader | null
): SiteSection {
  if (startsWithRoute(pathname, "/educators")) return "educators";

  if (
    startsWithRoute(pathname, "/market") ||
    startsWithRoute(pathname, "/listing") ||
    startsWithRoute(pathname, "/seller") ||
    startsWithRoute(pathname, "/new") ||
    pathname === "/faq" ||
    pathname === "/safety" ||
    pathname === "/suspended"
  ) {
    return "market";
  }

  if (pathname === "/account") {
    return MARKET_ACCOUNT_TABS.has(searchParams?.get("tab") || "")
      ? "market"
      : "general";
  }

  if (pathname === "/login") {
    const next = searchParams?.get("next") || "";
    if (
      next.startsWith("/market") ||
      next.startsWith("/listing") ||
      next.startsWith("/seller") ||
      next.startsWith("/new") ||
      next.includes("tab=listings") ||
      next.includes("tab=deleted") ||
      next.includes("tab=favorites") ||
      next.includes("tab=searches")
    ) {
      return "market";
    }
  }

  return "general";
}
