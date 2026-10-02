import { AlertTriangle, Boxes, CheckCircle2, PauseCircle, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../../shared/components/StatCard";
import Badge from "../../shared/components/Badge";
import ErrorState from "../../shared/components/ErrorState";
import { getResumen } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const fmt = (n) => (n ?? 0).toLocaleString("es-PA");

export default function DashboardPage() {
  const { role } = useRole();
  const { data, loading, error, reload } = useApi(getResumen, []);
  const valor = (n) => (loading || !data ? "—" : fmt(n));

  const pendientes = data
    ? [
        data.por_estado.INOPERATIVO > 0 && {
          texto: `${fmt(data.por_estado.INOPERATIVO)} activos inoperativos requieren revisión`,
          tone: "bad",
          etiqueta: "Inoperativo",
        },
        data.por_estado.INACTIVO > 0 && {
          texto: `${fmt(data.por_estado.INACTIVO)} activos inactivos en el inventario`,
          tone: "warn",
          etiqueta: "Inactivo",
        },
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel principal</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen del inventario de la FISC — {role}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total de activos" value={valor(data?.total)} icon={Boxes} />
        <StatCard label="Activos" value={valor(data?.por_estado.ACTIVO)} tone="good" icon={CheckCircle2} />
        <StatCard label="Inactivos" value={valor(data?.por_estado.INACTIVO)} tone="warn" icon={PauseCircle} />
        <StatCard label="Inoperativos" value={valor(data?.por_estado.INOPERATIVO)} tone="bad" icon={Wrench} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-base font-semibold text-slate-800">Pendientes de atención</p>
        </div>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="divide-y divide-slate-100">
            {pendientes.map((p) => (
              <Link
                key={p.etiqueta}
                to={`/dashboard/activos`}
                className="px-4 py-3 text-sm text-slate-700 flex items-center justify-between gap-4 hover:bg-fisc-50/60 transition-colors"
              >
                <span>{p.texto}</span>
                <Badge tone={p.tone}>{p.etiqueta}</Badge>
              </Link>
            ))}
            {data && pendientes.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">Todo en orden: no hay activos que requieran atención.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
