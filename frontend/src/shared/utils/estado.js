// Estados y orígenes del modelo real (backend/apps/activos/models.py).

export const ESTADOS = {
  ACTIVO: { label: "Activo", tone: "good" },
  INACTIVO: { label: "Inactivo", tone: "neutral" },
  INOPERATIVO: { label: "Inoperativo", tone: "bad" },
};

export const ORIGENES = {
  COMPRADO: "Comprado",
  DONADO: "Donado",
};

export const estadoLabel = (estado) => ESTADOS[estado]?.label ?? estado;
export const estadoTone = (estado) => ESTADOS[estado]?.tone ?? "neutral";
export const origenLabel = (origen) => ORIGENES[origen] ?? "—";
