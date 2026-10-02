import { get } from "./client";
import { ENDPOINTS } from "./endpoints";

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
