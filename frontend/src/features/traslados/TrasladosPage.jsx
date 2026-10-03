import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { autorizarTraslado, crearTraslado, listarTraslados } from "../../shared/api/traslados";
import { listarActivos } from "../../shared/api/activos";
import { listarTodosDepartamentos } from "../../shared/api/ubicaciones";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
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

function SolicitudModal({ onClose, onGuardado }) {
  const [activo, setActivo] = useState("");
  const [ubicacionDestino, setUbicacionDestino] = useState("");
  
  const [errores, setErrores] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Fetch data
  const activos = useApi(() => listarActivos({ page: 1, search: "" }), []);
  const departamentos = useApi(listarTodosDepartamentos, []);

  async function enviar(e) {
    e.preventDefault();
    setErrores(null);
    setErrorGeneral("");
    setGuardando(true);

    try {
      await crearTraslado({
        activo: Number(activo),
        ubicacion_destino: Number(ubicacionDestino),
      });
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.data) setErrores(err.data);
      else setErrorGeneral(mensajeDeError(err, "No se pudo crear la solicitud."));
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Nueva solicitud de traslado</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="traslado-form" onSubmit={enviar} className="space-y-4">
            <Campo label="Activo" requerido error={mensajeCampo(errores, "activo")}>
              <select required value={activo} onChange={(e) => setActivo(e.target.value)} disabled={activos.cargando} className={inputCls}>
                <option value="">Selecciona un activo...</option>
                {(activos.data?.results ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.descripcion}</option>
                ))}
              </select>
            </Campo>

            <Campo label="Ubicación de destino" requerido error={mensajeCampo(errores, "ubicacion_destino")}>
              <select required value={ubicacionDestino} onChange={(e) => setUbicacionDestino(e.target.value)} disabled={departamentos.cargando} className={inputCls}>
                <option value="">Selecciona un destino...</option>
                {(departamentos.data ?? []).map((d) => (
                  <optgroup key={d.id} label={d.nombre}>
                    {d.ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </optgroup>
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
          <button type="submit" form="traslado-form" disabled={guardando || activos.cargando || departamentos.cargando} className="bg-fisc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
            {guardando ? "Enviando..." : "Solicitar traslado"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrasladosPage() {
  const { role } = useRole();
  const puedeAutorizar = role === "Administrador" || role === "Custodio";

  const [recarga, setRecarga] = useState(0);
  const { data, error, cargando } = useApi(listarTraslados, [recarga]);
  const traslados = data?.results ?? [];

  const [modalAbierto, setModalAbierto] = useState(false);
  const [autorizando, setAutorizando] = useState(null); // id
  const [errorAccion, setErrorAccion] = useState("");

  async function handleAutorizar(id) {
    setErrorAccion("");
    setAutorizando(id);
    try {
      await autorizarTraslado(id);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorAccion(mensajeDeError(err, "No se pudo autorizar el traslado."));
    } finally {
      setAutorizando(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Traslados</h1>
          <p className="text-sm text-slate-500 mt-1">Solicitudes de traslado entre ubicaciones</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30">
          + Nueva solicitud
        </button>
      </div>

      {errorAccion && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {errorAccion}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los traslados.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
              <th className="text-left px-4 py-2 font-semibold">Activo</th>
              <th className="text-left px-4 py-2 font-semibold">Origen</th>
              <th className="text-left px-4 py-2 font-semibold">Destino</th>
              <th className="text-left px-4 py-2 font-semibold">Solicitado por</th>
              <th className="text-left px-4 py-2 font-semibold">Estado</th>
              {puedeAutorizar && <th className="text-right px-4 py-2 font-semibold w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {traslados.map((t) => (
              <tr className="hover:bg-fisc-50/60 transition-colors" key={t.id}>
                <td className="px-4 py-2.5 text-slate-800 font-medium">{t.activo_codigo}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.ubicacion_origen_nombre}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.ubicacion_destino_nombre}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{t.solicitado_por_username}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={t.estado === "AUTORIZADO" ? "good" : "warn"}>{t.estado}</Badge>
                </td>
                {puedeAutorizar && (
                  <td className="px-4 py-2.5 text-right">
                    {t.estado === "PENDIENTE" && (
                      <button
                        onClick={() => handleAutorizar(t.id)}
                        disabled={autorizando === t.id}
                        className="flex items-center gap-1 ml-auto text-xs font-medium text-fisc-700 hover:text-fisc-900 bg-fisc-50 hover:bg-fisc-100 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {autorizando === t.id ? "..." : <><CheckCircle size={14} /> Autorizar</>}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {cargando && traslados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
            )}
            {!cargando && traslados.length === 0 && !error && (
              <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">No hay solicitudes de traslado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <SolicitudModal
          onClose={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false);
            setRecarga((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
