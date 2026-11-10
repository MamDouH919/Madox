"use client";

import { useState } from "react";
import type { Answer } from "@/lib/types";
import { sfx } from "@/lib/sound";

const PALETTE = ["tone-green", "tone-pink", "tone-blue", "tone-orange"];

interface Props {
  answer: Answer;
  index: number;
  sound: boolean;
  disabled: boolean;
  onSelect: (answer: Answer) => void;
}

export function AnswerButton({ answer, index, sound, disabled, onSelect }: Props) {
  const trick = answer.trick;
  const [dodgesLeft, setDodgesLeft] = useState(trick?.type === "runaway" ? trick.dodges : 0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [swapped, setSwapped] = useState(false);

  const surrendered = trick?.type === "runaway" && dodgesLeft === 0;
  const label = swapped && trick?.type === "swap" ? trick.newLabel : surrendered && trick.surrenderText ? trick.surrenderText : answer.label;

  const dodge = () => {
    if (dodgesLeft <= 0) return false;
    // الزرار بيهرب لمكان عشوائي، وكل ما المحاولات تقل بيبعد أقل
    // الزرار عرضه كامل، فالهروب أغلبه لفوق وتحت عشان ميخرجش برا الشاشة
    const range = 40 + dodgesLeft * 20;
    const x = (Math.random() * 2 - 1) * 24;
    const y = (Math.random() < 0.5 ? -1 : 1) * (range * 0.6 + Math.random() * range * 0.4);
    setOffset({ x, y });
    setDodgesLeft((d) => d - 1);
    if (sound) sfx.boing();
    return true;
  };

  const handleClick = () => {
    if (disabled) return;
    if (dodge()) return;
    if (trick?.type === "swap" && !swapped) {
      setSwapped(true);
      if (sound) sfx.boing();
      return;
    }
    if (sound) sfx.click();
    onSelect(answer);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={(e) => e.pointerType === "mouse" && !disabled && dodge()}
      disabled={disabled}
      style={{
        // translate منفصلة عن transform عشان متتعارضش مع أنيميشن الظهور
        translate: `${offset.x}px ${offset.y}px`,
        animationDelay: `${120 + index * 90}ms`,
      }}
      className={`btn-3d animate-pop-in ${PALETTE[index % PALETTE.length]} ${dodgesLeft > 0 ? "z-10" : ""} ${swapped || surrendered ? "animate-wiggle" : ""}`}
    >
      {answer.emoji && <span className="btn-3d__icon">{answer.emoji}</span>}
      <span className="flex-1 text-start">{label}</span>
    </button>
  );
}
