import { useState } from "react";
import { X } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { crearPrestamo, listarPrestamos } from "../../shared/api/prestamos";
import { listarActivos } from "../../shared/api/activos";
import { listarUsuarios } from "../../shared/api/usuarios";
import { useApi } from "../../shared/hooks/useApi";
import { mensajeDeError } from "../../shared/utils/errores";

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

function PrestamoModal({ onClose, onGuardado }) {
  const [activo, setActivo] = useState("");
  const [prestadoA, setPrestadoA] = useState("");
  
  const [errores, setErrores] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const activos = useApi(() => listarActivos({ page: 1, search: "" }), []);
  const usuarios = useApi(() => listarUsuarios({ page: 1 }), []);

  async function enviar(e) {
    e.preventDefault();
    setErrores(null);
    setErrorGeneral("");
    setGuardando(true);

    try {
      await crearPrestamo({
        activo: Number(activo),
        prestado_a: Number(prestadoA),
      });
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.data) setErrores(err.data);
      else setErrorGeneral(mensajeDeError(err, "No se pudo registrar el préstamo."));
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Nuevo Préstamo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="prestamo-form" onSubmit={enviar} className="space-y-4">
            <Campo label="Activo" requerido error={mensajeCampo(errores, "activo")}>
              <select required value={activo} onChange={(e) => setActivo(e.target.value)} disabled={activos.cargando} className={inputCls}>
                <option value="">Selecciona un activo...</option>
                {(activos.data?.results ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.descripcion}</option>
                ))}
              </select>
            </Campo>

            <Campo label="Prestar a (Usuario)" requerido error={mensajeCampo(errores, "prestado_a")}>
              <select required value={prestadoA} onChange={(e) => setPrestadoA(e.target.value)} disabled={usuarios.cargando} className={inputCls}>
                <option value="">Selecciona a quién...</option>
                {(usuarios.data?.results ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.username})</option>
                ))}
              </select>
            </Campo>

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
          <button type="submit" form="prestamo-form" disabled={guardando || activos.cargando || usuarios.cargando} className="bg-fisc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrestamosPage() {
  const [recarga, setRecarga] = useState(0);
  const { data, error, cargando } = useApi(() => listarPrestamos({ page: 1 }), [recarga]);
  const prestamos = data?.results ?? [];
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Préstamos</h1>
          <p className="text-sm text-slate-500 mt-1">Activos prestados a personas de la facultad</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30">
          + Nuevo préstamo
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los préstamos.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Activo</th>
              <th className="text-left px-4 py-2 font-semibold">Persona</th>
              <th className="text-left px-4 py-2 font-semibold">Fecha</th>
              <th className="text-left px-4 py-2 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prestamos.map((p) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={p.id}>
                <td className="px-4 py-2.5 text-slate-800 font-medium">{p.activo_codigo}</td>
                <td className="px-4 py-2.5 text-slate-600">{p.prestado_a_nombre}</td>
                <td className="px-4 py-2.5 text-slate-500">{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={p.estado === "ACTIVO" ? "info" : "good"}>{p.estado}</Badge>
                </td>
              </tr>
            ))}
            {cargando && prestamos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
            )}
            {!cargando && prestamos.length === 0 && !error && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">No hay préstamos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <PrestamoModal onClose={() => setModal(false)} onGuardado={() => {
          setModal(false);
          setRecarga((n) => n + 1);
        }} />
      )}
    </div>
  );
}
