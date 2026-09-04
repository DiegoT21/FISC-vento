// Thin fetch wrapper. No real backend yet — this only scaffolds the shape
// so features can start swapping mock data for real calls incrementally.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, { method = "GET", body, headers, ...rest } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`API request failed (${response.status} ${response.statusText})${message ? `: ${message}` : ""}`);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export const get = (path, options) => request(path, { ...options, method: "GET" });
export const post = (path, body, options) => request(path, { ...options, method: "POST", body });
export const put = (path, body, options) => request(path, { ...options, method: "PUT", body });
export const del = (path, options) => request(path, { ...options, method: "DELETE" });
