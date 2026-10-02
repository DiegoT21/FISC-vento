import { AlertTriangle, ArrowLeftRight, Boxes, CheckCircle2, HandCoins, PauseCircle, Wrench } from "lucide-react";
import StatCard from "../../shared/components/StatCard";
import Badge from "../../shared/components/Badge";
import { obtenerResumen } from "../../shared/api/reportes";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const fmt = (n) => n.toLocaleString("es");
const plural = (n, uno, varios) => `${fmt(n)} ${n === 1 ? uno : varios}`;

// Cada pendiente se calcula a partir del resumen real; solo se muestran los
// que tienen casos.
function pendientes(r) {
  const lista = [];
  if (r.inoperativos > 0) {
    lista.push({ id: "inoperativos", texto: `${plural(r.inoperativos, "activo inoperativo", "activos inoperativos")}`, tono: "bad", etiqueta: "Inoperativo" });
  }
  if (r.traslados_pendientes > 0) {
    lista.push({ id: "traslados", texto: `${plural(r.traslados_pendientes, "traslado esperando autorización", "traslados esperando autorización")}`, tono: "info", etiqueta: "Pendiente" });
  }
  if (r.sin_responsable > 0) {
    lista.push({ id: "responsable", texto: `${plural(r.sin_responsable, "activo sin responsable asignado", "activos sin responsable asignado")}`, tono: "warn", etiqueta: "Revisar" });
  }
  if (r.sin_rfid > 0) {
    lista.push({ id: "rfid", texto: `${plural(r.sin_rfid, "activo sin etiqueta RFID", "activos sin etiqueta RFID")}`, tono: "neutral", etiqueta: "Sin etiqueta" });
  }
  return lista;
}

export default function DashboardPage() {
  const { role } = useRole();
  const { data: resumen, error, cargando } = useApi(obtenerResumen, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel principal</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen del inventario de la FISC — {role}</p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudo cargar el resumen. Intenta de nuevo.
        </p>
      )}
      {cargando && <p className="text-sm text-slate-500">Cargando...</p>}

      {resumen && (
        <>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total de activos" value={fmt(resumen.total)} icon={Boxes} />
            <StatCard label="Activos" value={fmt(resumen.activos)} tone="good" icon={CheckCircle2} />
            <StatCard label="Inactivos" value={fmt(resumen.inactivos)} tone="warn" icon={PauseCircle} />
            <StatCard label="Inoperativos" value={fmt(resumen.inoperativos)} tone="bad" icon={Wrench} />
            {resumen.traslados_pendientes !== null && (
              <StatCard label="Traslados pendientes" value={fmt(resumen.traslados_pendientes)} tone="warn" icon={ArrowLeftRight} />
            )}
            <StatCard label="Préstamos activos" value={fmt(resumen.prestamos_activos)} icon={HandCoins} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <p className="text-sm font-medium text-slate-900">Pendientes de atención</p>
            </div>
            <div className="divide-y divide-slate-100">
              {resumen.total === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">
                  Aún no hay activos registrados. Empieza en «Activos» con «Registrar activo».
                </p>
              ) : (
                pendientes(resumen).map((p) => (
                  <div key={p.id} className="px-4 py-3 text-sm text-slate-700 flex items-center justify-between">
                    <span>{p.texto}</span>
                    <Badge tone={p.tono}>{p.etiqueta}</Badge>
                  </div>
                ))
              )}
              {resumen.total > 0 && pendientes(resumen).length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" /> Todo en orden: no hay pendientes.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
