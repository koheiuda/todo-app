/**
 * 全銀協フォーマット（総合振込）で使える文字への正規化。
 *
 * 全銀の受取人名欄は「半角英大文字・半角数字・半角カナ・一部記号」しか通らない。
 * ひらがな/全角カナ/全角英数を半角カナへ落とし、拗音・促音は全銀ルールに従って
 * 大文字へ寄せる。濁点・半濁点は独立した1文字（ﾞ ﾟ）に分解する＝桁数を食う点に注意。
 */

// 清音（濁点なし）の全角カナ → 半角カナ。
const SEION_FULL = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
const SEION_HALF = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ";

// 濁音は「清音の半角 + ﾞ」の2文字に分解される。
const DAKUON_FULL = "ガギグゲゴザジズゼゾダヂヅデドバビブベボヴ";
const DAKUON_BASE = "ｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾊﾋﾌﾍﾎｳ";

// 半濁音は「清音の半角 + ﾟ」の2文字。
const HANDAKUON_FULL = "パピプペポ";
const HANDAKUON_BASE = "ﾊﾋﾌﾍﾎ";

// 全銀では拗音・促音の小書きは使えないため大文字へ寄せる（ｷｬ→ｷﾔ, ｼｮ→ｼﾖ, ｯ→ﾂ）。
const SMALL_FULL = "ァィゥェォッャュョヮヵヶ";
const SMALL_LARGE = "ｱｲｳｴｵﾂﾔﾕﾖﾜｶｹ";

// 記号類。全角スペースは半角スペースへ。
const SYMBOL_MAP: Record<string, string> = {
  "ー": "ｰ", "―": "-", "‐": "-", "－": "-", "−": "-", "ｰ": "ｰ",
  "、": "､", "。": "｡", "「": "｢", "」": "｣", "・": "･",
  "゛": "ﾞ", "゜": "ﾟ", "　": " ",
  "／": "/", "（": "(", "）": ")", "．": ".", "，": ",",
  "’": "", "‘": "", "”": "", "“": "",
};

function buildMap(from: string, to: string, suffix = ""): Record<string, string> {
  const map: Record<string, string> = {};
  const fromChars = Array.from(from);
  const toChars = Array.from(to);
  if (fromChars.length !== toChars.length) {
    throw new Error(
      `kana table length mismatch: ${fromChars.length} vs ${toChars.length}`,
    );
  }
  for (let i = 0; i < fromChars.length; i++) {
    map[fromChars[i]] = toChars[i] + suffix;
  }
  return map;
}

const KANA_MAP: Record<string, string> = {
  ...buildMap(SEION_FULL, SEION_HALF),
  ...buildMap(DAKUON_FULL, DAKUON_BASE, "ﾞ"),
  ...buildMap(HANDAKUON_FULL, HANDAKUON_BASE, "ﾟ"),
  ...buildMap(SMALL_FULL, SMALL_LARGE),
  ...SYMBOL_MAP,
};

/** ひらがな1文字をカタカナへ。対象外の文字はそのまま返す。 */
function hiraganaToKatakana(ch: string): string {
  const code = ch.codePointAt(0);
  if (code === undefined) return ch;
  // ぁ(U+3041)〜ゖ(U+3096) はカタカナへ +0x60 でそろう。
  if (code >= 0x3041 && code <= 0x3096) {
    return String.fromCodePoint(code + 0x60);
  }
  return ch;
}

/** 全角英数字1文字を半角へ。対象外の文字はそのまま返す。 */
function fullwidthAlnumToHalf(ch: string): string {
  const code = ch.codePointAt(0);
  if (code === undefined) return ch;
  // ！(U+FF01)〜～(U+FF5E) は ASCII へ -0xFEE0 でそろう。
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCodePoint(code - 0xfee0);
  }
  return ch;
}

/**
 * 任意の文字列を全銀の受取人名で使える半角文字列へ変換する。
 * 変換できない文字（漢字など）はそのまま残るので、必ず assertZenginSafe で弾くこと。
 */
export function toHalfwidthKana(input: string): string {
  let out = "";
  for (const raw of Array.from(input.normalize("NFKC"))) {
    const ch = hiraganaToKatakana(raw);
    const mapped = KANA_MAP[ch];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const half = fullwidthAlnumToHalf(ch);
    out += half.toUpperCase();
  }
  return out;
}

/** 全銀で受取人名に使える文字かどうか。 */
export function isZenginNameChar(ch: string): boolean {
  if (ch >= "A" && ch <= "Z") return true;
  if (ch >= "0" && ch <= "9") return true;
  if (" .-()/,".includes(ch)) return true;
  const code = ch.codePointAt(0) ?? 0;
  // 半角カナ ｡(U+FF61) 〜 ﾟ(U+FF9F)
  return code >= 0xff61 && code <= 0xff9f;
}

/** 全銀に通らない文字を列挙する（空配列なら安全）。 */
export function findUnsupportedChars(value: string): string[] {
  const bad = new Set<string>();
  for (const ch of Array.from(value)) {
    if (!isZenginNameChar(ch)) bad.add(ch);
  }
  return [...bad];
}

/**
 * 法人格を全銀の標準略語へ置き換える。
 * 例: 「株式会社Optimum」→「ｶ)OPTIMUM」、「Optimum株式会社」→「OPTIMUM(ｶ」
 */
const CORP_ABBREV: Array<[string, string]> = [
  ["特定非営利活動法人", "ﾄｸﾋ"],
  ["一般社団法人", "ｼﾔ"],
  ["一般財団法人", "ｻﾞｲ"],
  ["公益社団法人", "ｼﾔ"],
  ["公益財団法人", "ｻﾞｲ"],
  ["社会福祉法人", "ﾌｸ"],
  ["医療法人社団", "ｲ"],
  ["医療法人", "ｲ"],
  ["学校法人", "ｶﾞｸ"],
  ["宗教法人", "ｼｭｳ"],
  ["社団法人", "ｼﾔ"],
  ["財団法人", "ｻﾞｲ"],
  ["株式会社", "ｶ"],
  ["有限会社", "ﾕ"],
  ["合同会社", "ﾄﾞ"],
  ["合資会社", "ｼ"],
  ["合名会社", "ﾒ"],
];

export function abbreviateCorporateName(input: string): string {
  let value = input.trim();
  for (const [word, abbrev] of CORP_ABBREV) {
    if (!value.includes(word)) continue;
    if (value.startsWith(word)) {
      value = `${abbrev})${value.slice(word.length)}`;
    } else if (value.endsWith(word)) {
      value = `${value.slice(0, -word.length)}(${abbrev}`;
    } else {
      value = value.replace(word, `(${abbrev})`);
    }
    break;
  }
  return value;
}

/**
 * 受取人名を全銀フォーマット用に正規化する。
 * 法人格の略語化 → 半角カナ化 → 連続スペースの圧縮、の順に適用する。
 */
export function normalizePayeeName(input: string): string {
  const abbreviated = abbreviateCorporateName(input);
  return toHalfwidthKana(abbreviated).replace(/\s+/g, " ").trim();
}
