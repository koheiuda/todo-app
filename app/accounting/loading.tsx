// 会計セグメント共通のローディングスケルトン。
// クリック直後にサイドバーはそのまま、本文エリアに即座に表示される。
export default function AccountingLoading() {
  return (
    <div className="max-w-6xl animate-pulse" aria-busy="true" aria-label="読み込み中">
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="h-6 w-40 bg-neutral-200 rounded" />
        <div className="mt-2 h-4 w-64 bg-neutral-100 rounded" />
      </div>

      {/* KPI カード行 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <div className="h-3 w-16 bg-neutral-100 rounded" />
            <div className="mt-3 h-7 w-24 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>

      {/* グラフ / テーブル領域 */}
      <div className="space-y-4">
        <div className="h-[280px] bg-white rounded-xl border border-neutral-200" />
        <div className="h-48 bg-white rounded-xl border border-neutral-200" />
      </div>
    </div>
  );
}
