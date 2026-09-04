import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Radio, Check } from "lucide-react";
import { ACTIVOS } from "../../mocks/activos.mock";

export default function EscaneoPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("qr");
  const [found, setFound] = useState(null);
  const simulate = () => setFound(ACTIVOS[Math.floor(Math.random() * ACTIVOS.length)]);

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Escaneo</h1>
        <p className="text-sm text-gray-500">Identifica un activo por cámara o lector RFID</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setMode("qr")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border ${mode === "qr" ? "bg-green-800 text-white border-green-800" : "bg-white text-gray-600 border-gray-200"}`}>
          <QrCode size={15} /> QR / Barras
        </button>
        <button onClick={() => setMode("rfid")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border ${mode === "rfid" ? "bg-green-800 text-white border-green-800" : "bg-white text-gray-600 border-gray-200"}`}>
          <Radio size={15} /> Lector RFID
        </button>
      </div>
      <div className="bg-white border border-gray-200 border-dashed rounded-lg h-52 flex flex-col items-center justify-center gap-3 text-gray-400">
        {mode === "qr" ? <QrCode size={40} /> : <Radio size={40} />}
        <p className="text-xs">{mode === "qr" ? "Vista de cámara (simulada)" : "Esperando lectura de proximidad..."}</p>
        <button onClick={simulate} className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg">Simular lectura</button>
      </div>
      {found && (
        <div onClick={() => navigate(`/activos/${found.id}`)} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-emerald-800">{found.desc}</p>
            <p className="text-xs text-emerald-600">{found.servitac} — {found.ubicacion}</p>
          </div>
          <Check size={18} className="text-emerald-600" />
        </div>
      )}
    </div>
  );
}
