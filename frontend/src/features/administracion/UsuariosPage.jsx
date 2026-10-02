import Badge from "../../shared/components/Badge";
import { USUARIOS } from "../../mocks/usuarios.mock";

export default function UsuariosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administración</h1>
          <p className="text-sm text-slate-500 mt-1">Usuarios y roles del sistema</p>
        </div>
        <button className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900">+ Nuevo usuario</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Nombre</th>
              <th className="text-left px-4 py-2 font-semibold">Usuario</th>
              <th className="text-left px-4 py-2 font-semibold">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {USUARIOS.map((u) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={u.id}>
                <td className="px-4 py-2.5 text-slate-800">{u.nombre}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{u.usuario}</td>
                <td className="px-4 py-2.5"><Badge tone="info">{u.rol}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
