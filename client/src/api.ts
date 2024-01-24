const BASE_URL = "http://localhost:3000";

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("token");

  return await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
}
