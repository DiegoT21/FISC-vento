import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { estadoTone, estatusTone } from "../../shared/utils/estado";
import { ACTIVOS } from "../../mocks/activos.mock";
import ActivoTabs from "./components/ActivoTabs";

export default function ActivoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activo = ACTIVOS.find((a) => String(a.id) === id);

  if (!activo) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/activos")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Volver al listado
        </button>
        <p className="text-sm text-gray-500">Activo no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/activos")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft size={16} /> Volver al listado
      </button>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">{activo.desc}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{activo.ref} · {activo.servitac}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={estatusTone(activo.estatus)}>{activo.estatus}</Badge>
            <Badge tone={estadoTone(activo.estado)}>{activo.estado}</Badge>
          </div>
        </div>

        <ActivoTabs activo={activo} />
      </div>
    </div>
  );
}
