export type ImportedWrapMaterial = {
  sourceName: string;
  percentage: number;
};

export type ImportedWrapData = {
  manufacturer?: string;
  design?: string;
  model?: string;
  gsm?: number;
  materials?: ImportedWrapMaterial[];
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(html: string) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[\u00a0\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).replace(/\s+/g, " ").trim();
  }
  return "";
}

function extractIdentity(html: string, text: string) {
  const candidates = [
    firstMatch(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ]),
    text,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = candidate
      .replace(/\s*[|–—-]\s*Wraptrack.*$/i, "")
      .replace(/^Wraptrack\s*/i, "")
      .trim();

    const separatorMatch = normalized.match(
      /([^▪•\n]{1,100})\s*[▪•]\s*([^▪•\n]{1,120})(?:\s*[▪•]\s*([^▪•\n]{1,160}))?/
    );

    if (separatorMatch) {
      return {
        manufacturer: separatorMatch[1].trim(),
        design: separatorMatch[2].trim(),
        model: separatorMatch[3]?.trim() || undefined,
      };
    }
  }

  return {};
}

function extractGsm(text: string) {
  const match = text.match(/\b(\d{2,3})\s*gsm\b/i);
  if (!match) return undefined;

  const gsm = Number(match[1]);
  return Number.isFinite(gsm) && gsm >= 80 && gsm <= 800 ? gsm : undefined;
}

function extractMaterials(text: string): ImportedWrapMaterial[] {
  // On WrapTrack the composition is rendered immediately after the GSM value,
  // for example: "274 gsm 60% ... cotton, 23% Cotton, 17% Tencel".
  // Staying close to that marker avoids importing unrelated percentages.
  const afterGsm = text.match(/\b\d{2,3}\s*gsm\b\s+([\s\S]{0,500})/i)?.[1];
  if (!afterGsm) return [];

  const materials: ImportedWrapMaterial[] = [];
  const parts = afterGsm.split(/\s*,\s*/);

  for (const part of parts) {
    const match = part.match(/^\s*(\d{1,3}(?:\.\d+)?)%\s+(.+?)\s*$/i);
    if (!match) break;

    const percentage = Number(match[1]);
    const sourceName = match[2]
      .replace(/\s+/g, " ")
      .replace(/\s+(?:regular release|draw release|semi-custom|release|\d{4}-\d{2}-\d{2}).*$/i, "")
      .trim();

    if (
      !Number.isFinite(percentage) ||
      percentage <= 0 ||
      percentage > 100 ||
      sourceName.length < 2 ||
      sourceName.length > 80
    ) {
      break;
    }

    materials.push({ sourceName, percentage });

    const total = materials.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(total - 100) < 0.01) return materials;
    if (total > 100) return [];
  }

  // Only import a composition when it is internally complete. If WrapTrack's
  // page structure is different, leave materials for manual entry instead.
  return [];
}

export function parseWrapTrackHtml(html: string): ImportedWrapData {
  const text = stripHtml(html);
  const identity = extractIdentity(html, text);
  const gsm = extractGsm(text);
  const materials = extractMaterials(text);

  return {
    ...identity,
    ...(gsm ? { gsm } : {}),
    ...(materials.length ? { materials } : {}),
  };
}

export function isAllowedWrapTrackUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "wraptrack.org" || host === "www.wraptrack.org") &&
      /^\/catalog\/model\/\d+\/?$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}
