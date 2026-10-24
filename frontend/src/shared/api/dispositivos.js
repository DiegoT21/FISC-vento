import { post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

// URL que irá dentro del QR: la pública configurada, o el origen desde el que
// el administrador usa la web.
const URL_PUBLICA = import.meta.env.VITE_URL_PUBLICA || window.location.origin;

export const generarVinculacion = () =>
  post(`${ENDPOINTS.DISPOSITIVOS}vinculacion/`, { url_base: URL_PUBLICA });

export const listarDispositivos = () => listarTodos(ENDPOINTS.DISPOSITIVOS);

export const revocarDispositivo = (id) => post(`${ENDPOINTS.DISPOSITIVOS}${id}/revocar/`, {});