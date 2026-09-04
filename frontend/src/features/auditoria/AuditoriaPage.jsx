import { LOGS } from "../../mocks/logs.mock";

export default function AuditoriaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500">Bitácora de acciones del sistema</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Usuario</th>
              <th className="text-left px-4 py-2 font-medium">Acción</th>
              <th className="text-left px-4 py-2 font-medium">Tabla</th>
              <th className="text-left px-4 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {LOGS.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 text-gray-800 font-mono text-xs">{l.usuario}</td>
                <td className="px-4 py-2.5 text-gray-600">{l.accion}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{l.tabla}</td>
                <td className="px-4 py-2.5 text-gray-500">{l.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
