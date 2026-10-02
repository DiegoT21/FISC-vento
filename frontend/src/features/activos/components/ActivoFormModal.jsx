import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { createActivo, listCategorias, listDepartamentos } from "../../../shared/api/activos";
import { ApiError } from "../../../shared/api/client";
import { useApi } from "../../../shared/hooks/useApi";
import { ESTADOS, ORIGENES } from "../../../shared/utils/estado";

const VACIO = { codigo: "", descripcion: "", categoria: "", ubicacion: "", origen: "", tag_rfid: "", estado: "ACTIVO" };

const inputBase =
  "w-full text-sm bg-white border rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition";
const inputOk = "border-slate-200 focus:border-fisc-500 focus:ring-fisc-500/20";
const inputErr = "border-red-300 focus:border-red-500 focus:ring-red-500/20";

function Campo({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

// DRF responde { campo: ["mensaje", ...] }; se aplana al primer mensaje por campo.
function erroresPorCampo(err) {
  if (!(err instanceof ApiError) || typeof err.data !== "object" || err.data === null) return null;
  return Object.fromEntries(
    Object.entries(err.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
  );
}

export default function ActivoFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const { data: categorias } = useApi(listCategorias, []);
  const { data: departamentos } = useApi(listDepartamentos, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !guardando && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onClose]);

  const set = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (!form.codigo.trim()) nuevos.codigo = "El código es obligatorio.";
    if (!form.descripcion.trim()) nuevos.descripcion = "La descripción es obligatoria.";
    if (!form.categoria) nuevos.categoria = "Elige una categoría.";
    if (!form.ubicacion) nuevos.ubicacion = "Elige una ubicación.";
    if (Object.keys(nuevos).length) return setErrores(nuevos);

    setGuardando(true);
    setErrorGeneral("");
    try {
      await createActivo({
        ...form,
        codigo: form.codigo.trim(),
        descripcion: form.descripcion.trim(),
        // Un string vacío chocaría con la restricción de unicidad del tag; null = "sin tag".
        tag_rfid: form.tag_rfid.trim() || null,
      });
      onSaved();
    } catch (err) {
      const porCampo = erroresPorCampo(err);
      if (porCampo && Object.keys(porCampo).some((k) => k in VACIO)) setErrores(porCampo);
      else setErrorGeneral("No se pudo guardar el activo. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const listaCategorias = categorias?.results ?? categorias ?? [];
  const listaDeptos = departamentos?.results ?? departamentos ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Registrar activo">
      <div className="absolute inset-0 bg-slate-900/30" onClick={() => !guardando && onClose()} />
      <form
        onSubmit={enviar}
        noValidate
        className="relative w-full max-w-lg max-h-full overflow-auto bg-white rounded-xl shadow-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
          <h2 className="text-base font-semibold text-slate-800">Registrar activo</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1.5 -m-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <Campo id="codigo" label="Código" error={errores.codigo} hint="Código de inventario, p. ej. SVT-118423">
            <input id="codigo" value={form.codigo} onChange={set("codigo")} autoFocus className={`${inputBase} font-mono ${errores.codigo ? inputErr : inputOk}`} />
          </Campo>
          <Campo id="tag_rfid" label="Tag RFID (opcional)" error={errores.tag_rfid}>
            <input id="tag_rfid" value={form.tag_rfid} onChange={set("tag_rfid")} className={`${inputBase} font-mono ${errores.tag_rfid ? inputErr : inputOk}`} />
          </Campo>
          <div className="col-span-2">
            <Campo id="descripcion" label="Descripción" error={errores.descripcion}>
              <input id="descripcion" value={form.descripcion} onChange={set("descripcion")} className={`${inputBase} ${errores.descripcion ? inputErr : inputOk}`} />
            </Campo>
          </div>
          <Campo id="categoria" label="Categoría" error={errores.categoria}>
            <select id="categoria" value={form.categoria} onChange={set("categoria")} className={`${inputBase} ${errores.categoria ? inputErr : inputOk}`}>
              <option value="">Selecciona…</option>
              {listaCategorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          <Campo id="ubicacion" label="Ubicación" error={errores.ubicacion}>
            <select id="ubicacion" value={form.ubicacion} onChange={set("ubicacion")} className={`${inputBase} ${errores.ubicacion ? inputErr : inputOk}`}>
              <option value="">Selecciona…</option>
              {listaDeptos.map((d) => (
                <optgroup key={d.id} label={d.nombre}>
                  {d.ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </optgroup>
              ))}
            </select>
          </Campo>
          <Campo id="origen" label="Origen" error={errores.origen}>
            <select id="origen" value={form.origen} onChange={set("origen")} className={`${inputBase} ${inputOk}`}>
              <option value="">Sin especificar</option>
              {Object.entries(ORIGENES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <Campo id="estado" label="Estado" error={errores.estado}>
            <select id="estado" value={form.estado} onChange={set("estado")} className={`${inputBase} ${inputOk}`}>
              {Object.entries(ESTADOS).map(([v, e]) => <option key={v} value={v}>{e.label}</option>)}
            </select>
          </Campo>
        </div>

        {errorGeneral && <p role="alert" className="px-5 pb-2 text-sm text-red-600">{errorGeneral}</p>}

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200/80">
          <button type="button" onClick={onClose} disabled={guardando} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 px-4 py-2 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30 disabled:opacity-60">
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar activo
          </button>
        </div>
      </form>
    </div>
  );
}
