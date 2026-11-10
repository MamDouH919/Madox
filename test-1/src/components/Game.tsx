"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scenario } from "@/data/scenario";
import { collectTags, longestRemaining, pickEnding, progressOf, questionMap, type Step } from "@/lib/engine";
import { sfx } from "@/lib/sound";
import { END, type Answer, type Ending } from "@/lib/types";
import { AnswerButton } from "./AnswerButton";
import { Backdrop } from "./Backdrop";
import { Celebration } from "./Celebration";

type Phase = "intro" | "question" | "loading" | "result";

const LOADING_STEP_MS = 850;

export function Game() {
  const questions = useMemo(() => questionMap(scenario), []);
  const remaining = useMemo(() => longestRemaining(scenario), []);

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentId, setCurrentId] = useState(scenario.startQuestionId);
  const [history, setHistory] = useState<Step[]>([]);
  const [reaction, setReaction] = useState<string | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [sound, setSound] = useState(true);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const question = questions.get(currentId)!;
  const progress = phase === "result" || phase === "loading" ? 1 : progressOf(history.length, currentId, remaining);

  const finish = useCallback(
    (finalHistory: Step[]) => {
      setPhase("loading");
      setLoadingIndex(0);
      const total = scenario.loadingMessages.length;
      if (sound) sfx.drumroll((total * LOADING_STEP_MS) / 1000);
      for (let i = 1; i < total; i++) later(() => setLoadingIndex(i), i * LOADING_STEP_MS);
      later(() => {
        const result = pickEnding(scenario, collectTags(scenario, finalHistory));
        setEnding(result);
        setPhase("result");
        if (sound && result.sound) sfx.ending(result.sound);
      }, total * LOADING_STEP_MS);
    },
    [sound],
  );

  const select = (answer: Answer) => {
    if (reaction) return;
    const nextHistory = [...history, { questionId: currentId, answerId: answer.id }];
    setHistory(nextHistory);

    const advance = () => {
      setReaction(null);
      if (answer.next === END) finish(nextHistory);
      else setCurrentId(answer.next);
    };

    if (answer.reaction) {
      setReaction(answer.reaction);
      later(advance, 1300);
    } else {
      later(advance, 180);
    }
  };

  const back = () => {
    if (reaction || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentId(prev.questionId);
  };

  const start = () => {
    sfx.unlock();
    if (sound) sfx.click();
    setPhase("question");
  };

  const restart = () => {
    clearTimers();
    setHistory([]);
    setCurrentId(scenario.startQuestionId);
    setReaction(null);
    setEnding(null);
    setPhase("intro");
  };

  const shareUrl = ending
    ? `https://wa.me/?text=${encodeURIComponent(scenario.share.whatsappText.replace("{title}", ending.title))}`
    : "";

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-4 pb-8">
      <Backdrop />

      {/* الهيدر: زرار الرجوع + مؤشر التقدم + الصوت */}
      <header className="flex items-center gap-3">
        {phase === "question" && history.length > 0 ? (
          <button type="button" onClick={back} className="icon-btn" aria-label="السؤال اللي فات">
            →
          </button>
        ) : (
          <span className="size-[46px] shrink-0" />
        )}
        <div className="flex-1 px-2">
          {phase !== "intro" && (
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress__fill" style={{ width: `${Math.max(8, progress * 100)}%` }}>
                <span className="progress__rider">{progress >= 1 ? "🏁" : "🐔"}</span>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            sfx.unlock();
            setSound((s) => !s);
          }}
          className="icon-btn"
          aria-label={sound ? "اقفل الصوت" : "شغّل الصوت"}
        >
          {sound ? "🔊" : "🔇"}
        </button>
      </header>

      <section className="flex flex-1 flex-col justify-center py-6">
        {phase === "intro" && (
          <div className="mt-20 flex flex-col items-center gap-6">
            <div className="card animate-pop-in w-full text-center">
              <div className="emoji-badge emoji-badge--lg">
                <span className="animate-float text-7xl">{scenario.intro.emoji}</span>
              </div>
              <h1 className="font-display title-gradient mt-6 text-6xl leading-tight">{scenario.intro.title}</h1>
              <p className="mt-3 text-xl font-bold leading-relaxed text-[var(--ink-soft)]">{scenario.intro.subtitle}</p>
              <button type="button" onClick={start} className="btn-3d btn-3d--center tone-pink animate-pulse-soft mt-8">
                {scenario.intro.startLabel}
              </button>
            </div>
            <span className="chip">⏱️ استبيان رسمي، بياخد أقل من دقيقة</span>
          </div>
        )}

        {phase === "question" && (
          <div key={currentId} className="flex flex-col gap-5">
            <div className="text-center">
              <span className="chip animate-pop-in">السؤال رقم {history.length + 1}</span>
            </div>
            <div className="card animate-pop-in mt-16 text-center">
              <div className="emoji-badge">
                <span className="animate-float text-6xl">{question.emoji}</span>
              </div>
              <h2 className="font-display mt-5 text-[2rem] leading-snug">{question.text}</h2>
              {question.subtitle && <p className="mt-2 text-base font-bold text-[var(--ink-soft)]">{question.subtitle}</p>}
            </div>
            <div className="mt-1 flex flex-col gap-4">
              {question.answers.map((a, i) => (
                <AnswerButton key={a.id} answer={a} index={i} sound={sound} disabled={!!reaction} onSelect={select} />
              ))}
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="card animate-pop-in mt-16 text-center">
            <div className="emoji-badge">
              <span className="animate-spin-slow text-6xl">🍳</span>
            </div>
            <p key={loadingIndex} className="animate-pop-in mt-8 text-xl font-black">
              {scenario.loadingMessages[loadingIndex]}
            </p>
            <div className="mt-6 flex justify-center gap-2.5">
              {scenario.loadingMessages.map((_, i) => (
                <span key={i} className={`dot ${i <= loadingIndex ? "dot--on" : ""}`} />
              ))}
            </div>
          </div>
        )}

        {phase === "result" && ending && (
          <div className="flex flex-col gap-5">
            <div
              className={`card relative mt-20 text-center animate-pop-in ${ending.effect === "shake" ? "animate-shake" : ""}`}
            >
              <div className="emoji-badge emoji-badge--lg">
                <span className="animate-bounce-in text-7xl">{ending.emoji}</span>
              </div>
              <div className="mt-5">
                <span className="ribbon">📢 النتيجة الرسمية</span>
              </div>
              <h2 className="font-display title-gradient mt-4 text-[2.1rem] leading-snug">{ending.title}</h2>
              <p className="mt-3 text-xl font-bold leading-loose">{ending.body}</p>
              {ending.stamp && <div className="stamp animate-stamp mx-auto mt-6 w-fit">{ending.stamp}</div>}
            </div>

            <button type="button" onClick={restart} className="btn-3d btn-3d--center tone-sun mt-2">
              نلعب تاني 🔁
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="btn-3d btn-3d--center tone-whatsapp !text-xl">
              ابعتي النتيجة على واتساب 📲
            </a>

            <details className="card card--tight mt-2 text-sm">
              <summary className="cursor-pointer font-black">📁 ملف القضية (إجاباتك)</summary>
              <ol className="mt-3 list-inside list-decimal space-y-1.5 text-[var(--ink-soft)]">
                {history.map((s) => {
                  const q = questions.get(s.questionId)!;
                  const a = q.answers.find((x) => x.id === s.answerId)!;
                  return (
                    <li key={s.questionId}>
                      {q.text} ← <b className="text-[var(--ink)]">{a.label}</b>
                    </li>
                  );
                })}
              </ol>
            </details>
          </div>
        )}
      </section>

      {reaction && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center px-4">
          <div className="reaction animate-pop-in">{reaction}</div>
        </div>
      )}

      {phase === "result" && ending?.effect && <Celebration effect={ending.effect} emoji={ending.emoji} />}
    </main>
  );
}
