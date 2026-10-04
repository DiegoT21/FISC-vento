import { del, get, getBlob, patch, post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

// Lista paginada de la API (25 por página). `params` admite: search,
// categoria (id), estado, ubicacion (id), origen, page.
export function listarActivos(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return get(`${ENDPOINTS.ACTIVOS}${qs ? `?${qs}` : ""}`);
}

export const obtenerActivo = (id) => get(`${ENDPOINTS.ACTIVOS}${id}/`);

export const listarCategorias = () => get(`${ENDPOINTS.ACTIVOS}categorias/`);

export const crearActivo = (datos) => post(ENDPOINTS.ACTIVOS, datos);

export const crearCategoria = (nombre) => post(`${ENDPOINTS.ACTIVOS}categorias/`, { nombre });

export const listarTodasCategorias = () => listarTodos(`${ENDPOINTS.ACTIVOS}categorias/`);

export const actualizarActivo = (id, datos) => patch(`${ENDPOINTS.ACTIVOS}${id}/`, datos);

export const eliminarActivo = (id) => del(`${ENDPOINTS.ACTIVOS}${id}/`);

// Documentos
export const listarDocumentosActivo = (activoId) => listarTodos(`${ENDPOINTS.ACTIVOS}documentos/?activo=${activoId}`);

// Para enviar archivos necesitamos un postFormData en el cliente, o usar fetch directamente
export const subirDocumentoActivo = async (activoId, nombre, archivo) => {
  const token = localStorage.getItem("fisc_token");
  const formData = new FormData();
  formData.append("activo", activoId);
  formData.append("nombre", nombre);
  formData.append("archivo", archivo);

  const res = await fetch(`${ENDPOINTS.ACTIVOS}documentos/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: formData,
  });
  if (!res.ok) throw res;
  return res.json();
};

export const eliminarDocumentoActivo = (id) => del(`${ENDPOINTS.ACTIVOS}documentos/${id}/`);

// Imagen PNG del código de barras de un activo (para imprimir la etiqueta).
export const obtenerCodigoBarras = (id) => getBlob(`${ENDPOINTS.ESCANEO}activos/${id}/barras/`);
