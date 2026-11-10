/**
 * بيمشي على كل المسارات الممكنة في السيناريو ويتأكد إن كلها بتوصل لنهاية.
 * التشغيل:  npm run validate      (أو  npm run validate -- --verbose  لعرض كل مسار)
 */
import { scenario } from "../src/data/scenario";
import { collectTags, matches, pickEnding, questionMap, validateScenario } from "../src/lib/engine";
import { END } from "../src/lib/types";

const verbose = process.argv.includes("--verbose");
const { errors, warnings, paths } = validateScenario(scenario);
const map = questionMap(scenario);

const label = (qId: string, aId: string) => map.get(qId)!.answers.find((a) => a.id === aId)!.label;

let failures = 0;
const endingHits = new Map<string, number>();

for (const path of paths) {
  const tags = collectTags(scenario, path);
  // rng = 0.99 → مفيش عشوائية: بيطلع النهاية المشروطة لو موجودة
  const deterministic = pickEnding(scenario, tags, () => 0.99);
  // rng = 0 → بيجبر النهاية العشوائية العامة
  const random = pickEnding(scenario, tags, () => 0);

  if (!deterministic || !random) failures++;
  if (random.when && !matches(random.when, tags)) failures++;
  endingHits.set(deterministic.id, (endingHits.get(deterministic.id) ?? 0) + 1);

  const last = path[path.length - 1];
  const lastAnswer = map.get(last.questionId)!.answers.find((a) => a.id === last.answerId)!;
  if (lastAnswer.next !== END) failures++;

  if (verbose) {
    console.log(`\n• ${path.map((s) => label(s.questionId, s.answerId)).join(" ← ")}`);
    console.log(`  تاجز: [${[...tags].join(", ")}]  ⇒  ${deterministic.id}`);
  }
}

// اختبار صريح لفرعي "آه" و"لأ" في أول سؤال
for (const first of ["yes", "no"]) {
  const count = paths.filter((p) => p[0].answerId === first).length;
  console.log(`مسارات تبدأ بـ "${label(scenario.startQuestionId, first)}": ${count}`);
  if (count === 0) failures++;
}

console.log(`\nعدد الأسئلة: ${scenario.questions.length}`);
console.log(`عدد المسارات الكاملة: ${paths.length}`);
console.log(`النهايات اللي ممكن تطلع (بدون عشوائية):`);
for (const [id, n] of [...endingHits].sort((a, b) => b[1] - a[1])) console.log(`  ${id}: ${n} مسار`);

warnings.forEach((w) => console.warn(`⚠️  ${w}`));
errors.forEach((e) => console.error(`❌ ${e}`));

if (errors.length || failures) {
  console.error(`\n❌ فشل التحقق (${errors.length} أخطاء، ${failures} مسارات فيها مشكلة)`);
  process.exit(1);
}
console.log("\n✅ كل المسارات سليمة وبتوصل لنهاية");
