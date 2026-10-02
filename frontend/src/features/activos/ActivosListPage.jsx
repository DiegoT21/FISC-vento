import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PackageSearch, Plus, Search } from "lucide-react";
import Badge from "../../shared/components/Badge";
import ErrorState from "../../shared/components/ErrorState";
import { estadoLabel, estadoTone } from "../../shared/utils/estado";
import { listActivos, listCategorias } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
import ActivoDrawer from "./components/ActivoDrawer";
import ActivoFormModal from "./components/ActivoFormModal";

const PAGE_SIZE = 25;
const PUEDE_EDITAR = ["Administrador", "Custodio"];

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ActivosListPage() {
  const { role } = useRole();
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [seleccionado, setSeleccionado] = useState(null);
  const [creando, setCreando] = useState(false);
  const search = useDebounced(q);

  const fetchActivos = useCallback(
    () => listActivos({ search, categoria, estado, page }),
    [search, categoria, estado, page],
  );
  const { data, loading, error, reload } = useApi(fetchActivos, [search, categoria, estado, page]);
  const { data: categorias } = useApi(listCategorias, []);

  const activos = data?.results ?? [];
  const total = data?.count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cambiarFiltro = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading && !data ? "Cargando…" : `${total} ${total === 1 ? "activo" : "activos"}`}
          </p>
        </div>
        {PUEDE_EDITAR.includes(role) && (
          <button
            onClick={() => setCreando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30"
          >
            <Plus className="w-4 h-4" />
            Registrar activo
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 flex-1 focus-within:border-fisc-500 focus-within:ring-2 focus-within:ring-fisc-500/20 transition">
          <Search size={15} className="text-slate-400" />
          <input
            value={q}
            onChange={cambiarFiltro(setQ)}
            placeholder="Buscar por descripción, código o tag RFID..."
            className="text-sm outline-none w-full text-slate-700"
          />
        </div>
        <select
          value={categoria}
          onChange={cambiarFiltro(setCategoria)}
          aria-label="Filtrar por categoría"
          className="text-sm border border-slate-200 rounded-lg shadow-sm px-3 bg-white text-slate-700 focus:outline-none focus:border-fisc-500 focus:ring-2 focus:ring-fisc-500/20"
        >
          <option value="">Todas las categorías</option>
          {(categorias?.results ?? categorias ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={estado}
          onChange={cambiarFiltro(setEstado)}
          aria-label="Filtrar por estado"
          className="text-sm border border-slate-200 rounded-lg shadow-sm px-3 bg-white text-slate-700 focus:outline-none focus:border-fisc-500 focus:ring-2 focus:ring-fisc-500/20"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="INOPERATIVO">Inoperativo</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
                <th className="text-left px-4 py-2 font-semibold">Descripción</th>
                <th className="text-left px-4 py-2 font-semibold">Código</th>
                <th className="text-left px-4 py-2 font-semibold">Categoría</th>
                <th className="text-left px-4 py-2 font-semibold">Ubicación</th>
                <th className="text-left px-4 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !data
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }, (_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 rounded bg-slate-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : activos.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSeleccionado(a)}
                      className="hover:bg-fisc-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-800">{a.descripcion}</td>
                      <td className="px-4 py-2.5 text-fisc-900 font-mono text-xs font-medium tracking-tight whitespace-nowrap">{a.codigo}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.categoria_nombre}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.ubicacion_nombre}</td>
                      <td className="px-4 py-2.5"><Badge tone={estadoTone(a.estado)}>{estadoLabel(a.estado)}</Badge></td>
                    </tr>
                  ))}
            </tbody>
          </table>
          </div>
        )}
        {!error && !loading && activos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <PackageSearch className="w-5 h-5" />
            </span>
            <p className="text-sm font-medium text-slate-800">Sin resultados</p>
            <p className="text-xs text-slate-500">Prueba con otra descripción, código o filtro.</p>
          </div>
        )}
        {!error && total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 text-xs text-slate-500">
            <span>Página {page} de {paginas}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= paginas}
                aria-label="Página siguiente"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ActivoDrawer activo={seleccionado} onClose={() => setSeleccionado(null)} />
      {creando && (
        <ActivoFormModal
          onClose={() => setCreando(false)}
          onSaved={() => {
            setCreando(false);
            setPage(1);
            reload();
          }}
        />
      )}
    </div>
  );
}
