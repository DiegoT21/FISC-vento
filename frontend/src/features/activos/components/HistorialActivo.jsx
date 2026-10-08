import { useEffect, useState } from "react";
import { Clock, History, Pencil, Plus, Trash2 } from "lucide-react";
import { listarHistorialActivo } from "../../../shared/api/auditoria";
import { mensajeDeError } from "../../../shared/utils/errores";

const ACCIONES = {
  creacion: { titulo: "Registro creado", icon: Plus, tono: "bg-fisc-100 text-fisc-800" },
  modificacion: { titulo: "Registro modificado", icon: Pencil, tono: "bg-slate-100 text-slate-600" },
  eliminacion: { titulo: "Registro eliminado", icon: Trash2, tono: "bg-red-50 text-red-700" },
};

const accionDe = (accion) =>
  ACCIONES[String(accion ?? "").toLowerCase()] ?? { titulo: accion || "Cambio", icon: Clock, tono: "bg-slate-100 text-slate-500" };

const esObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const etiquetaCampo = (campo) => {
  const texto = String(campo).replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const valorTexto = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const fechaHora = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-PA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// En update el detalle es { campo: { anterior, nuevo } }; en create/delete es
// un snapshot { campo: valor }. Tolera vacío u otras formas.
function Cambios({ accion, detalle }) {
  if (!esObjeto(detalle)) return null;
  const filas = Object.entries(detalle);
  if (filas.length === 0) return null;
  const esUpdate = String(accion ?? "").toLowerCase() === "modificacion";

  return (
    <ul className="mt-2 space-y-1">
      {filas.map(([campo, valor]) => {
        const cambio = esObjeto(valor) && ("anterior" in valor || "nuevo" in valor);
        if (esUpdate && cambio) {
          return (
            <li key={campo} className="text-xs text-slate-600 flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-medium text-slate-700">{etiquetaCampo(campo)}:</span>
              <span className="text-slate-400 line-through break-all">{valorTexto(valor.anterior)}</span>
              <span aria-hidden="true">→</span>
              <span className="text-fisc-800 break-all">{valorTexto(valor.nuevo)}</span>
            </li>
          );
        }
        return (
          <li key={campo} className="text-xs text-slate-600">
            <span className="font-medium text-slate-700">{etiquetaCampo(campo)}:</span>{" "}
            <span className="break-all">{valorTexto(valor)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function HistorialActivo({ activoId }) {
  const [eventos, setEventos] = useState([]);
  const [siguiente, setSiguiente] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    listarHistorialActivo(activoId, pagina)
      .then((res) => {
        if (!vigente) return;
        setEventos((prev) => (pagina === 1 ? res.results ?? [] : [...prev, ...(res.results ?? [])]));
        setSiguiente(Boolean(res.next));
        setCargando(false);
      })
      .catch((err) => {
        if (!vigente) return;
        setError(mensajeDeError(err, "No se pudo cargar el historial. Intenta de nuevo."));
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [activoId, pagina]);

  if (error && eventos.length === 0) {
    return <p className="mt-5 text-sm text-red-700">{error}</p>;
  }

  if (cargando && eventos.length === 0) {
    return <p className="mt-5 text-sm text-slate-500">Cargando historial...</p>;
  }

  if (eventos.length === 0) {
    return (
      <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center border border-dashed border-slate-200 rounded-xl">
        <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
          <History className="w-5 h-5" />
        </span>
        <p className="text-sm font-medium text-slate-800">Aún no hay cambios registrados</p>
        <p className="text-xs text-slate-500">Aquí verás quién modificó este activo y cuándo.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <ol className="relative border-l border-slate-200 ml-2 space-y-5">
        {eventos.map((e) => {
          const { titulo, icon: Icon, tono } = accionDe(e.accion);
          return (
            <li key={e.id} className="pl-5 relative">
              <span className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${tono}`}>
                <Icon className="w-3 h-3" />
              </span>
              <p className="text-sm text-slate-800">{titulo}</p>
              <p className="text-xs text-slate-500">
                {fechaHora(e.fecha)} · {e.usuario || "Sistema"}
              </p>
              <Cambios accion={e.accion} detalle={e.detalle} />
            </li>
          );
        })}
      </ol>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {siguiente && (
        <button
          onClick={() => setPagina((p) => p + 1)}
          disabled={cargando}
          className="mt-4 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {cargando ? "Cargando..." : "Ver cambios anteriores"}
        </button>
      )}
    </div>
  );
}
