import { del, patch, post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

const DEPARTAMENTOS = `${ENDPOINTS.UBICACIONES}departamentos/`;

export const listarTodosDepartamentos = () => listarTodos(DEPARTAMENTOS);

export const crearDepartamento = (nombre) => post(DEPARTAMENTOS, { nombre });
export const renombrarDepartamento = (id, nombre) => patch(`${DEPARTAMENTOS}${id}/`, { nombre });
export const eliminarDepartamento = (id) => del(`${DEPARTAMENTOS}${id}/`);

export const crearUbicacion = (departamento, nombre) => post(ENDPOINTS.UBICACIONES, { departamento, nombre });
export const renombrarUbicacion = (id, nombre) => patch(`${ENDPOINTS.UBICACIONES}${id}/`, { nombre });
export const eliminarUbicacion = (id) => del(`${ENDPOINTS.UBICACIONES}${id}/`);
