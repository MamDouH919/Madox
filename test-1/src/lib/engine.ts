import { END, type Ending, type EndingCondition, type Question, type Scenario } from "./types";

export interface Step {
  questionId: string;
  answerId: string;
}

export function questionMap(scenario: Scenario): Map<string, Question> {
  return new Map(scenario.questions.map((q) => [q.id, q]));
}

/** كل التاجز اللي اتجمعت من الإجابات لحد دلوقتي */
export function collectTags(scenario: Scenario, history: Step[]): Set<string> {
  const map = questionMap(scenario);
  const tags = new Set<string>();
  for (const step of history) {
    const answer = map.get(step.questionId)?.answers.find((a) => a.id === step.answerId);
    answer?.tags?.forEach((t) => tags.add(t));
  }
  return tags;
}

export function matches(cond: EndingCondition | undefined, tags: Set<string>): boolean {
  if (!cond) return true;
  if (cond.all && !cond.all.every((t) => tags.has(t))) return false;
  if (cond.any && !cond.any.some((t) => tags.has(t))) return false;
  if (cond.none && cond.none.some((t) => tags.has(t))) return false;
  return true;
}

function weightedPick<T extends { weight?: number }>(items: T[], rng: () => number): T {
  const total = items.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

/**
 * اختيار النهاية:
 * 1. النهايات المشروطة اللي شرطها اتحقق — بناخد اللي ليها أعلى أولوية.
 * 2. بنسبة randomEndingChance (أو لو مفيش مشروطة اتحققت) بنختار نهاية عامة عشوائية.
 */
export function pickEnding(scenario: Scenario, tags: Set<string>, rng: () => number = Math.random): Ending {
  const generic = scenario.endings.filter((e) => !e.when);
  const conditional = scenario.endings.filter((e) => e.when && matches(e.when, tags));

  if (conditional.length === 0 || (generic.length > 0 && rng() < scenario.randomEndingChance)) {
    return weightedPick(generic.length ? generic : scenario.endings, rng);
  }

  const top = Math.max(...conditional.map((e) => e.priority ?? 1));
  return weightedPick(
    conditional.filter((e) => (e.priority ?? 1) === top),
    rng,
  );
}

/** أطول عدد أسئلة متبقي من السؤال ده (شامله) — بيستخدم في مؤشر التقدم */
export function longestRemaining(scenario: Scenario): Map<string, number> {
  const map = questionMap(scenario);
  const memo = new Map<string, number>();
  const visit = (id: string): number => {
    if (id === END) return 0;
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const q = map.get(id);
    if (!q) return 0;
    memo.set(id, 1); // حماية من الحلقات لو السيناريو فيه غلط
    const depth = 1 + Math.max(...q.answers.map((a) => visit(a.next)));
    memo.set(id, depth);
    return depth;
  };
  scenario.questions.forEach((q) => visit(q.id));
  return memo;
}

/** نسبة التقدم من 0 لـ 1 */
export function progressOf(answeredCount: number, currentId: string | null, remaining: Map<string, number>): number {
  if (!currentId) return 1;
  const left = remaining.get(currentId) ?? 1;
  return answeredCount / (answeredCount + left);
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  /** كل المسارات الممكنة من البداية للنهاية */
  paths: Step[][];
}

/**
 * بيتأكد إن السيناريو سليم:
 * - كل next بيشاور على سؤال موجود أو END
 * - مفيش حلقات لا نهائية
 * - مفيش أسئلة يتيمة محدش بيوصلها
 * - كل مسار بيوصل لنهاية واحدة على الأقل
 */
export function validateScenario(scenario: Scenario): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const map = questionMap(scenario);

  const ids = scenario.questions.map((q) => q.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) errors.push(`أسئلة متكررة: ${[...new Set(dupes)].join(", ")}`);

  const endingIds = scenario.endings.map((e) => e.id);
  const dupeEndings = endingIds.filter((id, i) => endingIds.indexOf(id) !== i);
  if (dupeEndings.length) errors.push(`نهايات متكررة: ${[...new Set(dupeEndings)].join(", ")}`);

  if (!map.has(scenario.startQuestionId)) errors.push(`سؤال البداية "${scenario.startQuestionId}" مش موجود`);
  if (!scenario.endings.some((e) => !e.when)) warnings.push("مفيش ولا نهاية عامة (من غير شرط)");

  for (const q of scenario.questions) {
    if (q.answers.length === 0) errors.push(`السؤال "${q.id}" مالوش إجابات`);
    for (const a of q.answers) {
      if (a.next !== END && !map.has(a.next)) errors.push(`"${q.id}" → "${a.id}" بيشاور على سؤال مش موجود "${a.next}"`);
    }
  }
  if (errors.length) return { errors, warnings, paths: [] };

  const paths: Step[][] = [];
  const visited = new Set<string>();
  const walk = (id: string, path: Step[], onPath: Set<string>) => {
    if (onPath.has(id)) {
      errors.push(`حلقة لا نهائية: ${[...onPath, id].join(" → ")}`);
      return;
    }
    visited.add(id);
    const q = map.get(id)!;
    const nextOnPath = new Set(onPath).add(id);
    for (const a of q.answers) {
      const step = { questionId: id, answerId: a.id };
      if (a.next === END) paths.push([...path, step]);
      else walk(a.next, [...path, step], nextOnPath);
    }
  };
  if (map.has(scenario.startQuestionId)) walk(scenario.startQuestionId, [], new Set());

  for (const id of ids) if (!visited.has(id)) warnings.push(`السؤال "${id}" محدش بيوصله`);

  const reachedEndings = new Set<string>();
  for (const path of paths) {
    const tags = collectTags(scenario, path);
    const candidates = scenario.endings.filter((e) => matches(e.when, tags));
    if (candidates.length === 0) {
      errors.push(`المسار ${path.map((s) => s.answerId).join(" → ")} مالوش نهاية`);
    }
    candidates.filter((e) => e.when).forEach((e) => reachedEndings.add(e.id));
  }
  for (const e of scenario.endings) {
    if (e.when && !reachedEndings.has(e.id)) warnings.push(`النهاية "${e.id}" مستحيل تطلع من أي مسار`);
  }

  return { errors, warnings, paths };
}
