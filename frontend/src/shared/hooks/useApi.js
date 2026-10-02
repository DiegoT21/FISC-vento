import { useCallback, useEffect, useRef, useState } from "react";

// Carga datos de la API y expone { data, loading, error, reload }.
// `fetcher` debe ser estable (useCallback) o recibirse con `deps` explícitas.
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => id === seq.current && setState({ data, loading: false, error: null }))
      .catch((error) => id === seq.current && setState({ data: null, loading: false, error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const contador = seq;
    run();
    // Invalida la respuesta en vuelo si el componente se desmonta o cambian las dependencias.
    return () => {
      contador.current++;
    };
  }, [run]);

  return { ...state, reload: run };
}
