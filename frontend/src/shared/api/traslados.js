import { post } from "./client";
import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarTraslados = () => listarTodos(ENDPOINTS.TRASLADOS);

export const crearTraslado = (datos) => post(ENDPOINTS.TRASLADOS, datos);

export const autorizarTraslado = (id) => post(`${ENDPOINTS.TRASLADOS}${id}/autorizar/`, {});
