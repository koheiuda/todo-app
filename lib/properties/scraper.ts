import * as cheerio from "cheerio";
import { BUILDINGS, FILTER, type Building } from "./buildings";

export type Unit = {
  buildingId: number;
  buildingName: string;
  buildingUrl: string;
  detailUrl: string;
  floor: number;
  rent: number;
  managementFee: number | null;
  layout: string;
  sizeSqm: number;
  thumbnailUrl: string | null;
};

export type BuildingResult = {
  building: Building;
  units: Unit[];
  fetchedAt: string;
  error?: string;
  debug?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ORIGIN = "https://www.m-standard.co.jp";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

function toAbs(href: string | undefined): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${ORIGIN}${href}`;
}

function parseYen(text: string): number | null {
  const m = text.replace(/,/g, "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

export async function fetchBuilding(building: Building): Promise<BuildingResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(building.url, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 400);
      } catch {}
      const debug = `headers=${JSON.stringify(Object.fromEntries(res.headers))} body=${body}`;
      return { building, units: [], fetchedAt, error: `HTTP ${res.status}`, debug };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const units: Unit[] = [];
    // Only scrape rows under tbody[data-sortable-roomlist-name="publishable-rooms"]
    $('tbody[data-sortable-roomlist-name="publishable-rooms"] > tr').each((_, el) => {
      const $tr = $(el);
      const dataHref = $tr.attr("data-href");
      const dataPrice = $tr.attr("data-price");
      const dataFloor = $tr.attr("data-floor");
      const dataSize = $tr.attr("data-size");
      if (!dataPrice || !dataFloor) return;

      const rent = Number(dataPrice);
      const floor = Number(dataFloor);
      const sizeSqm = dataSize ? Number(dataSize) : 0;

      const tds = $tr.find("> td");
      const mgmtText = tds.eq(3).text();
      const managementFee = parseYen(mgmtText);

      const layoutTd = tds.eq(5);
      const layoutParts: string[] = [];
      layoutTd.find("span").each((_i, s) => {
        const t = $(s).text().trim();
        if (t && !/㎡/.test(t)) layoutParts.push(t);
      });
      const layout = layoutParts.join("");

      const thumb = $tr.find("img").attr("data-src") || $tr.find("img").attr("src") || null;

      units.push({
        buildingId: building.id,
        buildingName: building.name,
        buildingUrl: building.url,
        detailUrl: toAbs(dataHref),
        floor,
        rent,
        managementFee,
        layout,
        sizeSqm,
        thumbnailUrl: thumb,
      });
    });

    return { building, units, fetchedAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { building, units: [], fetchedAt, error: msg };
  }
}

export async function fetchAll(): Promise<BuildingResult[]> {
  return Promise.all(BUILDINGS.map(fetchBuilding));
}

export function filterUnits(units: Unit[]): Unit[] {
  return units.filter(
    (u) => u.floor >= FILTER.minFloor && u.rent >= FILTER.minRent && u.rent <= FILTER.maxRent,
  );
}
