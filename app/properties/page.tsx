import { fetchAll, filterUnits, type Unit } from "@/lib/properties/scraper";
import { FILTER } from "@/lib/properties/buildings";

export const metadata = { title: "物件 | 高層階・指定家賃帯ウォッチャー" };

export const dynamic = "force-dynamic";

function formatYen(n: number): string {
  return n.toLocaleString("ja-JP") + "円";
}

function formatJst(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
}

export default async function PropertiesPage() {
  const results = await fetchAll();

  const totalUnits = results.reduce((sum, r) => sum + r.units.length, 0);
  const totalMatched = results.reduce((sum, r) => sum + filterUnits(r.units).length, 0);
  const lastUpdated = results.reduce(
    (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
    results[0]?.fetchedAt ?? new Date().toISOString(),
  );

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          高層階・指定家賃帯ウォッチャー
        </h1>
        <p className="text-sm text-gray-500">
          対象{results.length}物件のうち、
          <strong className="text-gray-700">
            {FILTER.minFloor}階以上 / 月額{FILTER.minRent / 10000}〜{FILTER.maxRent / 10000}万円
          </strong>
          の部屋をピックアップします。
        </p>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            マッチ{" "}
            <span className="font-bold text-[#2d4fd4]">{totalMatched}</span> 件 / 全募集{" "}
            {totalUnits} 件
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            最終取得: {formatJst(lastUpdated)} JST
          </span>
        </div>
      </div>

      {results.map((r) => {
        const matched = filterUnits(r.units);
        return (
          <section
            key={r.building.id}
            className="bg-white rounded-xl shadow-sm p-5 mb-4"
          >
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              {r.building.name}
              {matched.length > 0 && (
                <span className="inline-block text-[11px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                  {matched.length}件マッチ
                </span>
              )}
            </h2>
            <div className="text-xs text-gray-500 mt-1 mb-3">
              <a
                href={r.building.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 break-all"
              >
                {r.building.url}
              </a>
              {r.units.length > 0 && (
                <> ・ 募集中 {r.units.length} 件（うち条件一致 {matched.length} 件）</>
              )}
            </div>

            {r.error ? (
              <div className="text-sm text-red-600 py-2">取得エラー: {r.error}</div>
            ) : matched.length === 0 ? (
              <div className="text-sm text-gray-400 py-2">
                {r.units.length === 0
                  ? "現在募集中の部屋はありません。"
                  : "条件に該当する部屋はありません。"}
              </div>
            ) : (
              <UnitCards units={matched} />
            )}
          </section>
        );
      })}

      <p className="text-xs text-gray-400 text-center mt-6">
        Data: m-standard.co.jp ・ 公開されている情報のみ取得。最終的な賃料・空室状況は各物件ページでご確認ください。
      </p>
    </div>
  );
}

function UnitCards({ units }: { units: Unit[] }) {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
      {units.map((u) => (
        <a
          key={u.detailUrl}
          href={u.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
            {u.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={u.thumbnailUrl}
                alt={`${u.floor}階 ${u.layout}`}
                loading="lazy"
                className="w-full h-full object-contain bg-white"
              />
            ) : (
              <span className="text-xs text-gray-400">No image</span>
            )}
          </div>
          <div className="p-3.5">
            <div className="text-lg font-bold text-[#2d4fd4] mb-1.5">
              {formatYen(u.rent)}
            </div>
            <div className="flex flex-wrap gap-2 text-[13px] text-gray-700 mb-1">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{u.floor}階</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{u.layout}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{u.sizeSqm}㎡</span>
            </div>
            <div className="text-xs text-gray-500">
              管理費 {u.managementFee !== null ? formatYen(u.managementFee) : "-"}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
