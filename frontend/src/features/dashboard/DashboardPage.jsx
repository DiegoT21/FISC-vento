import { AlertTriangle } from "lucide-react";
import StatCard from "../../shared/components/StatCard";
import Badge from "../../shared/components/Badge";
import { useRole } from "../../shared/hooks/useRole";

export default function DashboardPage() {
  const { role } = useRole();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Panel principal</h1>
        <p className="text-sm text-gray-500">Resumen del inventario de la FISC — {role}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total de activos" value="8,687" />
        <StatCard label="En uso" value="5,928" tone="good" />
        <StatCard label="Dañados" value="600" tone="bad" />
        <StatCard label="Traslados pendientes" value="3" tone="warn" />
        <StatCard label="Préstamos activos" value="12" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-sm font-medium text-gray-900">Pendientes de atención</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>2,185 activos sin estatus definido en el inventario</span>
            <Badge tone="warn">Revisar</Badge>
          </div>
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>1 activo marcado como EXTRAVIADO — Router Cisco 2900</span>
            <Badge tone="bad">Extraviado</Badge>
          </div>
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>Traslado de CPU Dell OptiPlex 3080 esperando autorización</span>
            <Badge tone="info">Pendiente</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
