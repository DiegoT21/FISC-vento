import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";
import Badge from "../../../shared/components/Badge";
import { estadoLabel, estadoTone } from "../../../shared/utils/estado";
import ActivoTabs from "./ActivoTabs";

export default function ActivoDrawer({ activo, onClose }) {
  useEffect(() => {
    if (!activo) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activo, onClose]);

  if (!activo) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={activo.descripcion}>
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200/80 flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200/80">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-800">{activo.descripcion}</h2>
            <p className="mt-1 font-mono text-xs text-slate-500 tracking-tight">{activo.codigo}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 -m-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-auto flex-1">
          <Badge tone={estadoTone(activo.estado)}>{estadoLabel(activo.estado)}</Badge>
          <ActivoTabs activo={activo} compact />
        </div>
        <div className="p-4 border-t border-slate-200/80">
          <Link
            to={`/dashboard/activos/${activo.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" /> Abrir ficha completa
          </Link>
        </div>
      </aside>
    </div>
  );
}
