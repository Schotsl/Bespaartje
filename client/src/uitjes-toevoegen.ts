import { apiFetch } from "./api";

let users = [];

const formElement = document.getElementById("toevoegen-form")!;
const listElement = document.getElementById("toevoegen-form-list")!;
const searchElement = document.getElementById(
  "email-search"
)! as HTMLInputElement;

async function searchUser(email: string) {
  const response = await apiFetch(`/user/${email}`);

  if (response.ok) {
    const parsed = await response.json();

    const titleElement = document.createElement("span");
    const inputElement = document.createElement("input");
    const buttonElement = document.createElement("button");

    titleElement.textContent = parsed.name;

    inputElement.type = "number";
    inputElement.value = "0";
    inputElement.required = true;
    inputElement.addEventListener("change", (event) => {
      const value = parseFloat((event.target as HTMLInputElement).value);

      // Find the user in the users array and update the amount
      users = users.map((user) => {
        if (user.user_id === parsed.id) {
          user.amount = value;
        }

        return user;
      });
    });

    buttonElement.textContent = "Verwijderen";
    buttonElement.addEventListener("click", () => {
      listElement.removeChild(liElement);

      // Remove the user from the users array if deleted is pressed
      users = users.filter((user) => user.user_id !== parsed.id);
    });

    const liElement = document.createElement("li");

    liElement.appendChild(titleElement);
    liElement.appendChild(inputElement);
    liElement.appendChild(buttonElement);

    listElement.appendChild(liElement);

    // Add the user to the users array so we can insert it later
    users.push({
      user_id: parsed.id,
      amount: 0,
      amount_paid: 0,
    });

    // Reset search
    searchElement.value = "";
  }
}

// If user stops typing for 200ms search for the user
let timeout: number;

searchElement.addEventListener("keyup", function () {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    searchUser(searchElement.value);
  }, 200);
});

formElement.addEventListener("submit", async (event) => {
  event.preventDefault();
  // Read title from event target
  const title = (event.target as HTMLFormElement).title.value;
  console.log({
    title,
    users,
  });
  const response = await apiFetch("/uitje", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      users,
    }),
  });

  window.location.href = "/uitjes";
});
