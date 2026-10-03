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

// Imagen PNG del código de barras de un activo (para imprimir la etiqueta).
export const obtenerCodigoBarras = (id) => getBlob(`${ENDPOINTS.ESCANEO}activos/${id}/barras/`);
