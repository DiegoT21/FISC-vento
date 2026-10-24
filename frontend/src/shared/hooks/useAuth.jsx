import { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { guardarSesion, haySesionGuardada, limpiarToken } from "../api/sesion";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Sin token no hay nada que verificar: arrancamos ya "listos".
  const [cargando, setCargando] = useState(haySesionGuardada);
  const [errorConexion, setErrorConexion] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!haySesionGuardada()) return;
    let vigente = true;
    get(`${ENDPOINTS.USUARIOS}me/`)
      .then((u) => vigente && setUsuario(u))
      .catch((err) => {
        if (!vigente) return;
        // Solo un 401/403 significa que el token ya no vale. Un corte de red o
        // un 5xx no debe cerrar la sesión: se conserva el token y se reintenta.
        if (err.status === 401 || err.status === 403) limpiarToken();
        else setErrorConexion(true);
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [intento]);

  function reintentar() {
    setErrorConexion(false);
    if (!haySesionGuardada()) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setIntento((n) => n + 1);
  }

  async function login(email, password, recordar) {
    const data = await post(`${ENDPOINTS.USUARIOS}login/`, { email, password });
    guardarSesion(data.token, { recordar: Boolean(recordar), correo: email });
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    post(`${ENDPOINTS.USUARIOS}logout/`, {}).catch(() => {});
    limpiarToken();
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
