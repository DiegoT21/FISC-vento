import { ApiError, get, post } from "./client";
import { ENDPOINTS } from "./endpoints";

// Resuelve un activo a partir de lo leído (código de barras o tag RFID).
// Devuelve el activo, o null si el backend responde 404 (no existe).
export async function escanear(valor) {
  try {
    return await post(`${ENDPOINTS.ESCANEO}escanear/`, { valor });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// Imagen PNG del código de barras de un activo (Blob). Requiere el token, por eso
// no se puede usar directamente como `src` de un <img>.
export const getCodigoBarras = (activoId) => get(`${ENDPOINTS.ESCANEO}activos/${activoId}/barras/`);
