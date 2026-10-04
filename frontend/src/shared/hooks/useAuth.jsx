import { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const TOKEN_KEY = "fisc_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Sin token no hay nada que verificar: arrancamos ya "listos".
  const [cargando, setCargando] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [errorConexion, setErrorConexion] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    let vigente = true;
    get(`${ENDPOINTS.USUARIOS}me/`)
      .then((u) => vigente && setUsuario(u))
      .catch((err) => {
        if (!vigente) return;
        // Solo un 401/403 significa que el token ya no vale. Un corte de red o
        // un 5xx no debe cerrar la sesión: se conserva el token y se reintenta.
        if (err.status === 401 || err.status === 403) localStorage.removeItem(TOKEN_KEY);
        else setErrorConexion(true);
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [intento]);

  function reintentar() {
    setErrorConexion(false);
    setCargando(true);
    setIntento((n) => n + 1);
  }

  async function login(email, password) {
    const data = await post(`${ENDPOINTS.USUARIOS}login/`, { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    post(`${ENDPOINTS.USUARIOS}logout/`, {}).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, errorConexion, reintentar, autenticado: !!usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
