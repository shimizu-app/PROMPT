"use client";

import { useEffect, useRef } from "react";

interface WaveLayer {
  baseY: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: [number, number, number];
  opacity: number;
  segments: number;
  phase: number;
}

const LAYERS: WaveLayer[] = [
  { baseY: 0.30, amplitude: 28, frequency: 1.1, speed: 0.55, color: [74, 222, 128], opacity: 0.10, segments: 8, phase: 0 },
  { baseY: 0.42, amplitude: 32, frequency: 0.85, speed: 0.70, color: [6, 182, 212], opacity: 0.08, segments: 7, phase: 1.8 },
  { baseY: 0.54, amplitude: 22, frequency: 1.4, speed: 0.90, color: [74, 222, 128], opacity: 0.06, segments: 9, phase: 3.2 },
  { baseY: 0.66, amplitude: 36, frequency: 0.65, speed: 0.45, color: [6, 182, 212], opacity: 0.05, segments: 6, phase: 4.8 },
  { baseY: 0.78, amplitude: 18, frequency: 1.7, speed: 1.10, color: [74, 222, 128], opacity: 0.04, segments: 10, phase: 6.0 },
];

const HOVER_RADIUS = 180;
const HOVER_FORCE = 45;
const GLOW_RADIUS = 100;
const SMOOTH_FACTOR = 0.07;

export const WaveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const smoothRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const onLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);

    let t = 0;
    let animId: number;

    const loop = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.active ? mouseRef.current.x : -1000;
      const my = mouseRef.current.active ? mouseRef.current.y : -1000;
      smoothRef.current.x += (mx - smoothRef.current.x) * SMOOTH_FACTOR;
      smoothRef.current.y += (my - smoothRef.current.y) * SMOOTH_FACTOR;
      const sx = smoothRef.current.x;
      const sy = smoothRef.current.y;

      LAYERS.forEach((layer) => {
        const { baseY, amplitude, frequency, speed, color, opacity, segments, phase } = layer;
        const centerY = h * baseY;
        const [cr, cg, cb] = color;

        // --- generate control points ---
        const pts: [number, number][] = [];
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * w;
          const wave1 = Math.sin(t * speed * 60 * 0.016 + i * frequency + phase) * amplitude;
          const wave2 = Math.sin(t * speed * 42 * 0.016 + i * frequency * 1.3 + phase + 2.0) * amplitude * 0.4;
          const wave3 = Math.cos(t * speed * 30 * 0.016 + i * frequency * 0.7 + phase + 4.0) * amplitude * 0.2;
          let y = centerY + wave1 + wave2 + wave3;

          // mouse hover deformation
          if (mouseRef.current.active) {
            const dx = x - sx;
            const dy = y - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < HOVER_RADIUS && dist > 0) {
              const power = Math.pow((HOVER_RADIUS - dist) / HOVER_RADIUS, 2);
              const angle = Math.atan2(dy, dx);
              y += Math.sin(angle) * power * HOVER_FORCE;
              // slight horizontal shift too
              // x += Math.cos(angle) * power * HOVER_FORCE * 0.3;
            }
          }

          pts.push([x, y]);
        }

        // --- draw filled wave with bezier ---
        ctx.beginPath();
        ctx.moveTo(-5, h + 5);
        ctx.lineTo(pts[0][0], pts[0][1]);
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[i + 1];
          const cpx = (x1 + x2) / 2;
          ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
        }
        ctx.lineTo(w + 5, h + 5);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, centerY - amplitude, 0, h);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${opacity})`);
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${opacity * 0.6})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();

        // --- draw wave stroke ---
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[i + 1];
          const cpx = (x1 + x2) / 2;
          ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
        }
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${opacity * 3})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // --- glow dots near mouse ---
        if (mouseRef.current.active) {
          pts.forEach(([px, py]) => {
            const dist = Math.hypot(px - sx, py - sy);
            if (dist < GLOW_RADIUS) {
              const glowOp = Math.pow((GLOW_RADIUS - dist) / GLOW_RADIUS, 2) * 0.6;

              // dot
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${cr},${cg},${cb},${glowOp})`;
              ctx.fill();

              // halo
              const halo = ctx.createRadialGradient(px, py, 0, px, py, 18);
              halo.addColorStop(0, `rgba(${cr},${cg},${cb},${glowOp * 0.4})`);
              halo.addColorStop(1, "transparent");
              ctx.beginPath();
              ctx.arc(px, py, 18, 0, Math.PI * 2);
              ctx.fillStyle = halo;
              ctx.fill();

              // line from cursor to point
              if (dist < GLOW_RADIUS * 0.6) {
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(px, py);
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${glowOp * 0.2})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          });
        }
      });

      // --- cursor glow orb ---
      if (mouseRef.current.active) {
        const orb = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60);
        orb.addColorStop(0, "rgba(74,222,128,0.08)");
        orb.addColorStop(0.5, "rgba(6,182,212,0.03)");
        orb.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(sx, sy, 60, 0, Math.PI * 2);
        ctx.fillStyle = orb;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        position: "absolute",
        inset: 0,
      }}
    />
  );
};
