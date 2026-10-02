import { get, post } from "./client";
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

export const crearActivo = (datos) => post(ENDPOINTS.ACTIVOS, datos);

// Sigue la paginación de la API hasta traer todas las filas (para selectores).
async function listarTodos(path) {
  const filas = [];
  let pagina = await get(path);
  filas.push(...pagina.results);
  while (pagina.next) {
    pagina = await get(`${path}?page=${new URL(pagina.next).searchParams.get("page")}`);
    filas.push(...pagina.results);
  }
  return filas;
}

export const listarTodasCategorias = () => listarTodos(`${ENDPOINTS.ACTIVOS}categorias/`);
export const listarTodosDepartamentos = () => listarTodos(`${ENDPOINTS.UBICACIONES}departamentos/`);
