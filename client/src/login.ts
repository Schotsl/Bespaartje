import { apiFetch } from "./api";

document
  .getElementById("login-form")!
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      return alert(
        "Er is iets misgegaan tijdens het inloggen. Probeer het later opnieuw.",
      );
    }

    const { token } = await response.json();

    localStorage.setItem("token", token);

    window.location.href = "/uitjes.html";
  });
