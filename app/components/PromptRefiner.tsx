"use client";

import { useState, useEffect, useCallback } from "react";
import { ParticleCanvas, GlitchText, InteractiveTitle } from "./ParticleCanvas";
import { I } from "./Icons";
import {
  GOAL_CATEGORIES,
  CAT_QS,
  RULE_QS,
  PURPOSE_OPTIONS,
} from "./data";
import type { DiagnosisResult, ImprovementResult } from "./data";
import { s, optStyle, dotStyle } from "./styles";
import type { CSSProperties } from "react";

interface SavedPrompt {
  id: string;
  created_at: string;
  mode: string;
  category: string;
  goal: string;
  generated_prompt: string;
}

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
  @keyframes pageIn {
    0% { opacity: 0; transform: scale(0.95) translateY(20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes cardFlash {
    0% { box-shadow: 0 0 0 rgba(74,222,128,0); }
    40% { box-shadow: 0 0 30px rgba(74,222,128,0.1), inset 0 0 20px rgba(74,222,128,0.02); }
    100% { box-shadow: 0 0 0 rgba(74,222,128,0); }
  }
  textarea:focus { border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 3px rgba(74,222,128,0.08) !important; }
  @media (max-width: 640px) {
    .hero-modes { flex-direction: column !important; align-items: center !important; }
    .hero-modes > button { width: 100% !important; max-width: 320px !important; min-width: 0 !important; padding: 22px 24px !important; }
    .cat-grid { grid-template-columns: 1fr !important; }
    .r-wrap { padding: 24px 14px !important; }
    .r-card { padding: 24px 18px !important; }
    .r-actions { flex-direction: column !important; }
    .r-actions > button { width: 100% !important; justify-content: center !important; }
  }
`;

const IconMap: Record<string, () => React.JSX.Element> = {
  fix: I.fix,
  design: I.design,
  create: I.create,
  analyze: I.analyze,
};

// ── Helper components ──
const Loader = ({ text }: { text: string }) => (
  <div style={{ textAlign: "center", padding: 60 }}>
    <div
      style={{
        color: "#4ade80",
        animation: "pulse-ring 1.5s infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <I.zap /> {text}
    </div>
  </div>
);

const DiagSection = ({
  color,
  icon,
  label,
  items,
  fieldA,
  fieldB,
}: {
  color: string;
  icon: string;
  label: string;
  items: Record<string, string>[] | undefined;
  fieldA: string;
  fieldB: string;
}) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: "0.82rem",
          color,
          fontWeight: 600,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon} {label}
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            padding: "10px 14px",
            background: `${color}11`,
            borderRadius: 10,
            marginBottom: 6,
            borderLeft: `3px solid ${color}55`,
            animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
          }}
        >
          <div style={{ fontSize: "0.88rem", color: "#d0d0e0", fontWeight: 500 }}>
            {it[fieldA]}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#9a9ab0", marginTop: 2 }}>
            {it[fieldB]}
          </div>
        </div>
      ))}
    </div>
  );
};

const Shell = ({
  children,
  exiting,
}: {
  children: React.ReactNode;
  exiting: boolean;
}) => (
  <div style={s.page as CSSProperties}>
    <style>{CSS}</style>
    <ParticleCanvas />
    <div
      style={
        exiting
          ? {
              transition: "all 0.3s cubic-bezier(0.4,0,1,1)",
              opacity: 0,
              transform: "scale(1.05)",
            }
          : {}
      }
    >
      {children}
    </div>
  </div>
);

const CardWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="r-wrap" style={s.center as CSSProperties}>
    <div
      className="r-card"
      style={{
        ...(s.card as CSSProperties),
        animation:
          "pageIn 0.5s cubic-bezier(0.16,1,0.3,1), cardFlash 0.7s ease-out",
      }}
    >
      <div style={s.scan as CSSProperties} />
      {children}
    </div>
  </div>
);

// ── Main Component ──
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
  const [sel, setSel] = useState<string | null>(null);
  // Supabase history
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SavedPrompt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Diagnosis flow (paste mode)
  const [diag, setDiag] = useState<DiagnosisResult | null>(null);
  const [explain, setExplain] = useState("");
  const [showExplain, setShowExplain] = useState(false);
  const [dqi, setDqi] = useState(0);
  const [dqSel, setDqSel] = useState<string | null>(null);
  const [dAns, setDAns] = useState<Record<string, string>>({});
  const [showDQ, setShowDQ] = useState(false);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [improv, setImprov] = useState<ImprovementResult | null>(null);
  // Animation
  const [exiting, setExiting] = useState(false);

  const go = (p: string) => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setAnim((a) => a + 1);
      setPhase(p);
    }, 300);
  };

  // ── Supabase history ──
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      if (data.prompts) setHistory(data.prompts);
    } catch {
      /* ignore */
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const savePrompt = async () => {
    setSaving(true);
    try {
      const categoryLabel =
        GOAL_CATEGORIES.find((c) => c.id === category)?.label || "";
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          category: categoryLabel,
          goal: goalText || promptText.slice(0, 60),
          original_prompt: promptText,
          cat_answers: catAnswers,
          rule_answers: ruleAnswers,
          generated_prompt: editMode ? editText : generated,
        }),
      });
      if (res.ok) {
        setSaved(true);
        fetchHistory();
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const deletePrompt = async (id: string) => {
    try {
      await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      setHistory((h) => h.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    }
  };

  const validateInput = (text: string) => {
    if (!text || text.trim().length < 2) {
      setInputError("入力してください");
      return false;
    }
    setInputError("");
    return true;
  };

  // ── Build-mode API calls (existing) ──
  const apiGenerate = async () => {
    setLoading(true);
    const categoryLabel = GOAL_CATEGORIES.find(
      (c) => c.id === category
    )?.label;
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
      setImprov(null);
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
        setConfirmText(
          `あなたがやりたいのは「${goalText}」ということですね？`
        );
      } else {
        setConfirmText(data.text);
      }
    } catch {
      setConfirmText(
        `あなたがやりたいのは「${goalText}」ということですね？`
      );
    }
    setLoading(false);
    go("confirm");
  };

  // ── Paste-mode API calls (new) ──
  const apiDiag = async () => {
    if (!validateInput(promptText)) return;
    setLoading(true);
    go("diagResult");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();
      setDiag(data.diagnosis);
    } catch {
      setDiag({
        ok: [],
        missing: [],
        unclear: [],
        questions: [],
        summary: "診断に失敗しました。再度お試しください。",
      });
    }
    setLoading(false);
  };

  const apiExplain = async () => {
    setLoading(true);
    setShowExplain(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();
      setExplain(data.text || "エラー");
    } catch {
      setExplain("エラー");
    }
    setLoading(false);
  };

  const apiImprove = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          purpose: purpose || "全体改善",
          diagnosis: diag,
          supplementAnswers: dAns,
        }),
      });
      const data = await res.json();
      if (data.improvement) {
        setImprov(data.improvement);
        setGenerated(data.improvement.improved || "");
        setEditText(data.improvement.improved || "");
      } else {
        setGenerated("APIエラー");
        setImprov(null);
      }
      go("result");
    } catch {
      setGenerated("APIエラー");
      setImprov(null);
      go("result");
    }
    setLoading(false);
  };

  // Re-diagnose: feed current result back into diagnosis
  const reDiag = () => {
    const text = editMode ? editText : generated;
    setPromptText(text);
    setDiag(null);
    setExplain("");
    setShowExplain(false);
    setDqi(0);
    setDqSel(null);
    setDAns({});
    setShowDQ(false);
    setPurpose(null);
    setImprov(null);
    setSel(null);
    setEditMode(false);
    setMode("paste");
    setLoading(true);
    go("diagResult");
    (async () => {
      try {
        const res = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await res.json();
        setDiag(data.diagnosis);
      } catch {
        setDiag({
          ok: [],
          missing: [],
          unclear: [],
          questions: [],
          summary: "診断に失敗しました。再度お試しください。",
        });
      }
      setLoading(false);
    })();
  };

  // ── Question flow ──
  const pickCat = (val: string) => {
    const qs = CAT_QS[category!];
    setCatAnswers((p) => ({ ...p, [qs[catIdx].id]: val }));
    setSel(null);
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
    setSel(null);
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
    setSaved(false);
    // Reset diagnosis state
    setDiag(null);
    setExplain("");
    setShowExplain(false);
    setDqi(0);
    setDqSel(null);
    setDAns({});
    setShowDQ(false);
    setPurpose(null);
    setImprov(null);
    go("hero");
  };

  const doCopy = () => {
    navigator.clipboard.writeText(editMode ? editText : generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════
  // HERO
  // ══════════════════════════════
  if (phase === "hero") {
    const modes = [
      {
        id: "paste",
        label: "プロンプトを入れる",
        desc: "診断 → 補完 → 改善",
        Ic: I.paste,
      },
      {
        id: "gen",
        label: "一から生成する",
        desc: "選択式で最強構築",
        Ic: I.build,
      },
    ];
    return (
      <Shell exiting={exiting}>
        <div
          key={anim}
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            cursor: "crosshair",
            padding: "48px 20px",
            animation: "pageIn 0.7s cubic-bezier(0.16,1,0.3,1)",
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
            <InteractiveTitle />
            <div
              className="hero-modes"
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {modes.map((m, i) => (
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
                    minWidth: 200,
                    animation: `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${0.6 + i * 0.15}s both`,
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
                    go(m.id === "paste" ? "pasteInput" : "category");
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
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6a6a80" }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
            {/* History Section */}
            {history.length > 0 && (
              <div
                style={{
                  marginTop: 56,
                  width: "100%",
                  maxWidth: 600,
                  animation:
                    "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s both",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    justifyContent: "center",
                    color: "#6a6a80",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  <I.history /> SAVED PROMPTS
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition:
                          "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(74,222,128,0.25)";
                        e.currentTarget.style.background =
                          "rgba(74,222,128,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.06)";
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.02)";
                      }}
                      onClick={() => {
                        setGenerated(item.generated_prompt);
                        setEditText(item.generated_prompt);
                        setGoalText(item.goal);
                        setMode(item.mode);
                        setSaved(true);
                        go("result");
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 500,
                            color: "#d0d0e0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.goal || "Untitled"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#4a4a60",
                            marginTop: 4,
                            display: "flex",
                            gap: 10,
                          }}
                        >
                          <span>{item.category}</span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString(
                              "ja-JP"
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4a4a60",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                          transition: "color 0.2s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#4a4a60";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePrompt(item.id);
                        }}
                      >
                        <I.trash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // ══════════════════════════════
  // PASTE INPUT (new)
  // ══════════════════════════════
  if (phase === "pasteInput") {
    return (
      <Shell exiting={exiting}>
        <CardWrap>
          <div style={s.tag as CSSProperties}>CHECK & IMPROVE</div>
          <h2 style={s.h2 as CSSProperties}>
            プロンプトを貼り付けてください
          </h2>
          <p
            style={{
              color: "#6a6a80",
              fontSize: "0.85rem",
              marginBottom: 16,
            }}
          >
            足りない部分を指摘 → 目的確認 → 質問で補完 → 改善版生成
          </p>
          <textarea
            style={{ ...(s.ta as CSSProperties), minHeight: 200 }}
            placeholder="プロンプトをここに..."
            value={promptText}
            onChange={(e) => {
              setPromptText(e.target.value);
              setInputError("");
            }}
          />
          {inputError && (
            <div style={s.err as CSSProperties}>
              <I.warn /> {inputError}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <button style={s.sec as CSSProperties} onClick={reset}>
              <I.back /> 戻る
            </button>
            <button style={s.pri as CSSProperties} onClick={apiDiag}>
              チェック開始 <I.arrow />
            </button>
          </div>
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // DIAG RESULT (new)
  // ══════════════════════════════
  if (phase === "diagResult") {
    const qs = diag?.questions || [];
    const hasQ = qs.length > 0;
    const allDone = dqi >= qs.length;
    return (
      <Shell exiting={exiting}>
        <CardWrap>
          <div style={s.tag as CSSProperties}>DIAGNOSIS</div>
          {loading ? (
            <Loader text="チェック中..." />
          ) : diag ? (
            <>
              <div style={{ ...(s.res as CSSProperties), marginBottom: 20 }}>
                {diag.summary}
              </div>
              <DiagSection
                color="#4ade80"
                icon="✓"
                label="ここはOK"
                items={diag.ok as unknown as Record<string, string>[]}
                fieldA="point"
                fieldB="reason"
              />
              <DiagSection
                color="#f87171"
                icon="✗"
                label="足りていない"
                items={diag.missing as unknown as Record<string, string>[]}
                fieldA="point"
                fieldB="suggestion"
              />
              <DiagSection
                color="#fbbf24"
                icon="!"
                label="曖昧・不明確"
                items={diag.unclear as unknown as Record<string, string>[]}
                fieldA="point"
                fieldB="suggestion"
              />
              {showExplain && explain && (
                <div
                  style={{
                    ...(s.res as CSSProperties),
                    marginBottom: 16,
                    borderColor: "rgba(6,182,212,0.2)",
                  }}
                >
                  {explain}
                </div>
              )}
              {/* Purpose selection */}
              {!purpose && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: 20,
                    background: "rgba(74,222,128,0.03)",
                    border: "1px solid rgba(74,222,128,0.12)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.88rem",
                      color: "#fff",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    このプロンプトで何をしたい？
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {PURPOSE_OPTIONS.map((p, i) => (
                      <div
                        key={i}
                        style={optStyle(sel === p)}
                        onClick={() => setSel(p)}
                      >
                        <div style={dotStyle(sel === p)} />
                        {p}
                      </div>
                    ))}
                  </div>
                  <button
                    style={{
                      ...(s.pri as CSSProperties),
                      marginTop: 12,
                      width: "100%",
                      justifyContent: "center",
                      opacity: sel ? 1 : 0.35,
                      pointerEvents: sel ? "auto" : "none",
                    }}
                    onClick={() => {
                      setPurpose(sel);
                      setSel(null);
                    }}
                  >
                    決定 <I.arrow />
                  </button>
                </div>
              )}
              {/* Supplement questions */}
              {purpose && hasQ && showDQ && !allDone && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: 20,
                    background: "rgba(6,182,212,0.04)",
                    border: "1px solid rgba(6,182,212,0.15)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "#06b6d4",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    補完質問（{dqi + 1}/{qs.length}）
                  </div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      color: "#fff",
                      fontWeight: 600,
                      marginBottom: 14,
                    }}
                  >
                    {qs[dqi]?.question}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {qs[dqi]?.options?.map((o, i) => (
                      <div
                        key={i}
                        style={optStyle(dqSel === o)}
                        onClick={() => setDqSel(o)}
                      >
                        <div style={dotStyle(dqSel === o)} />
                        {o}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      style={{
                        ...(s.pri as CSSProperties),
                        flex: 1,
                        opacity: dqSel ? 1 : 0.35,
                        pointerEvents: dqSel ? "auto" : "none",
                      }}
                      onClick={() => {
                        setDAns((p) => ({
                          ...p,
                          [qs[dqi].question]: dqSel!,
                        }));
                        setDqi(dqi + 1);
                        setDqSel(null);
                      }}
                    >
                      次へ <I.arrow />
                    </button>
                    <button
                      style={s.ghost as CSSProperties}
                      onClick={() => {
                        setDAns((p) => ({
                          ...p,
                          [qs[dqi].question]: "スキップ",
                        }));
                        setDqi(dqi + 1);
                        setDqSel(null);
                      }}
                    >
                      <I.skip /> スキップ
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!showExplain && (
                  <button
                    style={s.ghost as CSSProperties}
                    onClick={apiExplain}
                  >
                    <I.book /> 意味を解説
                  </button>
                )}
                {purpose && hasQ && !showDQ && (
                  <button
                    style={{
                      ...(s.ghost as CSSProperties),
                      color: "#06b6d4",
                      borderColor: "rgba(6,182,212,0.2)",
                    }}
                    onClick={() => setShowDQ(true)}
                  >
                    <I.zap /> 質問で補完
                  </button>
                )}
                {purpose && (
                  <button
                    style={{
                      ...(s.pri as CSSProperties),
                      flex: 1,
                      justifyContent: "center",
                    }}
                    onClick={apiImprove}
                    disabled={loading}
                  >
                    {loading ? "改善中..." : "改善版を生成"}
                  </button>
                )}
                <button
                  style={s.ghost as CSSProperties}
                  onClick={reset}
                >
                  <I.refresh /> 最初から
                </button>
              </div>
            </>
          ) : null}
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // CATEGORY
  // ══════════════════════════════
  if (phase === "category") {
    return (
      <Shell exiting={exiting}>
        <CardWrap>
          <div style={s.tag as CSSProperties}>STEP 01</div>
          <h2 style={s.h2 as CSSProperties}>何をしたいですか？</h2>
          <div
            className="cat-grid"
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
                      e.currentTarget.style.transform = "translateY(0)";
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
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // INPUT
  // ══════════════════════════════
  if (phase === "input") {
    return (
      <Shell exiting={exiting}>
        <CardWrap>
          <div style={s.tag as CSSProperties}>STEP 02</div>
          <h2 style={s.h2 as CSSProperties}>やりたいことを入力</h2>
          <textarea
            style={s.ta as CSSProperties}
            placeholder="例：LPのコンバージョン率改善コピー"
            value={goalText}
            onChange={(e) => {
              setGoalText(e.target.value);
              setInputError("");
            }}
          />
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
                if (validateInput(goalText)) {
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
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // QUESTIONS
  // ══════════════════════════════
  if (phase === "questions") {
    const q = curQ();
    const p = getProgress();
    return (
      <Shell exiting={exiting}>
        <CardWrap>
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
              animation: "slideIn 0.4s cubic-bezier(0.16,1,0.3,1)",
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
              }}
            >
              次へ <I.arrow />
            </button>
            <button
              style={s.ghost as CSSProperties}
              onClick={() => {
                if (qPhase === "cat") pickCat("スキップ");
                else pickRule("指定なし");
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
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // CONFIRM
  // ══════════════════════════════
  if (phase === "confirm") {
    return (
      <Shell exiting={exiting}>
        <CardWrap>
          <div style={s.tag as CSSProperties}>CONFIRM</div>
          <h2 style={s.h2 as CSSProperties}>これで合っていますか？</h2>
          <div style={{ ...(s.res as CSSProperties), marginBottom: 20 }}>
            {loading ? <Loader text="分析中..." /> : confirmText}
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
        </CardWrap>
      </Shell>
    );
  }

  // ══════════════════════════════
  // RESULT
  // ══════════════════════════════
  if (phase === "result") {
    return (
      <Shell exiting={exiting}>
        <CardWrap>
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
                {mode === "paste"
                  ? "改善されたプロンプト"
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
            <Loader text="生成中..." />
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
          {/* Improvement details for paste mode */}
          {improv && !editMode && (
            <>
              {improv.problems?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "#f87171",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    ✗ 元の問題点
                  </div>
                  {improv.problems.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 14px",
                        background: "rgba(239,68,68,0.04)",
                        borderRadius: 8,
                        marginBottom: 4,
                        fontSize: "0.85rem",
                        color: "#b8b8d0",
                        borderLeft:
                          "3px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
              {improv.changes?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "#4ade80",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    ✓ 修正した箇所
                  </div>
                  {improv.changes.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        background: "rgba(74,222,128,0.04)",
                        borderRadius: 10,
                        marginBottom: 6,
                        borderLeft:
                          "3px solid rgba(74,222,128,0.3)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#4ade80",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {c.location}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: "0.8rem",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            color: "#f87171",
                            textDecoration: "line-through",
                          }}
                        >
                          {c.before}
                        </span>
                        <span style={{ color: "#6a6a80" }}>→</span>
                        <span style={{ color: "#4ade80" }}>
                          {c.after}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: "0.75rem", color: "#6a6a80" }}
                      >
                        {c.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div
            className="r-actions"
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
              style={{
                ...(s.ghost as CSSProperties),
                color: "#06b6d4",
                borderColor: "rgba(6,182,212,0.2)",
              }}
              onClick={reDiag}
            >
              <I.zap /> この結果を再診断
            </button>
            <button
              style={{
                ...(s.ghost as CSSProperties),
                color: saved ? "#4ade80" : "#6a6a80",
                borderColor: saved
                  ? "rgba(74,222,128,0.3)"
                  : "rgba(255,255,255,0.05)",
              }}
              onClick={savePrompt}
              disabled={saving || saved}
            >
              {saved ? (
                <>
                  <I.check /> 保存済み
                </>
              ) : saving ? (
                "保存中..."
              ) : (
                <>
                  <I.save /> DBに保存
                </>
              )}
            </button>
            <button style={s.ghost as CSSProperties} onClick={reset}>
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
                  setSaved(false);
                  if (mode === "paste") {
                    apiImprove();
                  } else {
                    apiGenerate();
                  }
                }
              }}
            >
              {editMode ? (
                "確定"
              ) : (
                <>
                  <I.refresh /> 再生成
                </>
              )}
            </button>
          </div>
        </CardWrap>
      </Shell>
    );
  }

  return null;
}
