import { MapPin } from "lucide-react";

const DEPTOS = [
  { nombre: "Departamento de TI", ubicaciones: ["Lab. 3-407", "Lab. 3-410", "Cuarto de Redes"] },
  { nombre: "Dirección FISC", ubicaciones: ["Oficina 17", "Sala de Reuniones"] },
  { nombre: "Docencia", ubicaciones: ["Aula 5-201", "Aula 5-202"] },
];

export default function UbicacionesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Ubicaciones</h1>
          <p className="text-sm text-gray-500">Estructura por departamentos y espacios físicos</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nueva ubicación</button>
      </div>
      <div className="space-y-3">
        {DEPTOS.map((d) => (
          <div key={d.nombre} className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 text-sm font-medium text-gray-800">{d.nombre}</div>
            <div className="divide-y divide-gray-100">
              {d.ubicaciones.map((u) => (
                <div key={u} className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400" /> {u}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
