// 総合振込（全銀フォーマット）の変換・検証ロジックのテスト。
// 外部依存なしで動く純粋ロジックだけを対象にしている。
// 実行: npx tsx scripts/test-transfer.ts

import assert from "node:assert/strict";
import {
  toHalfwidthKana,
  normalizePayeeName,
  findUnsupportedChars,
  abbreviateCorporateName,
} from "../lib/accounting/transfer/kana";
import {
  buildTransferPlan,
  validateRemitter,
  toZenginInput,
  buildTransferFileName,
  type PayeeAccountLike,
  type RemitterLike,
} from "../lib/accounting/transfer/build";
import {
  buildZenginText,
  buildZenginFile,
  encodeZenginSjis,
  validatePayee,
  type ZenginPayee,
  type ZenginFileInput,
} from "../lib/accounting/transfer/zengin";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

console.log("kana:");
check("清音の半角化", () => {
  assert.equal(toHalfwidthKana("アイウエオ"), "ｱｲｳｴｵ");
});
check("濁音は2文字に分解", () => {
  assert.equal(toHalfwidthKana("ガギグゲゴ"), "ｶﾞｷﾞｸﾞｹﾞｺﾞ");
  assert.equal(toHalfwidthKana("ガ").length, 2);
});
check("半濁音は2文字に分解", () => {
  assert.equal(toHalfwidthKana("パピプペポ"), "ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ");
});
check("拗音・促音は大文字へ寄せる", () => {
  assert.equal(toHalfwidthKana("キャノン"), "ｷﾔﾉﾝ");
  assert.equal(toHalfwidthKana("ヨッシー"), "ﾖﾂｼｰ");
});
check("ひらがなもカタカナ経由で半角化", () => {
  assert.equal(toHalfwidthKana("あじま あい"), "ｱｼﾞﾏ ｱｲ");
});
check("全角英数は半角大文字へ", () => {
  assert.equal(toHalfwidthKana("Ｏｐｔｉｍｕｍ１２３"), "OPTIMUM123");
});
check("法人格の略語化（前方）", () => {
  assert.equal(abbreviateCorporateName("株式会社Optimum"), "ｶ)Optimum");
  assert.equal(normalizePayeeName("株式会社Optimum"), "ｶ)OPTIMUM");
});
check("法人格の略語化（後方）", () => {
  assert.equal(normalizePayeeName("アイプロジェクト株式会社"), "ｱｲﾌﾟﾛｼﾞｪｸﾄ(ｶ".replace("ｪ", "ｴ"));
});
check("法人格の略語化（中間）", () => {
  assert.equal(abbreviateCorporateName("ABC株式会社DEF"), "ABC(ｶ)DEF");
});
check("漢字は変換できず検出される", () => {
  const bad = findUnsupportedChars(toHalfwidthKana("安島愛"));
  assert.deepEqual(bad, ["安", "島", "愛"]);
});
check("半角カナ・英大文字・数字は通る", () => {
  assert.deepEqual(findUnsupportedChars("ｶ)OPTIMUM 123.-/"), []);
});

console.log("sjis:");
check("半角カナのバイト値", () => {
  assert.deepEqual([...encodeZenginSjis("ｱ")], [0xb1]);
  assert.deepEqual([...encodeZenginSjis("ｦ")], [0xa6]);
  assert.deepEqual([...encodeZenginSjis("｡")], [0xa1]);
  assert.deepEqual([...encodeZenginSjis("ﾟ")], [0xdf]);
});
check("ASCIIはそのまま", () => {
  assert.deepEqual([...encodeZenginSjis("A0 .")], [0x41, 0x30, 0x20, 0x2e]);
});
check("使えない文字は例外", () => {
  assert.throws(() => encodeZenginSjis("安"), /使えない文字/);
});

console.log("zengin:");
const remitter = {
  consignorCode: "1234567890",
  consignorName: "ｶ)ﾒｽﾄ",
  bankCode: "0310",
  bankName: "ｼﾞｰｴﾑｵｰｱｵｿﾞﾗ",
  branchCode: "101",
  branchName: "ﾎﾝﾃﾝ",
  depositType: "ordinary" as const,
  accountNumber: "1234567",
};
const payees: ZenginPayee[] = [
  {
    bankCode: "0001", bankName: "ﾐｽﾞﾎ", branchCode: "001", branchName: "ﾄｳｷｮｳ".replace("ｮ", "ﾖ"),
    depositType: "ordinary", accountNumber: "1234567",
    payeeName: "ｱｼﾞﾏ ｱｲ", amount: 125820,
  },
  {
    bankCode: "0009", bankName: "ﾐﾂｲｽﾐﾄﾓ", branchCode: "222", branchName: "ｼﾌﾞﾔ",
    depositType: "checking", accountNumber: "7654321",
    payeeName: "ｶ)OPTIMUM", amount: 55000,
  },
];
const input: ZenginFileInput = {
  remitter,
  payees,
  transferDate: new Date(2026, 7, 31), // 2026-08-31
};

