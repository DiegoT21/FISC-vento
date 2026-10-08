import { get } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarLogsAuditoria = () => listarTodos(ENDPOINTS.AUDITORIA);

// Historial de cambios de un activo (paginado de 25 en 25, más reciente primero).
export function listarHistorialActivo(id, page = 1) {
  const query = new URLSearchParams({ tabla: "activo", objeto_id: id, page });
  return get(`${ENDPOINTS.AUDITORIA}?${query}`);
}
