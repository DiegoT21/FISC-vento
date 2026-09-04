import Badge from "../../shared/components/Badge";
import { PRESTAMOS } from "../../mocks/prestamos.mock";

export default function PrestamosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Préstamos</h1>
          <p className="text-sm text-gray-500">Activos prestados a personas de la facultad</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nuevo préstamo</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Activo</th>
              <th className="text-left px-4 py-2 font-medium">Persona</th>
              <th className="text-left px-4 py-2 font-medium">Fecha</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRESTAMOS.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 text-gray-800">{p.activo}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.persona}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.fecha}</td>
                <td className="px-4 py-2.5"><Badge tone={p.estado === "Activo" ? "info" : "good"}>{p.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
