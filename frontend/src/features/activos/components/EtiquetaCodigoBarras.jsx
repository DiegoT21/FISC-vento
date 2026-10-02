import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { obtenerCodigoBarras } from "../../../shared/api/activos";

// Muestra el código de barras del activo para imprimir o descargar la etiqueta.
// La imagen requiere el token, por eso se descarga como blob en vez de usar
// la URL directo en <img>. El padre la remonta (key) al cambiar de activo.
export default function EtiquetaCodigoBarras({ activo }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    let objeto = null;
    obtenerCodigoBarras(activo.id)
      .then((blob) => {
        objeto = URL.createObjectURL(blob);
        if (vigente) setUrl(objeto);
      })
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [activo.id, activo.codigo]);

  function imprimir() {
    // Iframe oculto con solo la etiqueta, para no imprimir toda la pantalla.
    const marco = document.createElement("iframe");
    marco.style.cssText = "position:fixed;width:0;height:0;border:0;";
    marco.srcdoc = `<body style="margin:16px;text-align:center"><img src="${url}" style="max-width:100%"></body>`;
    marco.onload = () => {
      marco.contentWindow.focus();
      marco.contentWindow.print();
      setTimeout(() => marco.remove(), 1000);
    };
    document.body.appendChild(marco);
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <p className="text-xs text-gray-400 mb-2">Etiqueta de código de barras</p>
      {error && <p className="text-sm text-red-700">No se pudo generar el código de barras.</p>}
      {!error && !url && <p className="text-sm text-gray-500">Generando...</p>}
      {url && (
        <div className="flex items-end gap-4 flex-wrap">
          <img src={url} alt={`Código de barras de ${activo.codigo}`} className="border border-gray-200 rounded bg-white p-2 max-h-32" />
          <div className="flex gap-2">
            <a
              href={url}
              download={`etiqueta-${activo.codigo}.png`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} /> Descargar
            </a>
            <button onClick={imprimir} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
