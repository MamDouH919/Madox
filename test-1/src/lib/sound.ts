import type { EndingSound } from "./types";

/**
 * مؤثرات صوتية متولدة بالـ Web Audio API — من غير أي ملفات صوت.
 * المتصفحات بتسمح بالصوت بس بعد ما المستخدم يدوس على حاجة، فأول استدعاء لازم يكون من click.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "triangle", volume = 0.2, slideTo?: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function noiseBurst(start: number, duration: number, volume = 0.15) {
  const ac = audio();
  if (!ac) return;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(gain).connect(ac.destination);
  src.start(ac.currentTime + start);
}

export const sfx = {
  /** أول تفاعل — بيفتح الـ AudioContext على الموبايل */
  unlock() {
    audio();
  },
  click() {
    tone(660, 0, 0.08, "square", 0.08);
  },
  boing() {
    tone(220, 0, 0.25, "sine", 0.25, 520);
  },
  tick() {
    tone(1200, 0, 0.03, "square", 0.05);
  },
  drumroll(seconds: number) {
    for (let t = 0; t < seconds; t += 0.06) noiseBurst(t, 0.05, 0.05 + (t / seconds) * 0.1);
  },
  ending(kind: EndingSound) {
    switch (kind) {
      case "fanfare":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, "triangle", 0.2));
        tone(1047, 0.5, 0.6, "triangle", 0.2);
        tone(784, 0.5, 0.6, "triangle", 0.12);
        break;
      case "sad-trombone":
        [392, 370, 349].forEach((f, i) => tone(f, i * 0.4, 0.38, "sawtooth", 0.12));
        tone(330, 1.2, 1.0, "sawtooth", 0.12, 300);
        break;
      case "ding":
        tone(1319, 0, 0.6, "sine", 0.25);
        tone(1760, 0.15, 0.8, "sine", 0.18);
        break;
      case "drumroll-hit":
        noiseBurst(0, 0.4, 0.3);
        tone(110, 0, 0.4, "sine", 0.4, 60);
        tone(880, 0.05, 0.5, "triangle", 0.15);
        break;
    }
  },
};
