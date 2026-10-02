import { useCallback, useEffect } from "react";
import { Download, Printer } from "lucide-react";
import ErrorState from "../../../shared/components/ErrorState";
import { getCodigoBarras } from "../../../shared/api/escaneo";
import { useApi } from "../../../shared/hooks/useApi";

// Muestra la etiqueta de código de barras del activo (PNG generado por el backend)
// y permite descargarla o imprimirla.
export default function CodigoBarras({ activo }) {
  // La imagen exige el token, así que llega como Blob y se expone con una URL local.
  const fetchImagen = useCallback(
    () => getCodigoBarras(activo.id).then((blob) => URL.createObjectURL(blob)),
    [activo.id],
  );
  const { data: url, loading, error, reload } = useApi(fetchImagen, [activo.id]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  function imprimir() {
    const ventana = window.open("", "_blank", "width=480,height=360");
    if (!ventana) return;
    const img = ventana.document.createElement("img");
    img.alt = `Código de barras ${activo.codigo}`;
    img.style.maxWidth = "100%";
    img.onload = () => {
      ventana.focus();
      ventana.print();
    };
    ventana.document.title = activo.codigo;
    ventana.document.body.style.margin = "16px";
    ventana.document.body.appendChild(img);
    img.src = url;
  }

  return (
    <div className="mt-6 pt-5 border-t border-slate-200/80">
      <h3 className="text-base font-semibold text-slate-800">Etiqueta de código de barras</h3>
      <p className="text-xs text-slate-500 mt-0.5">Para imprimir y pegar en el activo.</p>

      {error ? (
        <ErrorState message="No se pudo generar el código de barras." onRetry={reload} />
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="w-64 h-28 bg-white border border-slate-200/80 rounded-lg flex items-center justify-center overflow-hidden">
            {loading || !url ? (
              <div className="w-full h-full bg-slate-100 animate-pulse" aria-busy="true" />
            ) : (
              <img src={url} alt={`Código de barras ${activo.codigo}`} className="max-w-full max-h-full" />
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={url ?? undefined}
              download={`${activo.codigo}.png`}
              aria-disabled={!url}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors ${url ? "" : "pointer-events-none opacity-50"}`}
            >
              <Download className="w-4 h-4 text-slate-500" /> Descargar
            </a>
            <button
              onClick={imprimir}
              disabled={!url}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
