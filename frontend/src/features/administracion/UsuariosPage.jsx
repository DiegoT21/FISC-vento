import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import Badge from "../../shared/components/Badge";
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
} from "../../shared/api/usuarios";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
import { mensajeDeError } from "../../shared/utils/errores";

const ROLES = {
  ADMINISTRADOR: "Administrador",
  CUSTODIO: "Custodio",
  AUDITOR: "Auditor",
};

const VACIO = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  rol: "CUSTODIO",
  is_active: true,
};

const inputCls = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 outline-none focus:border-fisc-600";

function Campo({ label, requerido, error, ayuda, children }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">
        {label}
        {requerido && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {ayuda && !error && <p className="text-xs text-slate-400 mt-1">{ayuda}</p>}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </label>
  );
}

const mensajeCampo = (errores, campo) => errores?.[campo]?.join(" ");

function UsuarioModal({ usuario, onClose, onGuardado }) {
  const editando = Boolean(usuario);
  const [form, setForm] = useState(editando ? { ...VACIO, ...usuario, password: "" } : VACIO);
  const [errores, setErrores] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (e) =>
    setForm((f) => ({
      ...f,
      [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  async function enviar(e) {
    e.preventDefault();
    setErrores(null);
    setErrorGeneral("");
    setGuardando(true);

    const datos = { ...form };
    if (editando && !datos.password) {
      delete datos.password;
    }

    try {
      if (editando) {
        await actualizarUsuario(usuario.id, datos);
      } else {
        await crearUsuario(datos);
      }
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.data) setErrores(err.data);
      else setErrorGeneral(mensajeDeError(err, "No se pudo guardar el usuario."));
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{editando ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="user-form" onSubmit={enviar} className="space-y-4">
            <Campo label="Usuario UTP" requerido error={mensajeCampo(errores, "username")} ayuda="Identificador único, sin @utp.ac.pa">
              <input required maxLength={150} value={form.username} onChange={set("username")} className={inputCls} />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Nombre" requerido error={mensajeCampo(errores, "first_name")}>
                <input required maxLength={150} value={form.first_name} onChange={set("first_name")} className={inputCls} />
              </Campo>
              <Campo label="Apellido" requerido error={mensajeCampo(errores, "last_name")}>
                <input required maxLength={150} value={form.last_name} onChange={set("last_name")} className={inputCls} />
              </Campo>
            </div>

            <Campo label="Correo electrónico" requerido error={mensajeCampo(errores, "email")}>
              <input required type="email" maxLength={254} value={form.email} onChange={set("email")} className={inputCls} />
            </Campo>

            <Campo
              label="Contraseña"
              requerido={!editando}
              error={mensajeCampo(errores, "password")}
              ayuda={editando ? "Déjala en blanco para mantener la actual." : ""}
            >
              <input type="password" required={!editando} value={form.password} onChange={set("password")} className={inputCls} />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Rol" requerido error={mensajeCampo(errores, "rol")}>
                <select required value={form.rol} onChange={set("rol")} className={inputCls}>
                  {Object.entries(ROLES).map(([valor, texto]) => (
                    <option key={valor} value={valor}>{texto}</option>
                  ))}
                </select>
              </Campo>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="rounded border-slate-300 text-fisc-600 focus:ring-fisc-600 w-4 h-4" />
                  Usuario activo
                </label>
              </div>
            </div>

            {errores?.non_field_errors && (
              <p className="text-sm text-red-700">{errores.non_field_errors.join(" ")}</p>
            )}
            {errorGeneral && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorGeneral}</p>
            )}
          </form>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-white bg-slate-50">
            Cancelar
          </button>
          <button type="submit" form="user-form" disabled={guardando} className="bg-fisc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { role } = useRole();
  const esAdmin = role === "Administrador";
  
  const [recarga, setRecarga] = useState(0);
  const { data, error, cargando } = useApi(listarUsuarios, [recarga]);
  const usuarios = data?.results ?? [];

  const [modalUsuario, setModalUsuario] = useState(null); // 'nuevo' o { usuario }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administración</h1>
          <p className="text-sm text-slate-500 mt-1">Usuarios y roles del sistema</p>
        </div>
        {esAdmin && (
          <button onClick={() => setModalUsuario("nuevo")} className="bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30">
            + Nuevo usuario
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los usuarios.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Nombre</th>
              <th className="text-left px-4 py-2 font-semibold">Usuario</th>
              <th className="text-left px-4 py-2 font-semibold">Rol</th>
              <th className="text-left px-4 py-2 font-semibold">Estado</th>
              {esAdmin && <th className="text-right px-4 py-2 font-semibold w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={u.id}>
                <td className="px-4 py-2.5 text-slate-800">
                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : "-"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={u.rol === "ADMINISTRADOR" ? "warn" : u.rol === "AUDITOR" ? "good" : "info"}>
                    {ROLES[u.rol] ?? u.rol}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={u.is_active ? "good" : "neutral"}>
                    {u.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                {esAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setModalUsuario(u)}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar usuario"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {cargando && usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
            )}
            {!cargando && usuarios.length === 0 && !error && (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">No hay usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalUsuario && (
        <UsuarioModal
          usuario={modalUsuario === "nuevo" ? null : modalUsuario}
          onClose={() => setModalUsuario(null)}
          onGuardado={() => {
            setModalUsuario(null);
            setRecarga((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
