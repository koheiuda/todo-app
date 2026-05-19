export type Persona = {
  id: "owner" | "marketer" | "operator" | "strategist";
  name: string;
  description: string;
  targetAudience: string;
  tone: string;
};

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "owner",
    name: "経営者視点",
    description:
      "売上・採用・競争優位など、経営判断に直結するインパクトを軸に語る。短期と中長期の損益感を意識し、経営者の言葉でリスクとリターンを語る。",
    targetAudience: "中小企業経営者",
    tone: "断定的・行動喚起型",
  },
  {
    id: "marketer",
    name: "マーケター視点",
    description:
      "戦略・施策・効果検証の文脈で語る。数値や指標、KPIの動かし方に踏み込み、明日からの打ち手を提示する。",
    targetAudience: "マーケティング担当者",
    tone: "データ重視・実務的",
  },
  {
    id: "operator",
    name: "実務者視点",
    description:
      "具体的なTipsと運用ハックを軸にする。ツール・手順・チェックリスト的な切り口で、現場の手触りを残す。",
    targetAudience: "SEO担当・Web担当",
    tone: "カジュアル・実践的",
  },
  {
    id: "strategist",
    name: "大局視点",
    description:
      "業界トレンドと未来予測。今起きていることが3〜5年でどこに着地するのか、構造変化を捉える視点で語る。",
    targetAudience: "経営企画・コンサル",
    tone: "俯瞰的・洞察的",
  },
];

export const POSTER_PROFILE = `宇田晃平（StockSun・SEO/WEBマーケ専門家）`;
