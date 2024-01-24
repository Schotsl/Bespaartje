import { apiFetch } from "./api";

async function verifyToken() {
  const response = await apiFetch("/auth/verify");

  const menu = document.getElementById("sidemenu")!;

  if (!response.ok) {
    menu.appendChild(createMenuItem("Login", "/login"));
    menu.appendChild(createMenuItem("Aanmelden", "/signup"));
    return;
  }

  menu.appendChild(createMenuItem("Uitjes", "/uitjes"));
  menu.appendChild(createMenuItem("Log uit", "/logout"));
}

function createMenuItem(label: string, href: string) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  li.appendChild(a);
  return li;
}

void verifyToken();
