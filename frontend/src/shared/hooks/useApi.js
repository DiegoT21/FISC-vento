import { useEffect, useState } from "react";

// Ejecuta `fn` cuando cambian `deps` y expone { data, error, cargando }.
// Descarta respuestas de peticiones viejas (búsqueda al teclear).
export function useApi(fn, deps) {
  const [estado, setEstado] = useState({ data: null, error: null, cargando: true });

  useEffect(() => {
    let vigente = true;
    setEstado((s) => ({ ...s, cargando: true, error: null }));
    fn()
      .then((data) => vigente && setEstado({ data, error: null, cargando: false }))
      .catch((error) => vigente && setEstado({ data: null, error, cargando: false }));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return estado;
}
