import { get } from "./client";
import { ENDPOINTS } from "./endpoints";

// Conteos del Panel principal (una sola petición). `traslados_pendientes`
// llega en null para los roles sin acceso al módulo de Traslados.
export const obtenerResumen = () => get(`${ENDPOINTS.REPORTES}resumen/`);

// Distribución del inventario para las gráficas de Reportes (por estado,
// departamento y categoría). Solo Administrador y Auditor.
export const obtenerDistribucion = () => get(`${ENDPOINTS.REPORTES}distribucion/`);
