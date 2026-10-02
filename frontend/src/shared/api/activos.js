import { get, patch, post } from "./client";
import { ENDPOINTS } from "./endpoints";

function query(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Los listados de DRF vienen paginados ({ count, next, previous, results }).
export const listActivos = (params) => get(`${ENDPOINTS.ACTIVOS}${query(params)}`);
export const getActivo = (id) => get(`${ENDPOINTS.ACTIVOS}${id}/`);
export const createActivo = (data) => post(ENDPOINTS.ACTIVOS, data);
export const updateActivo = (id, data) => patch(`${ENDPOINTS.ACTIVOS}${id}/`, data);

export const listCategorias = () => get(ENDPOINTS.CATEGORIAS);
export const listDepartamentos = () => get(ENDPOINTS.DEPARTAMENTOS);
export const getResumen = () => get(ENDPOINTS.REPORTES_RESUMEN);
