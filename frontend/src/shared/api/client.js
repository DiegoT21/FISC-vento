// Thin fetch wrapper around the Django API. Attaches the auth token
// (set by useAuth on login) to every request automatically.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "fisc_token";

export class ApiError extends Error {
  constructor(status, statusText, data) {
    super(`API request failed (${status} ${statusText})`);
    this.status = status;
    // Cuerpo parseado de la respuesta: DRF devuelve { campo: ["mensaje"] } en errores de validación.
    this.data = data;
  }
}

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
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
      // cuerpo no-JSON (p. ej. HTML de un 500): se deja como texto
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.startsWith("image/")) return response.blob();
  return contentType.includes("application/json") ? response.json() : response.text();
}

export const get = (path, options) => request(path, { ...options, method: "GET" });
export const post = (path, body, options) => request(path, { ...options, method: "POST", body });
export const put = (path, body, options) => request(path, { ...options, method: "PUT", body });
export const patch = (path, body, options) => request(path, { ...options, method: "PATCH", body });
export const del = (path, options) => request(path, { ...options, method: "DELETE" });
