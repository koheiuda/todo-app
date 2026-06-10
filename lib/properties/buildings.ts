export type Building = {
  id: number;
  name: string;
  url: string;
};

// m-standard.co.jp の対象物件。出力はこの4物件のみに絞る。
export const BUILDINGS: Building[] = [
  { id: 11729, name: "ブリリアタワーズ目黒 サウスレジデンス", url: "https://www.m-standard.co.jp/buildings/11729/rent/" },
  { id: 8660, name: "パークコート渋谷ザ・タワー", url: "https://www.m-standard.co.jp/buildings/8660/rent/" },
  { id: 4075, name: "富久クロスコンフォートタワー", url: "https://www.m-standard.co.jp/buildings/4075/rent/" },
  { id: 16999, name: "麻布台ヒルズレジデンス B", url: "https://www.m-standard.co.jp/buildings/16999/rent/" },
];

export const FILTER = {
  minFloor: 15,
  minRent: 150_000,
  maxRent: 500_000,
} as const;
