import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { ESTADO_ACTIVO, estadoTone } from "../../shared/utils/estado";
import { listarActivos, listarCategorias } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";

const PAGE_SIZE = 25;

export default function ActivosListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(1);

  // Espera a que el usuario deje de teclear antes de consultar la API.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const categorias = useApi(listarCategorias, []);
  const { data, error, cargando } = useApi(
    () => listarActivos({ search: busqueda, categoria: cat, page }),
    [busqueda, cat, page]
  );

  const activos = data?.results ?? [];
  const total = data?.count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Activos</h1>
          <p className="text-sm text-gray-500">{cargando && !data ? "Cargando..." : `${total} activos`}</p>
        </div>
        <button className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900">+ Registrar activo</button>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descripción o código..." className="text-sm outline-none w-full text-gray-700" />
        </div>
        <select
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 bg-white text-gray-700"
        >
          <option value="">Todas</option>
          {(categorias.data?.results ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar los activos. Intenta de nuevo.
        </p>
      )}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Descripción</th>
              <th className="text-left px-4 py-2 font-medium">Código</th>
              <th className="text-left px-4 py-2 font-medium">Categoría</th>
              <th className="text-left px-4 py-2 font-medium">Ubicación</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activos.map((a) => (
              <tr key={a.id} onClick={() => navigate(`/dashboard/activos/${a.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2.5 text-gray-800">{a.descripcion}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{a.codigo}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.categoria_nombre}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.ubicacion_nombre}</td>
                <td className="px-4 py-2.5"><Badge tone={estadoTone(a.estado)}>{ESTADO_ACTIVO[a.estado] ?? a.estado}</Badge></td>
              </tr>
            ))}
            {!cargando && !error && activos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No hay activos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {paginas > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-gray-600">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40">Anterior</button>
          <span>Página {page} de {paginas}</span>
          <button disabled={page >= paginas} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}
