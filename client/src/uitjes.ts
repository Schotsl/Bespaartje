import { apiFetch } from "./api";

loadUitjes();

async function loadUitjes() {
  const response = await apiFetch("/uitje");
  const uitjes = await response.json();

  console.log(uitjes);

  const ul = document.getElementById("uitjes-list")!;

  for (const uitje of uitjes) {
    let total = 0;

    uitje.users.forEach((user) => {
      total += user.amount;
    });

    const titleElement = document.createElement("h2");
    const totalElement = document.createElement("h3");

    titleElement.textContent = uitje.title;
    totalElement.textContent = `€ ${total}`;

    const liElement = document.createElement("li");

    liElement.appendChild(titleElement);
    liElement.appendChild(totalElement);

    ul.appendChild(liElement);
  }
}

// document
//   .getElementById("signup-form")!
//   .addEventListener("submit", async (event) => {
//     event.preventDefault();

//     const email = (document.getElementById("email") as HTMLInputElement).value;
//     const name = (document.getElementById("name") as HTMLInputElement).value;
//     const password = (document.getElementById("password") as HTMLInputElement)
//       .value;

//     const response = await apiFetch("/auth/signup", {
//       method: "POST",
//       body: JSON.stringify({
//         name,
//         email,
//         password,
//       }),
//     });
//   });
