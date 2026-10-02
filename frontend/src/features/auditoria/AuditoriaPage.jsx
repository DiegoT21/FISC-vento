import { LOGS } from "../../mocks/logs.mock";

export default function AuditoriaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500 mt-1">Bitácora de acciones del sistema</p>
      </div>
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
            {LOGS.map((l) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={l.id}>
                <td className="px-4 py-2.5 text-slate-800 font-mono text-xs">{l.usuario}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.accion}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{l.tabla}</td>
                <td className="px-4 py-2.5 text-slate-500">{l.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
