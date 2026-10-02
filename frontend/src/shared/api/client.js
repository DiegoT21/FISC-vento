// Thin fetch wrapper around the Django API. Attaches the auth token
// (set by useAuth on login) to every request automatically.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "fisc_token";

async function request(path, { method = "GET", body, headers, ...rest } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // cuerpo no JSON (p. ej. página HTML de error del servidor)
    }
    const error = new Error(`API request failed (${response.status} ${response.statusText})${text ? `: ${text}` : ""}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export const get = (path, options) => request(path, { ...options, method: "GET" });
export const post = (path, body, options) => request(path, { ...options, method: "POST", body });
export const put = (path, body, options) => request(path, { ...options, method: "PUT", body });
export const patch = (path, body, options) => request(path, { ...options, method: "PATCH", body });
export const del = (path, options) => request(path, { ...options, method: "DELETE" });

// Descarga un archivo binario (p. ej. la imagen del código de barras) que
// requiere el token, así que no se puede usar directo en un <img src>.
export async function getBlob(path) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
  if (!response.ok) {
    const error = new Error(`API request failed (${response.status} ${response.statusText})`);
    error.status = response.status;
    throw error;
  }
  return response.blob();
}
