import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 outline-none focus:border-fisc-600";

function Campo({ label, requerido, error, ayuda, children }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">
        {label}
        {requerido && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {ayuda && !error && <p className="text-xs text-gray-400 mt-1">{ayuda}</p>}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </label>
  );
}

// Los errores de DRF llegan como { campo: ["mensaje", ...] }.
const mensajeCampo = (errores, campo) => errores?.[campo]?.join(" ");

// Carga el activo (si se edita) y monta el formulario ya con sus datos.
export default function ActivoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existente = useApi(() => (id ? obtenerActivo(id) : Promise.resolve(null)), [id]);

  if (id && (existente.cargando || existente.error || !existente.data)) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate(`/dashboard/activos/${id}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Volver al activo
        </button>
        <p className="text-sm text-gray-500">
          {existente.cargando ? "Cargando..." : mensajeDeError(existente.error, "No se pudo cargar el activo.")}
        </p>
      </div>
    );
  }

  return <FormularioActivo key={id ?? "nuevo"} id={id} inicial={existente.data ? aFormulario(existente.data) : VACIO} />;
}

function FormularioActivo({ id, inicial }) {
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
  const destino = editando ? `/dashboard/activos/${id}` : "/dashboard/activos";

  async function agregarCategoria() {
    setErrorCat("");
    try {
      const nueva = await crearCategoria(nuevaCat.trim());
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
    <button type="button" onClick={() => navigate(destino)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
      <ChevronLeft size={16} /> {editando ? "Volver al activo" : "Volver al listado"}
    </button>
  );

  if (role === "Auditor") {
    return (
      <div className="space-y-4">
        {volver}
        <p className="text-sm text-gray-500">Tu rol no permite {editando ? "editar" : "registrar"} activos.</p>
      </div>
    );
  }

  const cargandoListas = categorias.cargando || departamentos.cargando;
  const errorListas = categorias.error || departamentos.error;

  return (
    <div className="space-y-4 max-w-2xl">
      {volver}
      <div>
        <h1 className="text-lg font-medium text-gray-900">{editando ? "Editar activo" : "Registrar activo"}</h1>
        <p className="text-sm text-gray-500">Los campos con * son obligatorios.</p>
      </div>

      {errorListas && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          No se pudieron cargar las categorías o ubicaciones. Recarga la página.
        </p>
      )}

      <form onSubmit={enviar} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
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

        <Campo label="Descripción" requerido error={mensajeCampo(errores, "descripcion")}>
          <input required maxLength={255} value={form.descripcion} onChange={set("descripcion")} className={inputCls} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Marca" error={mensajeCampo(errores, "marca")}>
            <input maxLength={100} value={form.marca} onChange={set("marca")} className={inputCls} />
          </Campo>
          <Campo label="Modelo" error={mensajeCampo(errores, "modelo")}>
            <input maxLength={100} value={form.modelo} onChange={set("modelo")} className={inputCls} />
          </Campo>
          <Campo label="Categoría" requerido error={mensajeCampo(errores, "categoria")}>
            <select required value={form.categoria} onChange={set("categoria")} disabled={cargandoListas} className={inputCls}>
              <option value="">Selecciona...</option>
              {(categorias.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Ubicación" requerido error={mensajeCampo(errores, "ubicacion")}>
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

        {nuevaCat === null ? (
          <button type="button" onClick={() => setNuevaCat("")} className="text-sm text-fisc-800 hover:underline">
            + Nueva categoría
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex gap-2">
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
                className={`${inputCls} flex-1`}
              />
              <button type="button" disabled={!nuevaCat.trim()} onClick={agregarCategoria} className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
                Crear categoría
              </button>
              <button type="button" onClick={() => { setNuevaCat(null); setErrorCat(""); }} className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
            {errorCat && <p className="text-xs text-red-700">{errorCat}</p>}
          </div>
        )}

        {errores?.non_field_errors && (
          <p className="text-sm text-red-700">{errores.non_field_errors.join(" ")}</p>
        )}
        {errorGeneral && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorGeneral}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate(destino)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando || cargandoListas} className="bg-fisc-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-fisc-900 disabled:opacity-50">
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar activo"}
          </button>
        </div>
      </form>
    </div>
  );
}
