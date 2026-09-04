export function estadoTone(estado) {
  if (estado === "EN USO") return "good";
  if (estado === "DAÑADO") return "bad";
  return "neutral";
}

export function estatusTone(estatus) {
  if (estatus === "EXISTE") return "good";
  if (estatus === "ADICIONAR") return "info";
  if (estatus === "EXTRAVIADO" || estatus === "NO EXISTE") return "bad";
  return "neutral";
}
