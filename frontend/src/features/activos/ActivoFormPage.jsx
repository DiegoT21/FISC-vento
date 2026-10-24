import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ESTADO_ACTIVO, ORIGEN_ACTIVO } from "../../shared/utils/estado";
import { mensajeDeError } from "../../shared/utils/errores";
import {
  actualizarActivo,
  crearActivo,
  crearCategoria,
  listarTodasCategorias,
  obtenerActivo,
} from "../../shared/api/activos";
import { listarTodosDepartamentos } from "../../shared/api/ubicaciones";
import { useApi } from "../../shared/hooks/useApi";
import { useRole } from "../../shared/hooks/useRole";

const VACIO = {
  codigo: "",
  tag_rfid: "",
  ref: "",
  numero_serie: "",
  descripcion: "",
  marca: "",
  modelo: "",
  categoria: "",
  ubicacion: "",
  origen: "",
  estado: "ACTIVO",
};

// Convierte un activo de la API en valores de formulario (todo texto, sin null).
const aFormulario = (a) =>
  Object.fromEntries(Object.keys(VACIO).map((campo) => [campo, a[campo] == null ? "" : String(a[campo])]));

const inputCls = "w-full min-h-11 text-base sm:text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 outline-none focus:border-fisc-600";

function Campo({ label, requerido, error, ayuda, children }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">
        {label}
        {requerido && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {ayuda && !error && <p className="text-xs text-slate-400 mt-1">{ayuda}</p>}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </label>
  );
}

// Los errores de DRF llegan como { campo: ["mensaje", ...] }.
const mensajeCampo = (errores, campo) => errores?.[campo]?.join(" ");

// Carga el activo (si se edita) y monta el formulario ya con sus datos.
export default function ActivoFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const tagLeido = id ? "" : (params.get("tag") ?? "").trim();
  const navigate = useNavigate();
  const existente = useApi(() => (id ? obtenerActivo(id) : Promise.resolve(null)), [id]);

  if (id && (existente.cargando || existente.error || !existente.data)) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate(tagLeido ? "/dashboard/por-editar" : `/dashboard/activos/${id}`)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ChevronLeft size={16} /> {tagLeido ? "Volver a Por editar" : "Volver al activo"}
        </button>
        <p className="text-sm text-slate-500">
          {existente.cargando ? "Cargando..." : mensajeDeError(existente.error, "No se pudo cargar el activo.")}
        </p>
      </div>
    );
  }

  const inicial = existente.data
    ? aFormulario(existente.data)
    : { ...VACIO, tag_rfid: tagLeido };
  return <FormularioActivo key={id ?? `nuevo-${tagLeido}`} id={id} inicial={inicial} desdeTag={Boolean(tagLeido)} />;
}

