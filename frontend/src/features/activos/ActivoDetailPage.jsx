import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { ESTADO_ACTIVO, estadoTone } from "../../shared/utils/estado";
import { obtenerActivo } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import ActivoTabs from "./components/ActivoTabs";

export default function ActivoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: activo, error, cargando } = useApi(() => obtenerActivo(id), [id]);

  const volver = (
    <button onClick={() => navigate("/dashboard/activos")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
      <ChevronLeft size={16} /> Volver al listado
    </button>
  );

  if (cargando) {
    return <div className="space-y-4">{volver}<p className="text-sm text-gray-500">Cargando...</p></div>;
  }

  if (error || !activo) {
    const noEncontrado = error?.message.includes("(404");
    return (
      <div className="space-y-4">
        {volver}
        <p className="text-sm text-gray-500">
          {noEncontrado ? "Activo no encontrado." : "No se pudo cargar el activo. Intenta de nuevo."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {volver}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">{activo.descripcion}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{activo.codigo}</p>
          </div>
          <Badge tone={estadoTone(activo.estado)}>{ESTADO_ACTIVO[activo.estado] ?? activo.estado}</Badge>
        </div>

        <ActivoTabs activo={activo} />
      </div>
    </div>
  );
}
