import { MapPin, Plus } from "lucide-react";
import ErrorState from "../../shared/components/ErrorState";
import { listDepartamentos } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";

export default function UbicacionesPage() {
  const { data, loading, error, reload } = useApi(listDepartamentos, []);
  const deptos = data?.results ?? data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ubicaciones</h1>
          <p className="text-sm text-slate-500 mt-1">Estructura por departamentos y espacios físicos</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30">
          <Plus className="w-4 h-4" /> Nueva ubicación
        </button>
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm"><ErrorState onRetry={reload} /></div>
      ) : loading && !data ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-28 rounded-xl bg-white border border-slate-200/80 animate-pulse" />)}
        </div>
      ) : deptos.length === 0 ? (
        <p className="text-sm text-slate-500">Aún no hay departamentos registrados.</p>
      ) : (
        <div className="space-y-3">
          {deptos.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/80 text-base font-semibold text-slate-800">{d.nombre}</div>
              <div className="divide-y divide-slate-100">
                {d.ubicaciones.map((u) => (
                  <div key={u.id} className="px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2 hover:bg-fisc-50/60 transition-colors">
                    <MapPin className="w-4 h-4 text-fisc-600" /> {u.nombre}
                  </div>
                ))}
                {d.ubicaciones.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Sin ubicaciones.</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
