export default function StatCard({ label, value, tone, icon: Icon }) {
  const tones = {
    neutral: ["border-slate-200/80", "bg-slate-100 text-slate-600"],
    good: ["border-slate-200/80", "bg-fisc-100 text-fisc-800"],
    warn: ["border-slate-200/80", "bg-amber-50 text-amber-700"],
    bad: ["border-slate-200/80", "bg-red-50 text-red-700"],
  };
  const [border, iconTone] = tones[tone || "neutral"];
  return (
    <div className={`bg-white rounded-xl border ${border} shadow-sm p-4 flex-1 min-w-[170px]`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-slate-500">{label}</p>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconTone}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
