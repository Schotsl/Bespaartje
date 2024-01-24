import { apiFetch } from "./api";

document
  .getElementById("signup-form")!
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = (document.getElementById("email") as HTMLInputElement).value;
    const name = (document.getElementById("name") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    const response = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (!response.ok) {
      return alert(
        "Er is iets misgegaan tijdens het aanmelden. Probeer het later opnieuw.",
      );
    }

    window.location.href = "/login.html";
  });
