import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { ESTADO_ACTIVO, estadoTone } from "../../shared/utils/estado";
import { mensajeDeError } from "../../shared/utils/errores";
import { eliminarActivo, obtenerActivo } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
import ActivoTabs from "./components/ActivoTabs";

export default function ActivoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const { data: activo, error, cargando } = useApi(() => obtenerActivo(id), [id]);
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");

  // Misma regla que la API: editan Administrador y Custodio; borra solo el Administrador.
  const puedeEditar = role === "Administrador" || role === "Custodio";
  const puedeBorrar = role === "Administrador";

  async function borrar() {
    setErrorBorrado("");
    setBorrando(true);
    try {
      await eliminarActivo(id);
      navigate("/dashboard/activos");
    } catch (err) {
      setErrorBorrado(mensajeDeError(err, "No se pudo eliminar el activo."));
      setBorrando(false);
    }
  }

  const volver = (
    <button onClick={() => navigate("/dashboard/activos")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
      <ChevronLeft size={16} /> Volver al listado
    </button>
  );

  if (cargando) {
    return <div className="space-y-4">{volver}<p className="text-sm text-gray-500">Cargando...</p></div>;
  }

  if (error || !activo) {
    return (
      <div className="space-y-4">
        {volver}
        <p className="text-sm text-gray-500">
          {error?.status === 404 ? "Activo no encontrado." : "No se pudo cargar el activo. Intenta de nuevo."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {volver}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-medium text-gray-900">{activo.descripcion}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{activo.codigo}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={estadoTone(activo.estado)}>{ESTADO_ACTIVO[activo.estado] ?? activo.estado}</Badge>
            {puedeEditar && (
              <button onClick={() => navigate(`/dashboard/activos/${id}/editar`)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Pencil size={14} /> Editar
              </button>
            )}
            {puedeBorrar && !confirmando && (
              <button onClick={() => setConfirmando(true)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </div>

        {confirmando && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-800 flex items-center justify-between gap-3 flex-wrap">
            <span>¿Eliminar este activo? Esta acción no se puede deshacer.</span>
            <span className="flex gap-2">
              <button onClick={borrar} disabled={borrando} className="bg-red-700 text-white px-3 py-1.5 rounded-lg hover:bg-red-800 disabled:opacity-50">
                {borrando ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button onClick={() => { setConfirmando(false); setErrorBorrado(""); }} disabled={borrando} className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-gray-700">
                Cancelar
              </button>
            </span>
          </div>
        )}
        {errorBorrado && <p className="mt-2 text-sm text-red-700">{errorBorrado}</p>}

        <ActivoTabs activo={activo} />
      </div>
    </div>
  );
}
