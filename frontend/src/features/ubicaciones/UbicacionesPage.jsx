import { useState } from "react";
import { MapPin } from "lucide-react";
import { crearDepartamento, crearUbicacion, listarTodosDepartamentos } from "../../shared/api/ubicaciones";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-800 outline-none focus:border-fisc-600";

// Los errores de DRF llegan como { campo: ["mensaje"] }; lo mostramos tal cual.
function mensajeError(err) {
  // unique_together (departamento, nombre) llega como non_field_errors.
  if (err.status === 400 && err.data?.non_field_errors) return "Ya existe una ubicación con ese nombre en este departamento.";
  if (err.status === 400 && err.data) return Object.values(err.data).flat().join(" ");
  if (err.status === 403) return "No tienes permiso para hacer esto.";
  return "No se pudo guardar. Intenta de nuevo.";
}

// Input con botones para crear un nombre nuevo; `onCrear` devuelve una promesa.
function FormNombre({ placeholder, etiquetaBoton, onCrear, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await onCrear(nombre.trim());
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-1">
      <div className="flex gap-2">
        <input autoFocus required maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={placeholder} className={`${inputCls} flex-1`} />
        <button type="submit" disabled={guardando} className="bg-fisc-800 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
          {guardando ? "Guardando..." : etiquetaBoton}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </form>
  );
}

export default function UbicacionesPage() {
  const { role } = useRole();
  const puedeEditar = role === "Administrador";
  const [recarga, setRecarga] = useState(0);
  const [nuevoDepto, setNuevoDepto] = useState(false);
  const [deptoAbierto, setDeptoAbierto] = useState(null); // id del depto con el form de ubicación abierto

  const { data, error, cargando } = useApi(listarTodosDepartamentos, [recarga]);
  const departamentos = data ?? [];

  const refrescar = () => setRecarga((n) => n + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Ubicaciones</h1>
          <p className="text-sm text-gray-500">Estructura por departamentos y espacios físicos</p>
        </div>
        {puedeEditar && !nuevoDepto && (
          <button onClick={() => setNuevoDepto(true)} className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900">
            + Nuevo departamento
          </button>
        )}
      </div>

      {nuevoDepto && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <FormNombre
            placeholder="Nombre del departamento"
            etiquetaBoton="Crear departamento"
            onCancelar={() => setNuevoDepto(false)}
            onCrear={async (nombre) => {
              await crearDepartamento(nombre);
              setNuevoDepto(false);
              refrescar();
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar las ubicaciones. Intenta de nuevo.
        </p>
      )}
      {cargando && !data && <p className="text-sm text-gray-500">Cargando...</p>}
      {!cargando && !error && departamentos.length === 0 && (
        <p className="text-sm text-gray-500">
          Aún no hay departamentos.{puedeEditar ? " Crea el primero con «+ Nuevo departamento»." : ""}
        </p>
      )}

      <div className="space-y-3">
        {departamentos.map((d) => (
          <div key={d.id} className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{d.nombre}</span>
              {puedeEditar && deptoAbierto !== d.id && (
                <button onClick={() => setDeptoAbierto(d.id)} className="text-sm text-fisc-800 hover:underline">+ Agregar ubicación</button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {d.ubicaciones.map((u) => (
                <div key={u.id} className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400" /> {u.nombre}
                </div>
              ))}
              {d.ubicaciones.length === 0 && deptoAbierto !== d.id && (
                <div className="px-4 py-2 text-sm text-gray-400">Sin ubicaciones todavía.</div>
              )}
              {deptoAbierto === d.id && (
                <div className="px-4 py-3">
                  <FormNombre
                    placeholder="Oficina, salón o laboratorio"
                    etiquetaBoton="Agregar"
                    onCancelar={() => setDeptoAbierto(null)}
                    onCrear={async (nombre) => {
                      await crearUbicacion(d.id, nombre);
                      setDeptoAbierto(null);
                      refrescar();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
