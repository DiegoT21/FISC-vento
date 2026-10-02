import Badge from "../../shared/components/Badge";
import { TRASLADOS } from "../../mocks/traslados.mock";

export default function TrasladosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Traslados</h1>
          <p className="text-sm text-slate-500 mt-1">Solicitudes de traslado entre ubicaciones</p>
        </div>
        <button className="bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30">+ Nueva solicitud</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Activo</th>
              <th className="text-left px-4 py-2 font-semibold">Origen</th>
              <th className="text-left px-4 py-2 font-semibold">Destino</th>
              <th className="text-left px-4 py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRASLADOS.map((t) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={t.id}>
                <td className="px-4 py-2.5 text-slate-800">{t.activo}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.origen}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.destino}</td>
                <td className="px-4 py-2.5"><Badge tone={t.estado === "Autorizado" ? "good" : "warn"}>{t.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
