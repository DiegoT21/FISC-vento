import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

const AVISO_IOS = "fisc-pwa-ios-oculto";
const REVISAR_CADA_MS = 60 * 60 * 1000;

function yaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function avisoIosInicial() {
  if (yaInstalada() || !window.isSecureContext) return false;
  const ua = window.navigator.userAgent;
  const esIos = /iPad|iPhone|iPod/.test(ua);
  const esSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (!esIos || !esSafari) return false;
  try {
    return localStorage.getItem(AVISO_IOS) !== "1";
  } catch {
    return false;
  }
}

function Tarjeta({ children }) {
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
      {children}
    </div>
  );
}

// Avisos flotantes, sin foco automático: el lector Zebra escribe en el
// campo que ya está activo y estos botones no deben robarle el teclado.
export default function AvisosPwa() {
  const registro = useRef(null);
  const [eventoInstalar, setEventoInstalar] = useState(null);
  const [mostrarIos, setMostrarIos] = useState(avisoIosInicial);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registro.current = registration ?? null;
    },
    onRegisterError() {
      // Un registro fallido (HTTP sin certificado, por ejemplo) no debe
      // tumbar la página. El sitio sigue funcionando como siempre.
    },
  });

  useEffect(() => {
    const revisar = () => {
      registro.current?.update().catch(() => {});
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") revisar();
    };
    document.addEventListener("visibilitychange", alVolver);
    const id = setInterval(revisar, REVISAR_CADA_MS);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (yaInstalada() || !window.isSecureContext) return undefined;

    const guardar = (event) => {
      event.preventDefault();
      setEventoInstalar(event);
    };
    const instalada = () => setEventoInstalar(null);
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", instalada);

    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", instalada);
    };
  }, []);

  async function instalar() {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    try {
      await eventoInstalar.userChoice;
    } catch {
      // El navegador puede rechazar el diálogo si ya se usó.
    }
    setEventoInstalar(null);
  }

  function ocultarIos() {
    setMostrarIos(false);
    try {
      localStorage.setItem(AVISO_IOS, "1");
    } catch {
      // Sin almacenamiento local el aviso vuelve en la próxima visita.
    }
  }

  if (!needRefresh && !eventoInstalar && !mostrarIos) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      {needRefresh && (
        <Tarjeta>
          <p className="text-sm text-slate-700" role="status">
            Hay una versión nueva.
          </p>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-fisc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-fisc-700"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="shrink-0 px-1 py-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            Después
          </button>
        </Tarjeta>
      )}

      {eventoInstalar && (
        <Tarjeta>
          <p className="text-sm text-slate-700">Puedes instalar FISC-vento en este equipo.</p>
          <button
            type="button"
            onClick={instalar}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-fisc-800" />
            Instalar app
          </button>
          <button
            type="button"
            onClick={() => setEventoInstalar(null)}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar aviso de instalación"
          >
            <X className="h-4 w-4" />
          </button>
        </Tarjeta>
      )}

      {mostrarIos && !eventoInstalar && (
        <Tarjeta>
          <p className="text-sm text-slate-700">
            Para instalarla, en Safari toca Compartir y luego Añadir a inicio.
          </p>
          <button
            type="button"
            onClick={ocultarIos}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar aviso de instalación"
          >
            <X className="h-4 w-4" />
          </button>
        </Tarjeta>
      )}
    </div>
  );
}