check("全レコードがきっかり120バイト", () => {
  const lines = buildZenginText(input).split("\r\n").filter((l) => l !== "");
  assert.equal(lines.length, 5); // ヘッダ + データ2 + トレーラ + エンド
  for (const line of lines) {
    assert.equal(encodeZenginSjis(line).length, 120, "120バイトでない");
  }
});
check("レコード構成はヘッダ/データ×2/トレーラ/エンド", () => {
  const lines = buildZenginText(input).split("\r\n").filter((l) => l !== "");
  assert.equal(lines.length, 5);
  assert.equal(lines[0][0], "1");
  assert.equal(lines[1][0], "2");
  assert.equal(lines[2][0], "2");
  assert.equal(lines[3][0], "8");
  assert.equal(lines[4][0], "9");
  for (const line of lines) {
    assert.equal(encodeZenginSjis(line).length, 120, `120バイトでない: ${line}`);
  }
});
check("ヘッダーの中身", () => {
  const h = buildZenginText(input).split("\r\n")[0];
  assert.equal(h.slice(0, 1), "1");
  assert.equal(h.slice(1, 3), "21");
  assert.equal(h.slice(3, 4), "0");
  assert.equal(h.slice(4, 14), "1234567890");
  assert.equal(h.slice(54, 58), "0831"); // 取組日 MMDD
  assert.equal(h.slice(58, 62), "0310");
});
check("データレコードの金額と口座", () => {
  const d = buildZenginText(input).split("\r\n")[1];
  assert.equal(d.slice(1, 5), "0001");
  assert.equal(d.slice(42, 43), "1"); // 預金種目 普通
  assert.equal(d.slice(43, 50), "1234567");
  assert.equal(d.slice(80, 90), "0000125820");
  assert.equal(d.slice(111, 112), "7"); // 振込指定区分
});
check("当座は預金種目2", () => {
  const d = buildZenginText(input).split("\r\n")[2];
  assert.equal(d.slice(42, 43), "2");
});
check("トレーラの件数と合計が一致", () => {
  const t = buildZenginText(input).split("\r\n")[3];
  assert.equal(t.slice(1, 7), "000002");
  assert.equal(t.slice(7, 19), "000000180820"); // 125820 + 55000
});
check("ファイル全体のバイト数 = 5レコード×(120+2)", () => {
  const bytes = buildZenginFile(input);
  assert.equal(bytes.length, 5 * 122);
});
check("振込先ゼロ件は例外", () => {
  assert.throws(() => buildZenginText({ ...input, payees: [] }), /1件もありません/);
});
check("金額0は例外", () => {
  assert.throws(
    () => buildZenginText({ ...input, payees: [{ ...payees[0], amount: 0 }] }),
    /振込金額が不正/,
  );
});

console.log("validatePayee:");
check("正常な振込先はエラーなし", () => {
  assert.deepEqual(validatePayee(payees[0]), []);
});
check("桁数の誤りを検出", () => {
  const errs = validatePayee({ ...payees[0], bankCode: "13", branchCode: "1", accountNumber: "12345678" });
  assert.equal(errs.length, 3);
});
check("受取人名の漢字を検出", () => {
  const errs = validatePayee({ ...payees[0], payeeName: "安島愛" });
  assert.ok(errs.some((e) => e.includes("使えない文字")));
});
check("受取人名30文字超を検出", () => {
  const errs = validatePayee({ ...payees[0], payeeName: "ｱ".repeat(31) });
  assert.ok(errs.some((e) => e.includes("30文字")));
});

console.log("build:");

