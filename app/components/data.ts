export interface GoalCategory {
  id: string;
  label: string;
  desc: string;
  iconKey: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface RuleQuestion extends Question {
  name: string;
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  { id: "fix", label: "修正系", desc: "バグ修正・改善・一部変更", iconKey: "fix" },
  { id: "design", label: "設計系", desc: "仕様策定・企画・設計", iconKey: "design" },
  { id: "create", label: "制作系", desc: "コード・デザイン・コンテンツ制作", iconKey: "create" },
  { id: "analyze", label: "分析系", desc: "レビュー・評価・比較", iconKey: "analyze" },
];

export const CAT_QS: Record<string, Question[]> = {
  fix: [
    { id: "fix_scope", text: "修正の範囲は？", options: ["一部分だけ変えたい", "全体的に改善したい", "バグ・エラーを直したい", "パフォーマンスを上げたい"] },
    { id: "fix_urgency", text: "緊急度は？", options: ["今すぐ直したい", "近いうちに", "じっくり改善したい"] },
    { id: "fix_state", text: "今の状態は？", options: ["動くけど質が低い", "エラーで動かない", "動くけど意図と違う", "よくわからない"] },
  ],
  design: [
    { id: "des_target", text: "誰向け？", options: ["自分用", "チーム・社内向け", "クライアント向け", "一般ユーザー向け"] },
    { id: "des_scale", text: "規模感は？", options: ["小さい機能・モジュール", "中規模（1画面〜数画面）", "大規模システム", "まだ決まっていない"] },
    { id: "des_priority", text: "最も重視するのは？", options: ["実装スピード", "品質・完成度", "拡張性・保守性", "ユーザー体験"] },
  ],
  create: [
    { id: "cre_type", text: "何を作る？", options: ["Webサイト・アプリ", "文章・コンテンツ", "デザイン・UI", "コード・スクリプト", "企画書・資料"] },
    { id: "cre_tone", text: "トーンは？", options: ["プロフェッショナル", "カジュアル・親しみやすい", "クリエイティブ・遊び心", "技術的・正確"] },
    { id: "cre_ref", text: "参考やイメージはある？", options: ["はい、明確にある", "なんとなくある", "お任せしたい", "まだない"] },
  ],
  analyze: [
    { id: "ana_type", text: "分析の種類は？", options: ["コードレビュー", "ビジネス分析", "競合比較", "品質チェック", "パフォーマンス分析"] },
    { id: "ana_depth", text: "深さは？", options: ["ざっくり概要", "普通の深さ", "徹底的に深く"] },
    { id: "ana_output", text: "結果の使い方は？", options: ["意思決定に使う", "報告書にする", "改善アクションに繋げる", "自分の理解のため"] },
  ],
};

export const PURPOSE_OPTIONS = [
  "精度を上げたい",
  "出力を具体的にしたい",
  "フォーマットを整えたい",
  "役割を明確にしたい",
  "思考プロセスを改善したい",
  "制約を追加したい",
  "全体的に改善したい",
];

export interface DiagnosisResult {
  ok: { point: string; reason: string }[];
  missing: { point: string; suggestion: string }[];
  unclear: { point: string; suggestion: string }[];
  questions: { question: string; options: string[] }[];
  summary: string;
}

export interface ImprovementResult {
  improved: string;
  changes: { location: string; before: string; after: string; reason: string }[];
  problems: string[];
}

export const RULE_QS: RuleQuestion[] = [
  { id: "role", name: "役割設定", text: "AIにどんなキャラで答えてほしい？", options: ["専門家・プロフェッショナル", "メンター・先生", "同僚・パートナー", "批評家・厳しめ", "指定なし"] },
  { id: "constraint", name: "出力制約", text: "出力の形式は？", options: ["箇条書き", "文章（段落）", "表・比較形式", "コード", "Before / After", "指定なし"] },
  { id: "length", name: "長さ", text: "出力の長さは？", options: ["短く簡潔に", "普通", "詳しく長めに", "指定なし"] },
  { id: "thinking", name: "思考プロセス", text: "AIの考え方は？", options: ["段階的に順序立てて", "結論から先に", "複数案を比較して", "指定なし"] },
  { id: "critical", name: "反証・チェック", text: "弱点チェックは必要？", options: ["はい、弱点を指摘してほしい", "軽くチェックする程度", "不要", "指定なし"] },
  { id: "pdca", name: "改善ループ", text: "自己レビュー・改善は？", options: ["1回はレビューしてほしい", "2回以上改善ループ", "不要、一発で出して", "指定なし"] },
  { id: "missing", name: "情報不足時", text: "情報が足りない時は？", options: ["推測せず質問して", "ベストな推測で進めて", "選択肢を提示して", "指定なし"] },
  { id: "examples", name: "例の有無", text: "良い例・悪い例は必要？", options: ["両方欲しい", "良い例だけ", "不要", "指定なし"] },
];
