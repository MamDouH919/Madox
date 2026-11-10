/** خلفية متدرجة فيها بقع ضوء وإيموجيز أكل طايرة — أماكن ثابتة عشان مفيش اختلاف بين السيرفر والمتصفح */
const EMOJIS = [
  { e: "🍗", top: "6%", left: "8%", size: 44, delay: 0 },
  { e: "🍝", top: "14%", left: "78%", size: 38, delay: 1.2 },
  { e: "🥘", top: "36%", left: "4%", size: 34, delay: 2.4 },
  { e: "🍳", top: "48%", left: "86%", size: 40, delay: 0.6 },
  { e: "🧅", top: "66%", left: "10%", size: 32, delay: 1.8 },
  { e: "🐟", top: "78%", left: "80%", size: 42, delay: 3 },
  { e: "🍚", top: "90%", left: "30%", size: 36, delay: 0.9 },
  { e: "🥗", top: "26%", left: "46%", size: 28, delay: 2.1 },
];

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop__blob" style={{ width: 340, height: 340, top: "-8%", right: "-20%", background: "#ff3d7f" }} />
      <div
        className="backdrop__blob"
        style={{ width: 300, height: 300, bottom: "-6%", left: "-18%", background: "#ffb020", animationDelay: "-6s" }}
      />
      <div
        className="backdrop__blob"
        style={{ width: 260, height: 260, top: "40%", left: "30%", background: "#7c3aed", animationDelay: "-12s" }}
      />
      <div className="backdrop__grain" />
      {EMOJIS.map((x) => (
        <span
          key={x.e}
          className="backdrop__emoji"
          style={{ top: x.top, left: x.left, fontSize: x.size, animationDelay: `${x.delay}s` }}
        >
          {x.e}
        </span>
      ))}
    </div>
  );
}
