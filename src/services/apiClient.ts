// ─── Cliente HTTP base ────────────────────────────────────────────────────────
// Wrapper liviano sobre fetch. No añade dependencias externas.
// Cuando el equipo defina autenticación (JWT, cookies, etc.) se agrega aquí.
//
// Para conectar un endpoint real: cambiar VITE_USE_MOCK=false en .env.local
// y asegurarse de que VITE_API_URL apunta al servidor del backend.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${getToken()}`,  ← descomentar cuando haya auth
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, res.statusText, text);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string)                   => request<T>(path),
  post:   <T>(path: string, body: unknown)    => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)    => request<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)    => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(path: string)                   => request<T>(path, { method: "DELETE" }),
};
