import { get } from "./client";
import { ENDPOINTS } from "./endpoints";

// Conteos del Panel principal (una sola petición). `traslados_pendientes`
// llega en null para los roles sin acceso al módulo de Traslados.
export const obtenerResumen = () => get(`${ENDPOINTS.REPORTES}resumen/`);
