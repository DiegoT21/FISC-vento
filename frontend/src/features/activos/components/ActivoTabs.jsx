import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { ORIGEN_ACTIVO } from "../../../shared/utils/estado";
import EtiquetaCodigoBarras from "./EtiquetaCodigoBarras";
import HistorialActivo from "./HistorialActivo";

const TABS = [
  ["info", "Información"],
  ["historial", "Historial"],
  ["documentos", "Documentos"],
];

export default function ActivoTabs({ activo }) {
  const [tab, setTab] = useState("info");

  return (
    <>
      <div className="flex gap-1 mt-5 border-b border-slate-100">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === id ? "border-fisc-700 text-fisc-800 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
            <div><p className="text-slate-400 text-xs">Categoría</p><p className="text-slate-800">{activo.categoria_nombre}</p></div>
            <div><p className="text-slate-400 text-xs">Origen</p><p className="text-slate-800">{ORIGEN_ACTIVO[activo.origen] ?? "—"}</p></div>
            <div><p className="text-slate-400 text-xs">Ubicación</p><p className="text-slate-800">{activo.departamento_nombre} / {activo.ubicacion_nombre}</p></div>
            <div><p className="text-slate-400 text-xs">Tag RFID</p><p className="text-slate-800 font-mono text-xs">{activo.tag_rfid || "Sin etiqueta"}</p></div>
            <div><p className="text-slate-400 text-xs">REF</p><p className="text-slate-800 font-mono text-xs">{activo.ref || "—"}</p></div>
            <div><p className="text-slate-400 text-xs">Número de serie</p><p className="text-slate-800 font-mono text-xs">{activo.numero_serie || "—"}</p></div>
            <div><p className="text-slate-400 text-xs">Marca</p><p className="text-slate-800">{activo.marca || "—"}</p></div>
            <div><p className="text-slate-400 text-xs">Modelo</p><p className="text-slate-800">{activo.modelo || "—"}</p></div>
          </div>
          <EtiquetaCodigoBarras key={`${activo.id}-${activo.codigo}`} activo={activo} />
        </>
      )}
      {tab === "historial" && <HistorialActivo activoId={activo.id} />}
      {tab === "documentos" && (
        <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center border border-dashed border-slate-200 rounded-xl">
          <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <p className="text-sm font-medium text-slate-800">Aún no hay documentos</p>
          <p className="text-xs text-slate-500">Las facturas y actas de donación se podrán adjuntar aquí.</p>
          <button disabled className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 cursor-not-allowed">
            <Plus className="w-4 h-4" /> Adjuntar documento (próximamente)
          </button>
        </div>
      )}
    </>
  );
}
