import { apiFetch } from "./api";

loadUitjes();

async function loadUitjes() {
  const response = await apiFetch("/uitje");
  const uitjes = await response.json();

  const ul = document.getElementById("uitjes-list")!;

  for (const uitje of uitjes) {
    let total = 0;

    const titleElement = document.createElement("h2");
    const totalElement = document.createElement("h3");
    const usersElement = document.createElement("ul");

    uitje.users.forEach((user) => {
      total += user.amount;
      usersElement.innerHTML += `<li>${user.name}  <span>/ € ${user.amount}</span></li>`;
    });

    titleElement.textContent = uitje.title;
    totalElement.textContent = `€ ${total}`;

    const liElement = document.createElement("li");

    liElement.appendChild(titleElement);
    liElement.appendChild(totalElement);
    liElement.appendChild(usersElement);

    ul.appendChild(liElement);
  }
}
