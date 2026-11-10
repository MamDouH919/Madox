/**
 * أنواع البيانات الخاصة بالسيناريو.
 * عدّل المحتوى نفسه في src/data/scenario.ts — الملف ده بيعرّف الشكل بس.
 */

/** معرّف خاص معناه "خلصت الأسئلة، روح للنتيجة" */
export const END = "END" as const;

export type AnswerTrick =
  /** الزرار بيهرب لما تيجي تدوسي عليه، وبعد كام محاولة بيستسلم */
  | { type: "runaway"; dodges: number; surrenderText?: string }
  /** الزرار بيغيّر كلامه لما تدوسي عليه أول مرة، ولازم تدوسي تاني */
  | { type: "swap"; newLabel: string };

export interface Answer {
  id: string;
  label: string;
  emoji?: string;
  /** السؤال اللي بعده، أو END */
  next: string;
  /** تاجز بتتسجل لما الإجابة دي تتختار — النهايات بتعتمد عليها */
  tags?: string[];
  /** رد فعل كوميدي قصير بيظهر ثانية بعد الاختيار */
  reaction?: string;
  trick?: AnswerTrick;
}

export interface Question {
  id: string;
  text: string;
  emoji: string;
  subtitle?: string;
  answers: Answer[];
}

export type EndingEffect = "confetti" | "emoji-rain" | "shake";
export type EndingSound = "fanfare" | "sad-trombone" | "ding" | "drumroll-hit";

export interface EndingCondition {
  /** لازم كل التاجز دي تكون موجودة */
  all?: string[];
  /** لازم واحد منهم على الأقل يكون موجود */
  any?: string[];
  /** لازم ولا واحد منهم يكون موجود */
  none?: string[];
}

export interface Ending {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** ختم/ملاحظة صغيرة تحت النتيجة */
  stamp?: string;
  /** من غير شرط = نهاية عشوائية عامة ممكن تطلع لأي حد */
  when?: EndingCondition;
  /** كل ما الرقم يكبر، النهاية تاخد أولوية لما شرطها يتحقق (افتراضي 1 للمشروطة) */
  priority?: number;
  /** وزن الاختيار العشوائي بين النهايات اللي ليها نفس الأولوية (افتراضي 1) */
  weight?: number;
  effect?: EndingEffect;
  sound?: EndingSound;
}

export interface Scenario {
  intro: {
    emoji: string;
    title: string;
    subtitle: string;
    startLabel: string;
  };
  startQuestionId: string;
  questions: Question[];
  endings: Ending[];
  /** احتمال (0 → 1) إن تطلع نهاية عشوائية عامة حتى لو في نهاية مشروطة مناسبة */
  randomEndingChance: number;
  /** رسائل "جاري التحليل" اللي بتظهر قبل النتيجة */
  loadingMessages: string[];
  share: {
    /** النص اللي بيتبعت على واتساب؛ {title} بيتبدل بعنوان النتيجة */
    whatsappText: string;
  };
}
