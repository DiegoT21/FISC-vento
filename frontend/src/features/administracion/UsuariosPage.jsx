import Badge from "../../shared/components/Badge";
import { USUARIOS } from "../../mocks/usuarios.mock";

export default function UsuariosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Administración</h1>
          <p className="text-sm text-gray-500">Usuarios y roles del sistema</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nuevo usuario</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Nombre</th>
              <th className="text-left px-4 py-2 font-medium">Usuario</th>
              <th className="text-left px-4 py-2 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {USUARIOS.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5 text-gray-800">{u.nombre}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{u.usuario}</td>
                <td className="px-4 py-2.5"><Badge tone="info">{u.rol}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
