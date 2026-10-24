import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { descartarTagPorEditar, listarTagsPorEditar } from "../../shared/api/activos";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";
import { mensajeDeError } from "../../shared/utils/errores";

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function PorEditarPage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const puedeEditar = role === "Administrador" || role === "Custodio";
  const [recarga, setRecarga] = useState(0);
  const { data, error, cargando } = useApi(listarTagsPorEditar, [recarga]);
  const tags = data ?? [];
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    const id = setInterval(() => setRecarga((n) => n + 1), 4000);
    return () => clearInterval(id);
  }, []);

  async function descartar(tag) {
    if (!window.confirm(`¿Quitar ${tag.epc} de Por editar? El tag no se registra.`)) return;
    setErrorAccion("");
    try {
      await descartarTagPorEditar(tag.id);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorAccion(mensajeDeError(err, "No se pudo quitar el tag."));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Por editar</h1>
        <p className="text-sm text-slate-500 mt-1">
          {cargando && !data
            ? "Cargando..."
            : "Cuando el TC22r lee un tag nuevo, aparece aquí para completar su ficha."}
        </p>
      </div>

      {errorAccion && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorAccion}</p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudo cargar la lista de tags.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200/80">
                <th className="text-left px-4 py-2 font-semibold">Tag RFID</th>
                <th className="text-left px-4 py-2 font-semibold">Leído</th>
                <th className="text-right px-4 py-2 font-semibold">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tags.map((tag) => (
                <tr className="hover:bg-fisc-50/60 transition-colors" key={tag.id}>
                  <td className="px-4 py-2.5 font-mono text-slate-800">{tag.epc}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {fecha(tag.leido_en)}
                    {tag.leido_por_nombre && (
                      <span className="block text-xs text-slate-400">por {tag.leido_por_nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {puedeEditar && (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/activos/nuevo?tag=${encodeURIComponent(tag.epc)}`)}
                          className="min-h-11 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                        >
                          Completar ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => descartar(tag)}
                          className="min-h-11 text-sm px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {cargando && tags.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-500">Cargando...</td></tr>
              )}
              {!cargando && tags.length === 0 && !error && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    No hay tags pendientes. Lee uno con el TC22r y aparecerá aquí.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
