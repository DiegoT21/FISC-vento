import Badge from "../../shared/components/Badge";
import { TRASLADOS } from "../../mocks/traslados.mock";

export default function TrasladosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Traslados</h1>
          <p className="text-sm text-gray-500">Solicitudes de traslado entre ubicaciones</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nueva solicitud</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Activo</th>
              <th className="text-left px-4 py-2 font-medium">Origen</th>
              <th className="text-left px-4 py-2 font-medium">Destino</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TRASLADOS.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5 text-gray-800">{t.activo}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.origen}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.destino}</td>
                <td className="px-4 py-2.5"><Badge tone={t.estado === "Autorizado" ? "good" : "warn"}>{t.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
