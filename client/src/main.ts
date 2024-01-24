const BASE_URL = "http://localhost:3000";
async function apiFetch(path: string, options?: RequestInit) {
  return await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
  });
}

async function main() {
  console.log(
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "rohat@icloud.com",
        password: "1234",
      }),
    }),
  );
}

main();
