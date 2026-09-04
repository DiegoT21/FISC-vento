import { useState } from "react";
import { ArrowLeftRight, Clock, Paperclip } from "lucide-react";

const TABS = [
  ["info", "Información"],
  ["historial", "Historial"],
  ["documentos", "Documentos"],
];

export default function ActivoTabs({ activo }) {
  const [tab, setTab] = useState("info");

  return (
    <>
      <div className="flex gap-1 mt-5 border-b border-gray-100">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === id ? "border-green-700 text-green-800 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
          <div><p className="text-gray-400 text-xs">Categoría</p><p className="text-gray-800">{activo.categoria}</p></div>
          <div><p className="text-gray-400 text-xs">Origen</p><p className="text-gray-800">{activo.origen}</p></div>
          <div><p className="text-gray-400 text-xs">Ubicación</p><p className="text-gray-800">{activo.ubicacion}</p></div>
          <div><p className="text-gray-400 text-xs">Tag RFID</p><p className="text-gray-800 font-mono text-xs">RF-{activo.servitac}</p></div>
        </div>
      )}
      {tab === "historial" && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600"><Clock size={14} className="text-gray-400" /> Registrado en el sistema — 03 feb 2025</div>
          <div className="flex items-center gap-2 text-sm text-gray-600"><ArrowLeftRight size={14} className="text-gray-400" /> Trasladado a {activo.ubicacion} — 14 jun 2026</div>
        </div>
      )}
      {tab === "documentos" && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 border border-gray-100 rounded px-3 py-2">
            <Paperclip size={14} className="text-gray-400" /> Factura_compra.pdf
          </div>
          <button className="text-sm text-green-800 hover:underline">+ Adjuntar documento</button>
        </div>
      )}
    </>
  );
}
