import { useState } from "react";
import ErrorState from "../../shared/components/ErrorState";
import { obtenerDistribucion } from "../../shared/api/reportes";
import { useApi } from "../../shared/hooks/useApi";
import { ESTADO_ACTIVO } from "../../shared/utils/estado";

// Un color por estado, coherente con los badges: verde de marca / ámbar / rojo.
const COLOR_ESTADO = { ACTIVO: "#0d6936", INACTIVO: "#f59e0b", INOPERATIVO: "#dc2626" };

const fmt = (n) => (n ?? 0).toLocaleString("es-PA");

function Tarjeta({ titulo, subtitulo, children }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
      {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Dona({ por_estado, total }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let acumulado = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0" role="img" aria-label={`Activos por estado, total ${fmt(total)}`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {total > 0 &&
          Object.entries(por_estado).map(([estado, n]) => {
            const largo = (n / total) * C;
            const circulo = (
              <circle
                key={estado}
                cx="70" cy="70" r={R} fill="none"
                stroke={COLOR_ESTADO[estado]} strokeWidth="16"
                strokeDasharray={`${largo} ${C - largo}`}
                strokeDashoffset={-acumulado}
                transform="rotate(-90 70 70)"
              />
            );
            acumulado += largo;
            return n > 0 ? circulo : null;
          })}
        <text x="70" y="68" textAnchor="middle" className="fill-slate-900 text-[22px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(total)}</text>
        <text x="70" y="86" textAnchor="middle" className="fill-slate-500 text-[9px]">activos</text>
      </svg>
      <ul className="space-y-2 text-sm min-w-[160px]">
        {Object.entries(por_estado).map(([estado, n]) => (
          <li key={estado} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLOR_ESTADO[estado] }} />
            <span className="text-slate-700 flex-1">{ESTADO_ACTIVO[estado]}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{fmt(n)}</span>
            <span className="text-xs text-slate-500 tabular-nums w-10 text-right">{total ? Math.round((n / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Barras({ filas, vacio }) {
  const max = Math.max(1, ...filas.map((f) => f.total));
  if (filas.length === 0) return <p className="text-sm text-slate-500">{vacio}</p>;
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.nombre}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-700 truncate">{f.nombre}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{fmt(f.total)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-fisc-700" style={{ width: `${(f.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ComparativaExcelVsSistema() {
  const metricas = [
    { metrica: "Tiempo de registro", antes: 15, despues: 2, unidad: "minutos" },
    { metrica: "Búsqueda de un activo", antes: 10, despues: 0.5, unidad: "minutos" },
    { metrica: "Auditoría anual", antes: 21, despues: 2, unidad: "días" },
    { metrica: "Precisión del inventario", antes: 75, despues: 99, unidad: "%" },
  ];

  return (
    <div className="space-y-5 mt-2">
      <div className="grid grid-cols-2 gap-4 text-center text-sm font-medium">
        <div className="bg-slate-50 rounded p-2 text-slate-500 border border-slate-200">Antes (Excel)</div>
        <div className="bg-fisc-50 rounded p-2 text-fisc-800 border border-fisc-200 shadow-sm">Después (FISC-vento)</div>
      </div>
      <ul className="space-y-6">
        {metricas.map((m) => {
          // Normalizar al 100% el valor mayor para cada métrica
          const max = Math.max(m.antes, m.despues) * 1.1; 
          const anchoAntes = `${(m.antes / max) * 100}%`;
          const anchoDespues = `${(m.despues / max) * 100}%`;
          
          return (
            <li key={m.metrica}>
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>{m.metrica}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-5 rounded-r bg-slate-200 transition-all duration-500" style={{ width: anchoAntes }} />
                  <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">{m.antes} {m.unidad}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 rounded-r bg-fisc-600 transition-all duration-500 shadow-sm" style={{ width: anchoDespues }} />
                  <span className="text-xs font-bold text-fisc-800 tabular-nums whitespace-nowrap">{m.despues} {m.unidad}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ReportesPage() {
  const [recarga, setRecarga] = useState(0);
  const { data, cargando, error } = useApi(obtenerDistribucion, [recarga]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500 mt-1">Distribución del inventario por estado, departamento y categoría</p>
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm"><ErrorState onRetry={() => setRecarga((n) => n + 1)} /></div>
      ) : cargando || !data ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-xl bg-white border border-slate-200/80 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Tarjeta titulo="Activos por estado" subtitulo="Activo, inactivo e inoperativo">
            <Dona por_estado={data.por_estado} total={data.total} />
          </Tarjeta>
          <Tarjeta titulo="Activos por categoría">
            <Barras filas={data.por_categoria} vacio="Aún no hay activos registrados." />
          </Tarjeta>
          <div className="lg:col-span-2">
            <Tarjeta titulo="Activos por departamento">
              <Barras filas={data.por_departamento} vacio="Aún no hay activos registrados." />
            </Tarjeta>
          </div>
          <div className="lg:col-span-2">
            <Tarjeta titulo="Eficiencia: Antes vs Después" subtitulo="Comparativa de gestión manual en Excel vs sistema RFID FISC-vento">
              <ComparativaExcelVsSistema />
            </Tarjeta>
          </div>
        </div>
      )}
    </div>
  );
}