const acct = (over: Partial<PayeeAccountLike> = {}): PayeeAccountLike => ({
  id: "a1", contractorName: "安島愛",
  bankCode: "0001", bankNameKana: "ﾐｽﾞﾎ",
  branchCode: "001", branchNameKana: "ﾄｳｷﾖｳ",
  depositType: "ordinary", accountNumber: "1234567",
  payeeNameKana: "ｱｼﾞﾏ ｱｲ", isActive: true, ...over,
});
const goodRemitter: RemitterLike = {
  consignorCode: "1234567890", consignorNameKana: "ｶ)ﾒｽﾄ",
  transferBankCode: "0310", transferBankNameKana: "ｼﾞｰｴﾑｵｰ",
  transferBranchCode: "101", transferBranchNameKana: "ﾎﾝﾃﾝ",
  transferDepositType: "ordinary", transferAccountNumber: "1234567",
};

check("外注先名が違えば引き当てない", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "別名", amountInclTax: 125820 }],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.ready.length, 0);
  assert.deepEqual(plan.blocked[0].errors, ["振込先口座が未登録です"]);
});
check("前後の空白は無視して引き当てる", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "  安島愛 ", amountInclTax: 125820 }],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.ready.length, 1);
  assert.equal(plan.totalAmount, 125820);
});
check("外注先名で引き当てる", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "安島愛", amountInclTax: 1000 }],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.ready.length, 1);
});
check("口座未登録は理由付きでblockedへ", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "知らない人", amountInclTax: 1000 }],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.ready.length, 0);
  assert.equal(plan.blocked.length, 1);
  assert.deepEqual(plan.blocked[0].errors, ["振込先口座が未登録です"]);
});
check("無効化された口座は振込まない", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "安島愛", amountInclTax: 1000 }],
    accounts: [acct({ isActive: false })],
    remitter: goodRemitter,
  });
  assert.deepEqual(plan.blocked[0].errors, ["振込先口座が無効化されています"]);
});
check("金額0の行はそもそも対象外", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "安島愛", amountInclTax: 0 }],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.lines.length, 0);
  assert.equal(plan.totalAmount, 0);
});
check("合計はready分のみ", () => {
  const plan = buildTransferPlan({
    outsourcing: [
      { id: "o1", contractorName: "安島愛", amountInclTax: 125820 },
      { id: "o2", contractorName: "知らない人", amountInclTax: 99999 },
    ],
    accounts: [acct()],
    remitter: goodRemitter,
  });
  assert.equal(plan.totalAmount, 125820);
});
check("委託者未設定を検出", () => {
  assert.ok(validateRemitter(null).length > 0);
  const errs = validateRemitter({ ...goodRemitter, consignorCode: null, transferBankCode: "12" });
  assert.ok(errs.some((e) => e.includes("委託者コード")));
  assert.ok(errs.some((e) => e.includes("金融機関コード")));
});
check("委託者が揃っていればエラーなし", () => {
  assert.deepEqual(validateRemitter(goodRemitter), []);
});
check("toZenginInput は委託者不足で例外", () => {
  const plan = buildTransferPlan({
    outsourcing: [{ id: "o1", contractorName: "安島愛", amountInclTax: 1000 }],
    accounts: [acct()],
    remitter: null,
  });
  assert.throws(() => toZenginInput(plan, goodRemitter, new Date(2026, 7, 31)), /振込元の設定/);
});
check("toZenginInput は対象0件で例外", () => {
  const plan = buildTransferPlan({ outsourcing: [], accounts: [], remitter: goodRemitter });
  assert.throws(() => toZenginInput(plan, goodRemitter, new Date(2026, 7, 31)), /振込可能な明細がありません/);
});
check("プランから全銀ファイルまで通る", () => {
  const plan = buildTransferPlan({
    outsourcing: [
      { id: "o1", contractorName: "安島愛", amountInclTax: 125820 },
      { id: "o2", contractorName: "株式会社Optimum", amountInclTax: 55000 },
    ],
    accounts: [acct(), acct({ id: "a2", contractorName: "株式会社Optimum", payeeNameKana: "ｶ)OPTIMUM", accountNumber: "7654321" })],
    remitter: goodRemitter,
  });
  assert.equal(plan.ready.length, 2);
  const zengin = toZenginInput(plan, goodRemitter, new Date(2026, 7, 31));
  const bytes = buildZenginFile(zengin);
  assert.equal(bytes.length, 5 * 122);
  const trailer = buildZenginText(zengin).split("\r\n")[3];
  assert.equal(trailer.slice(1, 7), "000002");
  assert.equal(trailer.slice(7, 19), "000000180820");
});
check("ファイル名", () => {
  assert.equal(buildTransferFileName("2026-07", new Date(2026, 7, 31)), "総合振込_2026-07_20260831.txt");
});

console.log(`\n${passed} checks passed`);

