import { useState, useRef } from "react";
import { FileText, Trash2, Download, Upload } from "lucide-react";
import { ORIGEN_ACTIVO } from "../../../shared/utils/estado";
import EtiquetaCodigoBarras from "./EtiquetaCodigoBarras";
import HistorialActivo from "./HistorialActivo";
import { useApi } from "../../../shared/hooks/useApi";
import { listarDocumentosActivo, subirDocumentoActivo, eliminarDocumentoActivo } from "../../../shared/api/activos";

function DocumentosReal({ activoId }) {
  const [recarga, setRecarga] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef(null);
  
  const { data, cargando, error } = useApi(() => listarDocumentosActivo(activoId), [activoId, recarga]);

  const handleSubir = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSubiendo(true);
    try {
      await subirDocumentoActivo(activoId, file.name, file);
      setRecarga(n => n + 1);
    } catch (err) {
      alert("Error al subir el documento.");
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEliminar = async (docId) => {
    if (!confirm("¿Seguro que deseas eliminar este documento?")) return;
    try {
      await eliminarDocumentoActivo(docId);
      setRecarga(n => n + 1);
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  const documentos = data || [];

  return (
    <div className="mt-5">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-medium text-slate-800">Documentos adjuntos</p>
        <label className={`text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer ${subiendo ? 'opacity-50' : ''}`}>
          <Upload className="w-4 h-4" />
          {subiendo ? "Subiendo..." : "Subir archivo"}
          <input type="file" ref={fileInputRef} onChange={handleSubir} disabled={subiendo} className="hidden" />
        </label>
      </div>

      {cargando && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">Error al cargar documentos.</p>}

      {!cargando && !error && documentos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center border border-dashed border-slate-200 rounded-xl">
          <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <p className="text-sm font-medium text-slate-800">Aún no hay documentos</p>
          <p className="text-xs text-slate-500">Las facturas y actas de donación se pueden adjuntar aquí.</p>
        </div>
      )}

      {!cargando && !error && documentos.length > 0 && (
        <ul className="space-y-2 border border-slate-200 rounded-lg divide-y divide-slate-100">
          {documentos.map(doc => (
            <li key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <a href={doc.archivo_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-fisc-700 hover:underline">
                    {doc.nombre}
                  </a>
                  <p className="text-xs text-slate-400">Subido el {new Date(doc.subido_en).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.archivo_url} download className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200" title="Descargar">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => handleEliminar(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TABS = [
  ["info", "Información"],
  ["historial", "Historial"],
  ["documentos", "Documentos"],
];

export default function ActivoTabs({ activo }) {
  const [tab, setTab] = useState("info");

  return (
    <>
      <div className="flex gap-1 mt-5 border-b border-slate-100 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 min-h-11 text-sm border-b-2 -mb-px whitespace-nowrap ${tab === id ? "border-fisc-700 text-fisc-800 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
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
        <DocumentosReal activoId={activo.id} />
      )}
    </>
  );
}