function FormularioActivo({ id, inicial, desdeTag = false }) {
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { role } = useRole();
  const [form, setForm] = useState(inicial);
  const [errores, setErrores] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [recargaCat, setRecargaCat] = useState(0);
  const [nuevaCat, setNuevaCat] = useState(null); // null = oculto, string = texto en edición
  const [errorCat, setErrorCat] = useState("");
  const categorias = useApi(listarTodasCategorias, [recargaCat]);
  const departamentos = useApi(listarTodosDepartamentos, []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const destino = editando ? `/dashboard/activos/${id}` : desdeTag ? "/dashboard/por-editar" : "/dashboard/activos";

  async function agregarCategoria() {
    const nombre = (nuevaCat ?? "").trim();
    if (!nombre) return;
    setErrorCat("");
    try {
      const nueva = await crearCategoria(nombre);
      setNuevaCat(null);
      setForm((f) => ({ ...f, categoria: String(nueva.id) }));
      setRecargaCat((n) => n + 1);
    } catch (err) {
      setErrorCat(mensajeDeError(err, "No se pudo crear la categoría."));
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setErrores(null);
    setErrorGeneral("");
    if (!form.categoria) {
      setErrores({ categoria: ["Escribe de qué es y pulsa Crear."] });
      return;
    }
    setGuardando(true);
    const datos = {
      ...form,
      categoria: Number(form.categoria),
      ubicacion: Number(form.ubicacion),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim(),
      // Opcionales y únicos: vacío = sin valor (el servidor lo guarda como NULL).
      tag_rfid: form.tag_rfid.trim() || null,
      ref: form.ref.trim() || null,
      numero_serie: form.numero_serie.trim() || null,
    };
    try {
      const activo = editando ? await actualizarActivo(id, datos) : await crearActivo(datos);
      navigate(`/dashboard/activos/${activo.id}`);
    } catch (err) {
      if (err.status === 400 && err.data) setErrores(err.data);
      else setErrorGeneral(mensajeDeError(err, "No se pudo guardar el activo. Intenta de nuevo."));
      setGuardando(false);
    }
  }

  const volver = (
    <button type="button" onClick={() => navigate(destino)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
      <ChevronLeft size={16} /> {editando ? "Volver al activo" : desdeTag ? "Volver a Por editar" : "Volver al listado"}
    </button>
  );

  if (role === "Auditor") {
    return (
      <div className="space-y-4">
        {volver}
        <p className="text-sm text-slate-500">Tu rol no permite {editando ? "editar" : "registrar"} activos.</p>
      </div>
    );
  }

  const listaCategorias = categorias.data ?? [];
  const cargandoListas = categorias.cargando || departamentos.cargando;
  const errorListas = categorias.error || departamentos.error;

  return (
    <div className="space-y-4 max-w-2xl">
      {volver}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {editando ? "Editar activo" : desdeTag ? "Completar ficha del tag" : "Registrar activo"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {desdeTag
            ? "Asigna el nombre, de qué es, el departamento y la ubicación, más el resto de la ficha. El tag RFID ya viene leído."
            : "Los campos con * son obligatorios."}
        </p>
      </div>

      {errorListas && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar las categorías o ubicaciones. Recarga la página.
        </p>
      )}

      <form onSubmit={enviar} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Código" requerido error={mensajeCampo(errores, "codigo")} ayuda="Número de activo / Servitac (placa), p. ej. SVT-118423.">
            <input required maxLength={50} value={form.codigo} onChange={set("codigo")} className={`${inputCls} font-mono`} />
          </Campo>
          <Campo label="REF" error={mensajeCampo(errores, "ref")} ayuda="Correlativo interno. Opcional.">
            <input maxLength={50} value={form.ref} onChange={set("ref")} className={`${inputCls} font-mono`} />
          </Campo>
          <Campo label="Número de serie" error={mensajeCampo(errores, "numero_serie")} ayuda="Opcional, no puede repetirse.">
            <input maxLength={100} value={form.numero_serie} onChange={set("numero_serie")} className={`${inputCls} font-mono`} />
          </Campo>
          <Campo label="Tag RFID" error={mensajeCampo(errores, "tag_rfid")} ayuda="Opcional. Déjalo vacío si el activo no tiene etiqueta.">
            <input maxLength={100} value={form.tag_rfid} onChange={set("tag_rfid")} className={`${inputCls} font-mono`} />
          </Campo>
        </div>

        <Campo label="Nombre" requerido error={mensajeCampo(errores, "descripcion")} ayuda="Cómo se reconoce el activo.">
          <input required maxLength={255} value={form.descripcion} onChange={set("descripcion")} className={inputCls} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Marca" error={mensajeCampo(errores, "marca")}>
            <input maxLength={100} value={form.marca} onChange={set("marca")} className={inputCls} />
          </Campo>
          <Campo label="Modelo" error={mensajeCampo(errores, "modelo")}>
            <input maxLength={100} value={form.modelo} onChange={set("modelo")} className={inputCls} />
          </Campo>
          <Campo
            label="De qué es"
            requerido
            error={mensajeCampo(errores, "categoria") || (listaCategorias.length === 0 ? errorCat : "")}
            ayuda={listaCategorias.length === 0 ? "Todavía no hay categorías. Escribe la primera y créala." : "Categoría del activo."}
          >
            {listaCategorias.length === 0 ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  maxLength={100}
                  value={nuevaCat ?? ""}
                  onChange={(e) => setNuevaCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (nuevaCat?.trim()) agregarCategoria();
                    }
                  }}
                  placeholder="Equipo, mobiliario..."
                  className={`${inputCls} min-w-0 sm:flex-1`}
                />
                <button
                  type="button"
                  disabled={!nuevaCat?.trim()}
                  onClick={agregarCategoria}
                  className="min-h-11 shrink-0 bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            ) : (
              <select required value={form.categoria} onChange={set("categoria")} disabled={cargandoListas} className={inputCls}>
                <option value="">Selecciona...</option>
                {listaCategorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo label="Departamento y ubicación" requerido error={mensajeCampo(errores, "ubicacion")} ayuda="El grupo es el departamento; la opción, el lugar.">
            <select required value={form.ubicacion} onChange={set("ubicacion")} disabled={cargandoListas} className={inputCls}>
              <option value="">Selecciona...</option>
              {(departamentos.data ?? []).map((d) => (
                <optgroup key={d.id} label={d.nombre}>
                  {d.ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Campo>
          <Campo label="Origen" error={mensajeCampo(errores, "origen")}>
            <select value={form.origen} onChange={set("origen")} className={inputCls}>
              <option value="">Sin especificar</option>
              {Object.entries(ORIGEN_ACTIVO).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Estado" requerido error={mensajeCampo(errores, "estado")}>
            <select required value={form.estado} onChange={set("estado")} className={inputCls}>
              {Object.entries(ESTADO_ACTIVO).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </Campo>
        </div>

        {listaCategorias.length > 0 && nuevaCat === null ? (
          <button type="button" onClick={() => setNuevaCat("")} className="text-sm text-fisc-800 hover:underline">
            + Nueva categoría
          </button>
        ) : listaCategorias.length > 0 ? (
          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                autoFocus
                maxLength={100}
                value={nuevaCat}
                onChange={(e) => setNuevaCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (nuevaCat.trim()) agregarCategoria();
                  }
                }}
                placeholder="Nombre de la categoría"
                className={`${inputCls} min-w-0 sm:flex-1`}
              />
              <div className="flex gap-2">
                <button type="button" disabled={!nuevaCat.trim()} onClick={agregarCategoria} className="min-h-11 flex-1 sm:flex-none bg-fisc-800 hover:bg-fisc-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-fisc-500/30 disabled:opacity-50">
                  Crear categoría
                </button>
                <button type="button" onClick={() => { setNuevaCat(null); setErrorCat(""); }} className="min-h-11 flex-1 sm:flex-none text-sm px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </div>
            {errorCat && <p className="text-xs text-red-700">{errorCat}</p>}
          </div>
        ) : null}

        {errores?.non_field_errors && (
          <p className="text-sm text-red-700">{errores.non_field_errors.join(" ")}</p>
        )}
        {errorGeneral && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorGeneral}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate(destino)} className="min-h-11 text-sm px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando || cargandoListas} className="min-h-11 bg-fisc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : desdeTag ? "Guardar ficha" : "Registrar activo"}
          </button>
        </div>
      </form>
    </div>
  );
}
