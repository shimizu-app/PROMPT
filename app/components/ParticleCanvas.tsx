"use client";

import { useState, useEffect, useRef } from "react";

export const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w: number, h: number;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const COUNT = 180;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (w || 800),
      y: Math.random() * (h || 600),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.3,
      op: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 50 + 145,
      ph: Math.random() * Math.PI * 2,
    }));
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);
    let t = 0;
    const loop = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x,
        my = mouseRef.current.y;
      pts.forEach((p, i) => {
        const dx = p.x - mx,
          dy = p.y - my,
          dist = Math.sqrt(dx * dx + dy * dy),
          R = 180;
        if (dist < R && dist > 0) {
          const f = ((R - dist) / R) * 1.2,
            a = Math.atan2(dy, dx);
          p.vx += Math.cos(a) * f;
          p.vy += Math.sin(a) * f;
        }
        p.vx += Math.sin(t + p.ph) * 0.01;
        p.vy += Math.cos(t + p.ph * 1.3) * 0.01;
        p.vx *= 0.955;
        p.vy *= 0.955;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        const glow = dist < R ? 1.5 + ((R - dist) / R) * 2 : 1;
        const br = 0.7 + Math.sin(t * 2 + p.ph) * 0.3;
        const sz = p.size * glow,
          op = Math.min(p.op * glow * br, 1);
        if (dist < R) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz * 4, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
          g.addColorStop(0, `hsla(${p.hue},90%,70%,${op * 0.15})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},85%,65%,${op})`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j],
            d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(160,50%,55%,${0.12 * (1 - d / 90)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      });
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

export const InteractiveTitle = () => {
  const text = "プロンプトの限界を、超えろ。";
  const [chars, setChars] = useState(
    text.split("").map((c) => ({ c, lit: false }))
  );
  const onHover = (idx: number) => {
    setChars((prev) =>
      prev.map((ch, i) => ({ ...ch, lit: Math.abs(i - idx) <= 2 }))
    );
  };
  const onLeave = () =>
    setChars((prev) => prev.map((ch) => ({ ...ch, lit: false })));
  const onClick = (idx: number) => {
    for (let d = 0; d <= text.length; d++) {
      setTimeout(() => {
        setChars((prev) =>
          prev.map((ch, i) => ({
            ...ch,
            lit:
              Math.abs(i - idx) <= d && Math.abs(i - idx) >= d - 1,
          }))
        );
      }, d * 50);
    }
    setTimeout(
      () => setChars((prev) => prev.map((ch) => ({ ...ch, lit: false }))),
      text.length * 50 + 300
    );
  };
  return (
    <div
      style={{
        margin: "16px auto 48px",
        textAlign: "center",
        userSelect: "none",
        cursor: "pointer",
      }}
      onMouseLeave={onLeave}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          onMouseEnter={() => onHover(i)}
          onClick={() => onClick(i)}
          style={{
            fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
            fontWeight: 800,
            letterSpacing: "0.06em",
            display: "inline-block",
            position: "relative",
            color: ch.lit ? "#4ade80" : "#fff",
            textShadow: ch.lit
              ? "0 0 20px rgba(74,222,128,0.8), 0 0 60px rgba(74,222,128,0.4)"
              : "0 0 30px rgba(74,222,128,0.15)",
            transform: ch.lit
              ? "translateY(-6px) scale(1.15)"
              : "translateY(0) scale(1)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            animation: `fadeUp 1s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.03}s both`,
          }}
        >
          {ch.c}
          {ch.lit && (
            <span
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
};

export const GlitchText = ({ children }: { children: React.ReactNode }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    <span
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        color: "#06b6d4",
        clipPath: "inset(0 0 65% 0)",
        transform: "translate(2px,-1px)",
        opacity: 0.4,
      }}
    >
      {children}
    </span>
    <span
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        color: "#4ade80",
        clipPath: "inset(65% 0 0 0)",
        transform: "translate(-2px,1px)",
        opacity: 0.4,
      }}
    >
      {children}
    </span>
  </span>
);
