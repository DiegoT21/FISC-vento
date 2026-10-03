import { useApi } from "../../shared/hooks/useApi";
import { listarLogsAuditoria } from "../../shared/api/auditoria";

export default function AuditoriaPage() {
  const { data, error, cargando } = useApi(() => listarLogsAuditoria({ page: 1 }), []);
  const logs = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500 mt-1">Bitácora de acciones del sistema</p>
      </div>
      
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los registros de auditoría.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Usuario</th>
              <th className="text-left px-4 py-2 font-semibold">Acción</th>
              <th className="text-left px-4 py-2 font-semibold">Tabla</th>
              <th className="text-left px-4 py-2 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={l.id}>
                <td className="px-4 py-2.5 text-slate-800 font-mono text-xs">{l.usuario}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.accion}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{l.tabla}</td>
                <td className="px-4 py-2.5 text-slate-500">{new Date(l.fecha).toLocaleString()}</td>
              </tr>
            ))}
            {cargando && logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
            )}
            {!cargando && logs.length === 0 && !error && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">No hay registros de auditoría.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
