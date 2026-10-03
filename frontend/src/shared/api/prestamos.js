import { get, post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarPrestamos = () => listarTodos(ENDPOINTS.PRESTAMOS);

export const crearPrestamo = (datos) => post(ENDPOINTS.PRESTAMOS, datos);
