import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import Badge from "../../shared/components/Badge";
import { ESTADO_ACTIVO, ORIGEN_ACTIVO, estadoTone } from "../../shared/utils/estado";
import { listarActivos, listarTodasCategorias } from "../../shared/api/activos";
import { listarTodosDepartamentos } from "../../shared/api/ubicaciones";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const PAGE_SIZE = 25;
const SIN_FILTROS = { categoria: "", estado: "", origen: "", ubicacion: "" };
const selectCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700";

export default function ActivosListPage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [q, setQ] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [page, setPage] = useState(1);

  // Espera a que el usuario deje de teclear antes de consultar la API.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const categorias = useApi(listarTodasCategorias, []);
  const departamentos = useApi(listarTodosDepartamentos, []);
  const { data, error, cargando } = useApi(
    () => listarActivos({ search: busqueda, ...filtros, page }),
    [busqueda, filtros, page]
  );

  const activos = data?.results ?? [];
  const total = data?.count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = busqueda !== "" || Object.values(filtros).some((v) => v !== "");

  const cambiarFiltro = (campo) => (e) => {
    setFiltros((f) => ({ ...f, [campo]: e.target.value }));
    setPage(1);
  };
  const limpiar = () => {
    setQ("");
    setBusqueda("");
    setFiltros(SIN_FILTROS);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Activos</h1>
          <p className="text-sm text-gray-500">{cargando && !data ? "Cargando..." : `${total} activos`}</p>
        </div>
        {role !== "Auditor" && (
          <button onClick={() => navigate("/dashboard/activos/nuevo")} className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900">+ Registrar activo</button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descripción, código, REF, serie, marca o modelo..." className="text-sm outline-none w-full text-gray-700" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filtros.categoria} onChange={cambiarFiltro("categoria")} className={selectCls} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {(categorias.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select value={filtros.estado} onChange={cambiarFiltro("estado")} className={selectCls} aria-label="Estado">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_ACTIVO).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
          <select value={filtros.origen} onChange={cambiarFiltro("origen")} className={selectCls} aria-label="Origen">
            <option value="">Cualquier origen</option>
            {Object.entries(ORIGEN_ACTIVO).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
          <select value={filtros.ubicacion} onChange={cambiarFiltro("ubicacion")} className={selectCls} aria-label="Ubicación">
            <option value="">Todas las ubicaciones</option>
            {(departamentos.data ?? []).map((d) => (
              <optgroup key={d.id} label={d.nombre}>
                {d.ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {hayFiltros && (
            <button onClick={limpiar} className="inline-flex items-center gap-1 text-sm px-3 py-2 text-gray-600 hover:text-gray-900">
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
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
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  {hayFiltros ? "Ningún activo coincide con los filtros." : "Aún no hay activos registrados."}
                </td>
              </tr>
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
