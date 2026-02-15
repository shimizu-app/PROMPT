"use client";

import { useState } from "react";
import { ParticleCanvas, GlitchText } from "./ParticleCanvas";
import { I } from "./Icons";
import { GOAL_CATEGORIES, CAT_QS, RULE_QS } from "./data";
import { s, optStyle, dotStyle } from "./styles";
import type { CSSProperties } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 10px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes shimmer { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
  @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.6; } }
  @keyframes glitch { 0%,100% { transform: translate(0); } 20% { transform: translate(-3px,2px); } 40% { transform: translate(3px,-2px); } 60% { transform: translate(-2px,-1px); } 80% { transform: translate(2px,1px); } }
  textarea:focus { border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 3px rgba(74,222,128,0.08) !important; }
`;

const IconMap: Record<string, () => React.JSX.Element> = {
  fix: I.fix,
  design: I.design,
  create: I.create,
  analyze: I.analyze,
};

export default function PromptRefiner() {
  const [phase, setPhase] = useState("hero");
  const [mode, setMode] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [goalText, setGoalText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [catAnswers, setCatAnswers] = useState<Record<string, string>>({});
  const [catIdx, setCatIdx] = useState(0);
  const [ruleAnswers, setRuleAnswers] = useState<Record<string, string>>({});
  const [ruleIdx, setRuleIdx] = useState(0);
  const [qPhase, setQPhase] = useState("cat");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [anim, setAnim] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");
  // Lifted from questions phase to avoid useState in conditional render
  const [sel, setSel] = useState<string | null>(null);

  const go = (p: string) => {
    setAnim((a) => a + 1);
    setPhase(p);
  };

  const validateInput = () => {
    const text = mode === "refine" ? promptText.trim() : goalText.trim();
    if (!text) {
      setInputError("入力してください");
      return false;
    }
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
    const hasReadableEnglish = /[a-zA-Z]{2,}/.test(text);
    const tooShort = text.length < 3;
    const tooManySpecial =
      (
        text.match(
          /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s.,!?、。！？\-:;()（）「」]/g
        ) || []
      ).length >
      text.length * 0.5;
    if (tooShort) {
      setInputError("もう少し具体的に書いてください");
      return false;
    }
    if (!hasJapanese && !hasReadableEnglish) {
      setInputError("読み取れません。日本語か英語で入力してください");
      return false;
    }
    if (tooManySpecial) {
      setInputError("読み取れません。意味のある文章を入力してください");
      return false;
    }
    setInputError("");
    return true;
  };

  const apiGenerate = async () => {
    setLoading(true);
    const categoryLabel = GOAL_CATEGORIES.find((c) => c.id === category)?.label;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          category: categoryLabel,
          goal: goalText,
          prompt: promptText,
          catAnswers,
          ruleAnswers,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setGenerated(`エラー: ${data.error}`);
      } else {
        setGenerated(data.text);
        setEditText(data.text);
      }
      go("result");
    } catch {
      setGenerated("APIエラーが発生しました。");
      go("result");
    }
    setLoading(false);
  };

  const apiConfirm = async () => {
    setLoading(true);
    const info = {
      mode,
      category: GOAL_CATEGORIES.find((c) => c.id === category)?.label,
      goal: goalText,
      prompt: promptText,
      catAnswers,
      ruleAnswers,
    };
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (data.error) {
        setConfirmText(`あなたがやりたいのは「${goalText}」ということですね？`);
      } else {
        setConfirmText(data.text);
      }
    } catch {
      setConfirmText(`あなたがやりたいのは「${goalText}」ということですね？`);
    }
    setLoading(false);
    go("confirm");
  };

  const pickCat = (val: string) => {
    const qs = CAT_QS[category!];
    setCatAnswers((p) => ({ ...p, [qs[catIdx].id]: val }));
    if (catIdx < qs.length - 1) {
      setCatIdx(catIdx + 1);
      setAnim((a) => a + 1);
    } else {
      setQPhase("rule");
      setRuleIdx(0);
      setAnim((a) => a + 1);
    }
  };

  const pickRule = (val: string) => {
    setRuleAnswers((p) => ({ ...p, [RULE_QS[ruleIdx].id]: val }));
    if (ruleIdx < RULE_QS.length - 1) {
      setRuleIdx(ruleIdx + 1);
      setAnim((a) => a + 1);
    } else {
      apiConfirm();
    }
  };

  const getProgress = () => {
    const cT = category ? CAT_QS[category]?.length || 0 : 0;
    const rT = RULE_QS.length;
    const total = cT + rT;
    const cur = qPhase === "cat" ? catIdx : cT + ruleIdx;
    return { cur, total, pct: (cur / total) * 100 };
  };

  const curQ = () =>
    qPhase === "cat" ? CAT_QS[category!]?.[catIdx] : RULE_QS[ruleIdx];

  const reset = () => {
    setMode(null);
    setCategory(null);
    setGoalText("");
    setPromptText("");
    setCatAnswers({});
    setRuleAnswers({});
    setCatIdx(0);
    setRuleIdx(0);
    setQPhase("cat");
    setGenerated("");
    setConfirmText("");
    setEditMode(false);
    setInputError("");
    setSel(null);
    go("hero");
  };

  const doCopy = () => {
    navigator.clipboard.writeText(editMode ? editText : generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ============================================
  // HERO
  // ============================================
  if (phase === "hero") {
    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            cursor: "crosshair",
          }}
        >
          <div
            style={{
              textAlign: "center",
              animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              style={{
                ...(s.tag as CSSProperties),
                animation: "pulse-ring 2.5s ease-in-out infinite",
                marginBottom: 28,
              }}
            >
              <I.zap /> PROMPT ENGINEERING SYSTEM
            </div>
            <h1
              style={{
                fontSize: "clamp(3rem,7vw,5.5rem)",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#4ade80 0%,#06b6d4 40%,#4ade80 80%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: "0.6rem",
                animation: "shimmer 4s linear infinite",
              }}
            >
              <GlitchText>PROMPT</GlitchText>
              <br />
              <GlitchText>REFINER</GlitchText>
            </h1>
            <div style={{ margin: "16px auto 48px", textAlign: "center" }}>
              <span
                style={{
                  fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#fff",
                  display: "inline-block",
                  position: "relative",
                  textShadow:
                    "0 0 40px rgba(74,222,128,0.3), 0 0 80px rgba(6,182,212,0.15)",
                  animation:
                    "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.4s both",
                }}
              >
                <span style={{ position: "relative", zIndex: 1 }}>
                  プロンプトの限界を、超えろ。
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    color: "#06b6d4",
                    clipPath: "inset(0 0 60% 0)",
                    transform: "translate(3px,-2px)",
                    opacity: 0.5,
                    animation: "glitch 3s ease-in-out infinite",
                  }}
                >
                  プロンプトの限界を、超えろ。
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    color: "#4ade80",
                    clipPath: "inset(60% 0 0 0)",
                    transform: "translate(-3px,2px)",
                    opacity: 0.5,
                    animation: "glitch 3s ease-in-out infinite reverse",
                  }}
                >
                  プロンプトの限界を、超えろ。
                </span>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  id: "refine",
                  label: "プロンプトを修正",
                  desc: "既存のプロンプトを改善",
                  Ic: I.refine,
                },
                {
                  id: "build",
                  label: "一から作成",
                  desc: "ゼロから構築する",
                  Ic: I.build,
                },
              ].map((m, i) => (
                <button
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "28px 36px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    color: "#e4e4ec",
                    cursor: "pointer",
                    transition:
                      "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                    minWidth: 180,
                    animation: `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.15}s both`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "rgba(74,222,128,0.35)";
                    el.style.background = "rgba(74,222,128,0.04)";
                    el.style.transform = "translateY(-4px)";
                    el.style.boxShadow =
                      "0 8px 32px rgba(74,222,128,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.background = "rgba(255,255,255,0.02)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                  onClick={() => {
                    setMode(m.id);
                    go("category");
                  }}
                >
                  <div
                    style={{
                      color: "#4ade80",
                      animation: "float 3s ease-in-out infinite",
                    }}
                  >
                    <m.Ic />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6a6a80" }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // CATEGORY
  // ============================================
  if (phase === "category") {
    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div style={s.center as CSSProperties}>
          <div style={s.card as CSSProperties} key={anim}>
            <div style={s.scan as CSSProperties} />
            <div style={s.tag as CSSProperties}>STEP 01</div>
            <h2 style={s.h2 as CSSProperties}>何をしたいですか？</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {GOAL_CATEGORIES.map((c, i) => {
                const Ic = IconMap[c.iconKey];
                return (
                  <button
                    key={c.id}
                    style={{
                      padding: "22px 16px",
                      textAlign: "center",
                      background:
                        category === c.id
                          ? "rgba(74,222,128,0.06)"
                          : "rgba(255,255,255,0.015)",
                      border:
                        category === c.id
                          ? "1px solid rgba(74,222,128,0.3)"
                          : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      cursor: "pointer",
                      color: "#e4e4ec",
                      transition:
                        "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                      animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both`,
                    }}
                    onMouseEnter={(e) => {
                      if (category !== c.id) {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.15)";
                        e.currentTarget.style.transform =
                          "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (category !== c.id) {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.05)";
                        e.currentTarget.style.transform =
                          "translateY(0)";
                      }
                    }}
                    onClick={() => setCategory(c.id)}
                  >
                    <div
                      style={{
                        color:
                          category === c.id ? "#4ade80" : "#6a6a80",
                        marginBottom: 8,
                        transition: "color 0.3s",
                      }}
                    >
                      {Ic && <Ic />}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        marginBottom: 4,
                      }}
                    >
                      {c.label}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6a6a80" }}>
                      {c.desc}
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              <button style={s.sec as CSSProperties} onClick={reset}>
                <I.back /> 戻る
              </button>
              {category && (
                <button
                  style={{
                    ...(s.pri as CSSProperties),
                    animation: "fadeIn 0.3s",
                  }}
                  onClick={() => go("input")}
                >
                  次へ <I.arrow />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // INPUT
  // ============================================
  if (phase === "input") {
    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div style={s.center as CSSProperties}>
          <div style={s.card as CSSProperties} key={anim}>
            <div style={s.scan as CSSProperties} />
            <div style={s.tag as CSSProperties}>STEP 02</div>
            <h2 style={s.h2 as CSSProperties}>
              {mode === "refine"
                ? "修正対象と改善ポイント"
                : "やりたいことを入力"}
            </h2>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  color: "#8a8a9e",
                  marginBottom: 6,
                  fontWeight: 500,
                  fontSize: "0.85rem",
                }}
              >
                {mode === "refine" ? "どう改善したいか" : "したいこと"}
              </label>
              <textarea
                style={s.ta as CSSProperties}
                placeholder={
                  mode === "refine"
                    ? "例：出力が抽象的すぎるので具体化したい"
                    : "例：LPのコンバージョン率改善コピー"
                }
                value={goalText}
                onChange={(e) => {
                  setGoalText(e.target.value);
                  setInputError("");
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  color: "#8a8a9e",
                  marginBottom: 6,
                  fontWeight: 500,
                  fontSize: "0.85rem",
                }}
              >
                {mode === "refine"
                  ? "現在のプロンプト（必須）"
                  : "現在のプロンプト（任意）"}
              </label>
              <textarea
                style={{
                  ...(s.ta as CSSProperties),
                  minHeight: mode === "refine" ? 180 : 100,
                }}
                placeholder={
                  mode === "refine"
                    ? "修正したいプロンプトを貼り付け"
                    : "空でもOK"
                }
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setInputError("");
                }}
              />
            </div>
            {inputError && (
              <div style={s.err as CSSProperties}>
                <I.warn /> {inputError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <button
                style={s.sec as CSSProperties}
                onClick={() => go("category")}
              >
                <I.back /> 戻る
              </button>
              <button
                style={s.pri as CSSProperties}
                onClick={() => {
                  if (validateInput()) {
                    setQPhase("cat");
                    setCatIdx(0);
                    setRuleIdx(0);
                    setSel(null);
                    go("questions");
                  }
                }}
              >
                質問開始 <I.arrow />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // QUESTIONS (SELECTION BASED)
  // ============================================
  if (phase === "questions") {
    const q = curQ();
    const p = getProgress();

    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div style={s.center as CSSProperties}>
          <div style={s.card as CSSProperties} key={anim}>
            <div style={s.scan as CSSProperties} />
            <div style={s.prog as CSSProperties}>
              <div
                style={{
                  width: `${p.pct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#4ade80,#06b6d4)",
                  borderRadius: 2,
                  transition:
                    "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={s.tag as CSSProperties}>
                {qPhase === "cat" ? "DEEP DIVE" : "RULE CHECK"}
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#4a4a60",
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {String(p.cur + 1).padStart(2, "0")} /{" "}
                {String(p.total).padStart(2, "0")}
              </span>
            </div>
            {qPhase === "rule" && (
              <div
                style={{
                  ...(s.tag as CSSProperties),
                  background: "rgba(6,182,212,0.08)",
                  color: "#06b6d4",
                  borderColor: "rgba(6,182,212,0.15)",
                  marginBottom: 12,
                }}
              >
                {RULE_QS[ruleIdx]?.name}
              </div>
            )}
            <h2
              style={{
                ...(s.h2 as CSSProperties),
                fontSize: "1.3rem",
                animation:
                  "slideIn 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {q?.text}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {q?.options?.map((opt, i) => (
                <div
                  key={i}
                  style={{
                    ...optStyle(sel === opt),
                    animation: `fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    if (sel !== opt)
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    if (sel !== opt)
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.06)";
                  }}
                  onClick={() => setSel(opt)}
                >
                  <div style={dotStyle(sel === opt)} />
                  {opt}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                style={{
                  ...(s.pri as CSSProperties),
                  flex: "1 1 auto",
                  opacity: sel ? 1 : 0.35,
                  pointerEvents: sel ? "auto" : "none",
                }}
                onClick={() => {
                  if (qPhase === "cat") pickCat(sel!);
                  else pickRule(sel!);
                  setSel(null);
                }}
              >
                次へ <I.arrow />
              </button>
              <button
                style={s.ghost as CSSProperties}
                onClick={() => {
                  if (qPhase === "cat") pickCat("スキップ");
                  else pickRule("指定なし");
                  setSel(null);
                }}
              >
                <I.skip /> スキップ
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <button
                style={{
                  ...(s.sec as CSSProperties),
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                }}
                onClick={apiConfirm}
              >
                <I.zap /> ここまでの情報で生成する
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // CONFIRM
  // ============================================
  if (phase === "confirm") {
    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div style={s.center as CSSProperties}>
          <div style={s.card as CSSProperties} key={anim}>
            <div style={s.scan as CSSProperties} />
            <div style={s.tag as CSSProperties}>CONFIRM</div>
            <h2 style={s.h2 as CSSProperties}>これで合っていますか？</h2>
            <div style={{ ...(s.res as CSSProperties), marginBottom: 20 }}>
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "#4ade80",
                    animation: "pulse-ring 1.5s ease-in-out infinite",
                  }}
                >
                  分析中...
                </div>
              ) : (
                confirmText
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={s.sec as CSSProperties}
                onClick={() => go("questions")}
              >
                <I.back /> 修正する
              </button>
              <button
                style={{
                  ...(s.pri as CSSProperties),
                  flex: 1,
                  justifyContent: "center",
                }}
                onClick={apiGenerate}
                disabled={loading}
              >
                {loading ? (
                  "生成中..."
                ) : (
                  <>
                    プロンプト生成 <I.arrow />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RESULT
  // ============================================
  if (phase === "result") {
    return (
      <div style={s.page as CSSProperties}>
        <style>{CSS}</style>
        <ParticleCanvas />
        <div style={s.center as CSSProperties}>
          <div style={s.card as CSSProperties} key={anim}>
            <div style={s.scan as CSSProperties} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={s.tag as CSSProperties}>GENERATED</div>
                <h2 style={{ ...(s.h2 as CSSProperties), marginBottom: 0 }}>
                  {mode === "refine"
                    ? "修正されたプロンプト"
                    : "生成されたプロンプト"}
                </h2>
              </div>
              <button
                style={{
                  ...(s.ghost as CSSProperties),
                  color: copied ? "#4ade80" : "#6a6a80",
                  borderColor: copied
                    ? "rgba(74,222,128,0.3)"
                    : "rgba(255,255,255,0.05)",
                }}
                onClick={doCopy}
              >
                <I.copy /> {copied ? "Copied!" : "コピー"}
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div
                  style={{
                    color: "#4ade80",
                    animation: "pulse-ring 1.5s ease-in-out infinite",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <I.zap /> 最強のプロンプトを生成中...
                </div>
              </div>
            ) : editMode ? (
              <textarea
                style={{
                  ...(s.ta as CSSProperties),
                  minHeight: 380,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.75,
                }}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <div style={s.res as CSSProperties}>{generated}</div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 18,
                flexWrap: "wrap",
              }}
            >
              <button
                style={s.ghost as CSSProperties}
                onClick={() => {
                  setEditMode(!editMode);
                  if (!editMode) setEditText(generated);
                }}
              >
                <I.edit /> {editMode ? "プレビュー" : "編集"}
              </button>
              <button
                style={s.ghost as CSSProperties}
                onClick={reset}
              >
                <I.refresh /> 最初から
              </button>
              <button
                style={{
                  ...(s.pri as CSSProperties),
                  flex: 1,
                  justifyContent: "center",
                }}
                onClick={() => {
                  if (editMode) {
                    setGenerated(editText);
                    setEditMode(false);
                  } else {
                    apiGenerate();
                  }
                }}
              >
                {editMode ? (
                  "保存"
                ) : (
                  <>
                    <I.refresh /> 再生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
