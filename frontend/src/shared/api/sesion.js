// Dónde vive el token. La contraseña no se guarda nunca.
//
// Con «Recordar», el token queda en localStorage y sobrevive a cerrar el
// navegador o la PWA (el servidor lo caduca a los 30 días del último ingreso).
// Sin marcarlo, va en una cookie sin fecha de expiración: el navegador la
// comparte entre pestañas y la borra al cerrar la sesión, como una cookie
// de sesión. El cliente la lee solo para armar el header Authorization; no
// es la sesión de Django.

const TOKEN_KEY = "fisc_token";
const CORREO_KEY = "fisc_correo";
const EXPIRA_KEY = "fisc_token_expira";
const RECORDAR_KEY = "fisc_recordar";
const COOKIE_SESION = "fisc_sesion";
const DIAS_RECORDAR = 30;

function leerCookie(nombre) {
  const prefijo = `${nombre}=`;
  for (const parte of document.cookie.split(";")) {
    const item = parte.trim();
    if (item.startsWith(prefijo)) return decodeURIComponent(item.slice(prefijo.length));
  }
  return null;
}

function escribirCookieSesion(token) {
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_SESION}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${seguro}`;
}

function borrarCookieSesion() {
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_SESION}=; Path=/; Max-Age=0; SameSite=Lax${seguro}`;
}

export function leerCorreoRecordado() {
  try {
    return localStorage.getItem(CORREO_KEY) || "";
  } catch {
    return "";
  }
}

export function preferenciaRecordar() {
  try {
    return localStorage.getItem(RECORDAR_KEY) === "1";
  } catch {
    return false;
  }
}

function tokenPersistenteVigente() {
  let token = null;
  let expira = 0;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    expira = Number(localStorage.getItem(EXPIRA_KEY) || 0);
  } catch {
    return null;
  }
  if (!token) return null;
  // Sin fecha (sesión de una versión anterior) manda el servidor.
  if (expira && Date.now() > expira) {
    limpiarToken();
    return null;
  }
  return token;
}

export function leerToken() {
  return tokenPersistenteVigente() || leerCookie(COOKIE_SESION);
}

export function haySesionGuardada() {
  return Boolean(leerToken());
}

export function guardarSesion(token, { recordar, correo }) {
  limpiarToken();
  if (recordar) {
    const expira = Date.now() + DIAS_RECORDAR * 24 * 60 * 60 * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRA_KEY, String(expira));
    localStorage.setItem(RECORDAR_KEY, "1");
    if (correo) localStorage.setItem(CORREO_KEY, correo);
    else localStorage.removeItem(CORREO_KEY);
    return;
  }
  escribirCookieSesion(token);
  try {
    localStorage.removeItem(RECORDAR_KEY);
    localStorage.removeItem(CORREO_KEY);
  } catch {
    // Si el almacenamiento está bloqueado, la cookie de sesión igual vale.
  }
}

export function limpiarToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRA_KEY);
  } catch {
    // localStorage puede fallar en modo privado muy restrictivo.
  }
  borrarCookieSesion();
}
