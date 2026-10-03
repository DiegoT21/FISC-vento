export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: ["bg-slate-100 text-slate-700 border-slate-200/70", "bg-slate-400"],
    good: ["bg-fisc-100 text-fisc-900 border-fisc-300/60", "bg-fisc-500"],
    warn: ["bg-amber-50 text-amber-800 border-amber-200/60", "bg-amber-500"],
    bad: ["bg-red-50 text-red-700 border-red-200/60", "bg-red-500"],
    info: ["bg-sky-50 text-sky-700 border-sky-200/60", "bg-sky-500"],
  };
  const [classes, dot] = tones[tone] ?? tones.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}
