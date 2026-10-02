import { useState } from "react";
import { Clock, FileText, Pencil, Plus } from "lucide-react";
import { origenLabel } from "../../../shared/utils/estado";
import CodigoBarras from "./CodigoBarras";

const TABS = [
  ["info", "Información"],
  ["historial", "Historial"],
  ["documentos", "Documentos"],
];

const fecha = (iso) =>
  new Date(iso).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" });

function Campo({ label, children, mono }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={mono ? "mt-0.5 font-mono text-xs font-medium text-fisc-900 tracking-tight" : "mt-0.5 text-sm text-slate-800"}>
        {children}
      </p>
    </div>
  );
}

function Evento({ icon: Icon, tone, titulo, detalle }) {
  return (
    <li className="pl-5 relative">
      <span className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${tone}`}>
        <Icon className="w-3 h-3" />
      </span>
      <p className="text-sm text-slate-800">{titulo}</p>
      <p className="text-xs text-slate-500">{detalle}</p>
    </li>
  );
}

export default function ActivoTabs({ activo, compact = false }) {
  const [tab, setTab] = useState("info");
  const modificado = activo.actualizado_en !== activo.creado_en;

  return (
    <>
      <div className="flex gap-1 mt-5 border-b border-slate-200/80" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === id ? "border-fisc-800 text-fisc-800 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <>
          <div className={`grid gap-x-8 gap-y-4 mt-5 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
            <Campo label="Categoría">{activo.categoria_nombre}</Campo>
            <Campo label="Origen">{origenLabel(activo.origen)}</Campo>
            <Campo label="Departamento">{activo.departamento_nombre}</Campo>
            <Campo label="Ubicación">{activo.ubicacion_nombre}</Campo>
            <Campo label="Tag RFID" mono>{activo.tag_rfid || "Sin tag asignado"}</Campo>
          </div>
          <CodigoBarras activo={activo} />
        </>
      )}

      {tab === "historial" && (
        <ol className="mt-5 relative border-l border-slate-200 ml-2 space-y-5">
          {modificado && (
            <Evento
              icon={Pencil}
              tone="bg-fisc-100 text-fisc-800"
              titulo="Última modificación"
              detalle={fecha(activo.actualizado_en)}
            />
          )}
          <Evento
            icon={Clock}
            tone="bg-slate-100 text-slate-500"
            titulo="Registrado en el sistema"
            detalle={fecha(activo.creado_en)}
          />
        </ol>
      )}

      {tab === "documentos" && (
        <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center border border-dashed border-slate-200 rounded-xl">
          <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <p className="text-sm font-medium text-slate-800">Aún no hay documentos</p>
          <p className="text-xs text-slate-500">Facturas y actas de donación se podrán adjuntar aquí.</p>
          <button disabled className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 cursor-not-allowed">
            <Plus className="w-4 h-4" /> Adjuntar documento (próximamente)
          </button>
        </div>
      )}
    </>
  );
}
