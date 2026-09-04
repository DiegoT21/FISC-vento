import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { estadoTone, estatusTone } from "../../shared/utils/estado";
import { ACTIVOS } from "../../mocks/activos.mock";

export default function ActivosListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const filtered = ACTIVOS.filter((a) =>
    (cat === "Todas" || a.categoria === cat) &&
    (a.desc.toLowerCase().includes(q.toLowerCase()) || a.servitac.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Activos</h1>
          <p className="text-sm text-gray-500">{filtered.length} de {ACTIVOS.length} activos</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Registrar activo</button>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descripción o servitac..." className="text-sm outline-none w-full text-gray-700" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 bg-white text-gray-700">
          <option>Todas</option>
          <option>Equipo</option>
          <option>Mobiliario</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Descripción</th>
              <th className="text-left px-4 py-2 font-medium">Servitac</th>
              <th className="text-left px-4 py-2 font-medium">Ubicación</th>
              <th className="text-left px-4 py-2 font-medium">Estatus</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} onClick={() => navigate(`/activos/${a.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2.5 text-gray-800">{a.desc}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{a.servitac}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.ubicacion}</td>
                <td className="px-4 py-2.5"><Badge tone={estatusTone(a.estatus)}>{a.estatus}</Badge></td>
                <td className="px-4 py-2.5"><Badge tone={estadoTone(a.estado)}>{a.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
