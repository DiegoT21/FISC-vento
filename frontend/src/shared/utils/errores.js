// Traduce un error de la API (ver shared/api/client.js: lleva `status` y
// `data`) a un mensaje para la persona, sin códigos ni jerga técnica.
export function mensajeDeError(err, porDefecto = "No se pudo completar la acción. Intenta de nuevo.") {
  if (err?.status === 403) return "No tienes permiso para hacer esto.";
  if (err?.status === 404) return "Ya no existe. Recarga la página.";
  if (err?.status === 409 && err.data?.detail) return err.data.detail;
  if (err?.status === 400 && err.data) {
    // Formato de DRF: { campo: ["mensaje", ...] } o { non_field_errors: [...] }.
    const mensajes = Object.values(err.data).flat().filter((m) => typeof m === "string");
    if (mensajes.length > 0) return mensajes.join(" ");
  }
  return porDefecto;
}
