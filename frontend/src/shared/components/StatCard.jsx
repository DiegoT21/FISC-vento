export default function StatCard({ label, value, tone }) {
  const tones = {
    neutral: "border-gray-200",
    warn: "border-amber-200",
    bad: "border-red-200",
    good: "border-emerald-200",
  };
  return (
    <div className={`bg-white rounded-lg border ${tones[tone || "neutral"]} p-4 flex-1 min-w-[140px]`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium text-gray-900">{value}</p>
    </div>
  );
}
