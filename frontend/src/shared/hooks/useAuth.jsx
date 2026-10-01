import { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const TOKEN_KEY = "fisc_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCargando(false);
      return;
    }
    get(`${ENDPOINTS.USUARIOS}me/`)
      .then(setUsuario)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setCargando(false));
  }, []);

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
    <AuthContext.Provider value={{ usuario, cargando, autenticado: !!usuario, login, logout }}>
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
