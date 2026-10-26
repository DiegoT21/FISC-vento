import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Ban, QrCode, RefreshCw } from "lucide-react";
import Badge from "../../shared/components/Badge";
import {
  generarVinculacion,
  listarDispositivos,
  revocarDispositivo,
} from "../../shared/api/dispositivos";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
import { mensajeDeError } from "../../shared/utils/errores";

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" }) : "—";

const reloj = (segundos) => {
  const s = Math.max(0, segundos);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const botonPrimario =
  "min-h-11 inline-flex items-center gap-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-fisc-500/30";

function PanelQr({ vinculacion, restante, onRegenerar, generando }) {
  const vencido = restante <= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row gap-6 items-center">
      {/* Fondo blanco y margen amplio: el lector del TC22r necesita contraste y zona de silencio. */}
      <div className={`bg-white p-2 rounded-lg border border-slate-200 ${vencido ? "opacity-20" : ""}`}>
        <QRCodeSVG value={vinculacion.payload} size={280} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" />
      </div>
      <div className="space-y-3 text-sm text-slate-600 max-w-md">
        <p className="text-base font-semibold text-slate-900">Escanea este QR con el TC22r</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>En la app FISC-vento Campo, toca «Vincular con QR».</li>
          <li>Apunta el lector del equipo al código y presiona el gatillo.</li>
          <li>La app queda configurada y registrada sola.</li>
        </ol>
        <p>
          {vencido ? (
            <span className="text-red-700 font-medium">El código venció. Genera uno nuevo.</span>
          ) : (
            <>
              Vence en <span className="font-mono font-semibold text-slate-900">{reloj(restante)}</span> y sirve para un solo equipo.
            </>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Si el lector no lo reconoce, teclea este código en la app:{" "}
          <span className="font-mono text-slate-800 select-all">{vinculacion.codigo}</span>
        </p>
        <button type="button" onClick={onRegenerar} disabled={generando} className="min-h-11 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} /> Generar otro
        </button>
      </div>
    </div>
  );
}

export default function DispositivosPage() {
  const { role } = useRole();
  const esAdmin = role === "Administrador";

  const [recarga, setRecarga] = useState(0);
  const { data, error, cargando } = useApi(listarDispositivos, [recarga]);
  const dispositivos = data ?? [];

  const [vinculacion, setVinculacion] = useState(null);
  const [restante, setRestante] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [aviso, setAviso] = useState("");
  const totalAlGenerar = useRef(0);

  async function generar() {
    setGenerando(true);
    setErrorGeneral("");
    setAviso("");
    try {
      const nueva = await generarVinculacion();
      totalAlGenerar.current = dispositivos.length;
      setVinculacion({ ...nueva, venceEn: new Date(nueva.expira_en).getTime() });
      setRestante(nueva.vigencia_segundos);
    } catch (err) {
      setErrorGeneral(mensajeDeError(err, "No se pudo generar el QR. Intenta de nuevo."));
    } finally {
      setGenerando(false);
    }
  }

  // Cuenta regresiva del código.
  useEffect(() => {
    if (!vinculacion) return undefined;
    const id = setInterval(
      () => setRestante(Math.round((vinculacion.venceEn - Date.now()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [vinculacion]);

  // Mientras el QR esté vigente, revisa cada 4 s si ya se vinculó un equipo.
  const qrVigente = Boolean(vinculacion) && restante > 0;
  useEffect(() => {
    if (!qrVigente) return undefined;
    const id = setInterval(() => setRecarga((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, [qrVigente]);

  useEffect(() => {
    if (vinculacion && dispositivos.length > totalAlGenerar.current) {
      setVinculacion(null);
      setAviso("Dispositivo vinculado correctamente.");
    }
  }, [dispositivos.length, vinculacion]);

  async function revocar(d) {
    if (!window.confirm(`¿Desvincular «${d.nombre}»? La app dejará de funcionar en ese equipo hasta vincularlo de nuevo.`)) return;
    setErrorGeneral("");
    try {
      await revocarDispositivo(d.id);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorGeneral(mensajeDeError(err, "No se pudo desvincular el dispositivo."));
    }
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dispositivos</h1>
          <p className="text-sm text-slate-500 mt-1">Equipos de campo (TC22r) vinculados con la app FISC-vento Campo</p>
        </div>
        {esAdmin && (
          <button type="button" onClick={generar} disabled={generando || data === null} className={`self-start ${botonPrimario}`}>
            <QrCode size={16} /> {generando ? "Generando..." : "Generar QR de vinculación"}
          </button>
        )}
      </div>

      {!esAdmin && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Solo un administrador puede vincular dispositivos.
        </p>
      )}
      {aviso && (
        <p className="text-sm text-fisc-900 bg-fisc-50 border border-fisc-200 rounded-lg px-3 py-2">{aviso}</p>
      )}
      {errorGeneral && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorGeneral}</p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los dispositivos.
        </p>
      )}

      {esAdmin && vinculacion && (
        <PanelQr vinculacion={vinculacion} restante={restante} onRegenerar={generar} generando={generando} />
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
                <th className="text-left px-4 py-2 font-semibold">Dispositivo</th>
                <th className="text-left px-4 py-2 font-semibold">Modelo</th>
                <th className="text-left px-4 py-2 font-semibold">Vinculado</th>
                <th className="text-left px-4 py-2 font-semibold">Último uso</th>
                <th className="text-left px-4 py-2 font-semibold">Estado</th>
                {esAdmin && <th className="text-right px-4 py-2 font-semibold w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispositivos.map((d) => (
                <tr className="hover:bg-fisc-50/60 transition-colors" key={d.id}>
                  <td className="px-4 py-2.5 text-slate-800">{d.nombre}</td>
                  <td className="px-4 py-2.5 text-slate-500">{d.modelo || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {fecha(d.registrado_en)}
                    {d.vinculado_por_nombre && <span className="block text-xs text-slate-400">por {d.vinculado_por_nombre}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{fecha(d.ultimo_uso)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={d.revocado ? "bad" : "good"}>{d.revocado ? "Desvinculado" : "Activo"}</Badge>
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      {!d.revocado && (
                        <button
                          type="button"
                          onClick={() => revocar(d)}
                          className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-700"
                          title="Desvincular dispositivo"
                        >
                          <Ban size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {cargando && dispositivos.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
              )}
              {!cargando && dispositivos.length === 0 && !error && (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">Aún no hay dispositivos vinculados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}