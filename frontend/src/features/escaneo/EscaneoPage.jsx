import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Barcode, Radio, CheckCircle2, ScanLine, SearchX, ChevronRight } from "lucide-react";
import { listActivos } from "../../shared/api/activos";
import { escanear } from "../../shared/api/escaneo";

const MODOS = [
  ["barras", "Código de barras", Barcode],
  ["rfid", "Lector RFID", Radio],
];

export default function EscaneoPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [mode, setMode] = useState("barras");
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  // { activo } cuando hubo coincidencia, { noEncontrado: "<lectura>" } cuando no.
  const [resultado, setResultado] = useState(null);

  // Los lectores de mano y de RFID se comportan como un teclado: escriben el código y pulsan Enter.
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  async function buscar(valor) {
    const lectura = valor.trim();
    if (!lectura) return;
    setBuscando(true);
    try {
      // /api/escaneo/escanear/ resuelve por código exacto (barras) o por tag RFID.
      const activo = await escanear(lectura);
      setResultado(activo ? { activo } : { noEncontrado: lectura });
    } catch {
      setResultado({ error: true });
    } finally {
      setBuscando(false);
      setCodigo("");
      inputRef.current?.focus();
    }
  }

  async function simular() {
    setBuscando(true);
    try {
      const { results } = await listActivos();
      setResultado(results.length ? { activo: results[Math.floor(Math.random() * results.length)] } : { noEncontrado: "—" });
    } finally {
      setBuscando(false);
    }
  }

  const activo = resultado?.activo;

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Escaneo</h1>
        <p className="text-sm text-slate-500 mt-1">Identifica un activo por código de barras o lector RFID</p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200/80 rounded-xl shadow-sm" role="tablist">
        {MODOS.map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => { setMode(id); setResultado(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${mode === id ? "bg-fisc-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="border-2 border-dashed border-fisc-200 bg-fisc-50/50 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-fisc-100 text-fisc-800 flex items-center justify-center mx-auto mb-3">
          {mode === "barras" ? <ScanLine className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
        </div>
        <p className="text-sm font-medium text-slate-900">
          {mode === "barras" ? "Listos para escanear código de barras" : "Esperando lectura de proximidad RFID"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {mode === "barras" ? "Escanea con el lector de mano o escribe el código y pulsa Enter" : "Acerca la etiqueta al lector o escribe el tag y pulsa Enter"}
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); buscar(codigo); }}
          className="mt-5 flex gap-2 max-w-sm mx-auto"
        >
          <input
            ref={inputRef}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            aria-label={mode === "barras" ? "Código de barras" : "Tag RFID"}
            placeholder={mode === "barras" ? "SVT-118423" : "RF-000123"}
            className="flex-1 min-w-0 font-mono text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-fisc-500 focus:ring-2 focus:ring-fisc-500/20"
          />
          <button
            type="submit"
            disabled={buscando || !codigo.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30 disabled:opacity-50"
          >
            Buscar
          </button>
        </form>
        <button onClick={simular} disabled={buscando} className="mt-3 text-xs font-medium text-fisc-800 hover:text-fisc-700 disabled:opacity-50">
          Simular lectura
        </button>
      </div>

      {activo && (
        <button
          onClick={() => navigate(`/dashboard/activos/${activo.id}`)}
          className="w-full text-left bg-white border border-fisc-300/60 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-fisc-50/60 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-fisc-100 text-fisc-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{activo.descripcion}</span>
            <span className="block font-mono text-xs text-slate-500 tracking-tight">{activo.codigo} — {activo.ubicacion_nombre}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      )}
      {resultado?.error && (
        <div role="alert" className="bg-white border border-red-200/60 rounded-xl shadow-sm p-4 text-sm text-slate-800">
          No se pudo consultar el activo. Revisa tu conexión e intenta de nuevo.
        </div>
      )}
      {resultado?.noEncontrado && (
        <div role="alert" className="bg-white border border-amber-200/60 rounded-xl shadow-sm p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <SearchX className="w-5 h-5" />
          </span>
          <span className="text-sm text-slate-800">
            No hay ningún activo con la lectura <span className="font-mono text-xs font-medium">{resultado.noEncontrado}</span>.
          </span>
        </div>
      )}
    </div>
  );
}
