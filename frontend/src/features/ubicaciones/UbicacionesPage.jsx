import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import {
  crearDepartamento,
  crearUbicacion,
  eliminarDepartamento,
  eliminarUbicacion,
  listarTodosDepartamentos,
  renombrarDepartamento,
  renombrarUbicacion,
} from "../../shared/api/ubicaciones";
import { mensajeDeError } from "../../shared/utils/errores";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-800 outline-none focus:border-fisc-600";

function mensajeError(err) {
  // unique_together (departamento, nombre) llega como non_field_errors.
  if (err.status === 400 && err.data?.non_field_errors) return "Ya existe una ubicación con ese nombre en este departamento.";
  return mensajeDeError(err, "No se pudo guardar. Intenta de nuevo.");
}

// Input con botones para crear un nombre nuevo; `onCrear` devuelve una promesa.
function FormNombre({ placeholder, etiquetaBoton, onCrear, onCancelar, inicial = "" }) {
  const [nombre, setNombre] = useState(inicial);
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
    <form onSubmit={enviar} className="space-y-1 flex-1">
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

// Nombre de un departamento o ubicación, con sus acciones de renombrar y
// eliminar (solo el Administrador). `clave` es "d:<id>" o "u:<id>".
function FilaNombre({ clave, nombre, icono, claseTexto, puedeEditar, estado, acciones, detalleBorrado }) {
  const { editando, setEditando, confirmando, setConfirmando, errorBorrado, setErrorBorrado } = estado;

  if (editando === clave) {
    return (
      <FormNombre
        inicial={nombre}
        placeholder="Nombre"
        etiquetaBoton="Guardar"
        onCancelar={() => setEditando(null)}
        onCrear={(nuevo) => acciones.renombrar(clave, nuevo)}
      />
    );
  }

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 ${claseTexto}`}>
          {icono} {nombre}
        </span>
        {puedeEditar && confirmando !== clave && (
          <span className="flex items-center gap-1 text-gray-400">
            <button onClick={() => { setEditando(clave); setConfirmando(null); }} title="Renombrar" aria-label={`Renombrar ${nombre}`} className="p-1 rounded hover:bg-gray-100 hover:text-gray-700">
              <Pencil size={14} />
            </button>
            <button onClick={() => { setConfirmando(clave); setErrorBorrado(""); setEditando(null); }} title="Eliminar" aria-label={`Eliminar ${nombre}`} className="p-1 rounded hover:bg-red-50 hover:text-red-700">
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </div>
      {confirmando === clave && (
        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-800 flex items-center justify-between gap-3 flex-wrap">
          <span>¿Eliminar «{nombre}»?{detalleBorrado}</span>
          <span className="flex gap-2">
            <button onClick={() => acciones.borrar(clave)} className="bg-red-700 text-white px-3 py-1 rounded-lg hover:bg-red-800">Sí, eliminar</button>
            <button onClick={() => { setConfirmando(null); setErrorBorrado(""); }} className="px-3 py-1 rounded-lg border border-red-200 bg-white text-gray-700">Cancelar</button>
          </span>
        </div>
      )}
      {confirmando === clave && errorBorrado && <p className="mt-1 text-xs text-red-700">{errorBorrado}</p>}
    </div>
  );
}

export default function UbicacionesPage() {
  const { role } = useRole();
  const puedeEditar = role === "Administrador";
  const [recarga, setRecarga] = useState(0);
  const [nuevoDepto, setNuevoDepto] = useState(false);
  const [deptoAbierto, setDeptoAbierto] = useState(null); // id del depto con el form de ubicación abierto
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [errorBorrado, setErrorBorrado] = useState("");

  const { data, error, cargando } = useApi(listarTodosDepartamentos, [recarga]);
  const departamentos = data ?? [];

  const refrescar = () => setRecarga((n) => n + 1);
  const estado = { editando, setEditando, confirmando, setConfirmando, errorBorrado, setErrorBorrado };
  const acciones = {
    async renombrar(clave, nombre) {
      const [tipo, id] = clave.split(":");
      await (tipo === "d" ? renombrarDepartamento : renombrarUbicacion)(id, nombre);
      setEditando(null);
      refrescar();
    },
    async borrar(clave) {
      const [tipo, id] = clave.split(":");
      try {
        await (tipo === "d" ? eliminarDepartamento : eliminarUbicacion)(id);
        setConfirmando(null);
        refrescar();
      } catch (err) {
        setErrorBorrado(mensajeDeError(err, "No se pudo eliminar."));
      }
    },
  };

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
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-start justify-between gap-3">
              <FilaNombre
                clave={`d:${d.id}`}
                nombre={d.nombre}
                claseTexto="text-sm font-medium text-gray-800"
                puedeEditar={puedeEditar}
                estado={estado}
                acciones={acciones}
                detalleBorrado=" Solo se puede si no tiene ubicaciones en uso."
              />
              {puedeEditar && deptoAbierto !== d.id && editando !== `d:${d.id}` && confirmando !== `d:${d.id}` && (
                <button onClick={() => setDeptoAbierto(d.id)} className="text-sm text-fisc-800 hover:underline whitespace-nowrap">+ Agregar ubicación</button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {d.ubicaciones.map((u) => (
                <div key={u.id} className="px-4 py-2 text-sm text-gray-600">
                  <FilaNombre
                    clave={`u:${u.id}`}
                    nombre={u.nombre}
                    icono={<MapPin size={13} className="text-gray-400" />}
                    claseTexto=""
                    puedeEditar={puedeEditar}
                    estado={estado}
                    acciones={acciones}
                    detalleBorrado=" Solo se puede si no tiene activos asignados."
                  />
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
