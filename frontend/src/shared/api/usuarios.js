import { del, patch, post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarUsuarios = () => listarTodos(ENDPOINTS.USUARIOS);

export const crearUsuario = (datos) => post(ENDPOINTS.USUARIOS, datos);

export const actualizarUsuario = (id, datos) => patch(`${ENDPOINTS.USUARIOS}${id}/`, datos);

export const eliminarUsuario = (id) => del(`${ENDPOINTS.USUARIOS}${id}/`);
