const BASE_URL = "http://localhost:3000";
export async function apiFetch(path: string, options?: RequestInit) {
  return await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
  });
}
