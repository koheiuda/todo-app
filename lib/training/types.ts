/** トレをしたかのステータス */
export type TrainedStatus =
  | "" // 未選択
  | "as_planned" // 予定通りやった
  | "off_plan" // 予定外だがやった
  | "done" // した（予定の概念なし）
  | "rest"; // 休んだ

export const TRAINED_LABELS: Record<Exclude<TrainedStatus, "">, string> = {
  as_planned: "予定通りやった",
  off_plan: "予定外にやった",
  done: "した",
  rest: "休んだ",
};

/** その日の報告（送信前の下書きと共通の入力部分） */
export interface ReportInput {
  /** YYYY-MM-DD */
  date: string;
  /** 今日の体重(kg)。未入力は null */
  weightKg: number | null;
  /** 睡眠時間(h)。未入力は null */
  sleepHours: number | null;
  trained: TrainedStatus;
  /** やった内容（種目・重量・回数・主観的なキツさ） */
  workout: string;
  /** 食事はプラン通りだったか（自由記述 or 5段階の所感） */
  diet: string;
  /** 体調・関節の痛み・仕事の疲労 */
  condition: string;
  /** 自由メモ */
  memo: string;
}

/** 保存済みの報告（AIフィードバック付き） */
export interface DailyReport extends ReportInput {
  id: string;
  /** AIフィードバック本文 */
  feedback: string;
  /** 応答したモデル名 */
  model: string;
  /** 保存時刻 ISO */
  createdAt: string;
}

export function emptyDraft(date: string): ReportInput {
  return {
    date,
    weightKg: null,
    sleepHours: null,
    trained: "",
    workout: "",
    diet: "",
    condition: "",
    memo: "",
  };
}
