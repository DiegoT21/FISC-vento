import { post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarTodosDepartamentos = () => listarTodos(`${ENDPOINTS.UBICACIONES}departamentos/`);

export const crearDepartamento = (nombre) => post(`${ENDPOINTS.UBICACIONES}departamentos/`, { nombre });

export const crearUbicacion = (departamento, nombre) => post(ENDPOINTS.UBICACIONES, { departamento, nombre });
