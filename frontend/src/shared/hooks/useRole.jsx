import { useAuth } from "./useAuth";

// El backend guarda el rol en mayúsculas (ADMINISTRADOR/CUSTODIO/AUDITOR);
// el resto de la app (NAV de Sidebar, textos, etc.) usa Título-Caso.
const ROL_DISPLAY = {
  ADMINISTRADOR: "Administrador",
  CUSTODIO: "Custodio",
  AUDITOR: "Auditor",
};

export function useRole() {
  const { usuario } = useAuth();
  const role = usuario ? ROL_DISPLAY[usuario.rol] ?? usuario.rol : null;
  return { role };
}
