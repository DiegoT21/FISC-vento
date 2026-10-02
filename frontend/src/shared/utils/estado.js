// Estados reales del backend (EstadoActivo).
export const ESTADO_ACTIVO = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  INOPERATIVO: "Inoperativo",
};

export const ORIGEN_ACTIVO = {
  COMPRADO: "Comprado",
  DONADO: "Donado",
};

export function estadoTone(estado) {
  if (estado === "ACTIVO" || estado === "EN USO") return "good";
  if (estado === "INOPERATIVO" || estado === "DAÑADO") return "bad";
  if (estado === "INACTIVO") return "warn";
  return "neutral";
}

// Solo lo usa el mock de Escaneo; el modelo real aún no tiene `estatus`.
export function estatusTone(estatus) {
  if (estatus === "EXISTE") return "good";
  if (estatus === "ADICIONAR") return "info";
  if (estatus === "EXTRAVIADO" || estatus === "NO EXISTE") return "bad";
  return "neutral";
}
