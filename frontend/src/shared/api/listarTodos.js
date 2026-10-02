import { get } from "./client";

// Sigue la paginación de la API hasta traer todas las filas (para selectores
// y vistas que necesitan el conjunto completo).
export async function listarTodos(path) {
  const filas = [];
  let pagina = await get(path);
  filas.push(...pagina.results);
  while (pagina.next) {
    pagina = await get(`${path}?page=${new URL(pagina.next).searchParams.get("page")}`);
    filas.push(...pagina.results);
  }
  return filas;
}
