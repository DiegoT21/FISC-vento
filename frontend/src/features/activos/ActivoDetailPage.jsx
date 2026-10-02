import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Badge from "../../shared/components/Badge";
import ErrorState from "../../shared/components/ErrorState";
import { estadoLabel, estadoTone } from "../../shared/utils/estado";
import { getActivo } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import ActivoTabs from "./components/ActivoTabs";

export default function ActivoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetchActivo = useCallback(() => getActivo(id), [id]);
  const { data: activo, loading, error, reload } = useApi(fetchActivo, [id]);

  const volver = (
    <button
      onClick={() => navigate("/dashboard/activos")}
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-fisc-800 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" /> Volver al listado
    </button>
  );

  if (error?.status === 404) {
    return (
      <div className="space-y-4">
        {volver}
        <p className="text-sm text-slate-500">Activo no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {volver}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading || !activo ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-7 w-1/3 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-1/5 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activo.descripcion}</h1>
                <p className="mt-1 font-mono text-xs text-slate-500 tracking-tight">{activo.codigo}</p>
              </div>
              <Badge tone={estadoTone(activo.estado)}>{estadoLabel(activo.estado)}</Badge>
            </div>
            <ActivoTabs activo={activo} />
          </>
        )}
      </div>
    </div>
  );
}
