"use client";

import { useEffect, useRef } from "react";
import type { EndingEffect } from "@/lib/types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  emoji?: string;
}

const COLORS = ["#ff5a36", "#ffc93c", "#2ec4b6", "#ff7eb6", "#7b61ff", "#3ddc84"];

/** كونفيتي أو مطر إيموجي على canvas خفيف — من غير مكتبات */
export function Celebration({ effect, emoji }: { effect: EndingEffect; emoji: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === "shake") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !c) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = window.innerWidth;
    const particles: Particle[] = [];
    const rain = effect === "emoji-rain";
    const count = rain ? 36 : 140;
    for (let i = 0; i < count; i++) {
      particles.push(
        rain
          ? {
              x: Math.random() * w,
              y: -40 - Math.random() * window.innerHeight,
              vx: (Math.random() - 0.5) * 0.6,
              vy: 2 + Math.random() * 2.5,
              rot: Math.random() * Math.PI,
              vr: (Math.random() - 0.5) * 0.05,
              size: 26 + Math.random() * 18,
              color: "",
              emoji,
            }
          : {
              x: w / 2,
              y: window.innerHeight * 0.35,
              vx: (Math.random() - 0.5) * 16,
              vy: -6 - Math.random() * 10,
              rot: Math.random() * Math.PI,
              vr: (Math.random() - 0.5) * 0.3,
              size: 6 + Math.random() * 6,
              color: COLORS[i % COLORS.length],
            },
      );
    }

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      c.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        if (!rain) {
          p.vy += 0.28;
          p.vx *= 0.985;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        if (p.emoji) {
          c.font = `${p.size}px serif`;
          c.fillText(p.emoji, -p.size / 2, p.size / 2);
        } else {
          c.fillStyle = p.color;
          c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        c.restore();
      }
      if (frame < 320) raf = requestAnimationFrame(tick);
      else c.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [effect, emoji]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
