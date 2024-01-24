document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (token) {
    // If the user is logged in we'll replace the navigation with the logged in navigation
    const nav = document.querySelector("nav")!;

    nav.innerHTML = `
      <nav>
        <img src="https://cdn.pixabay.com/animation/2023/06/08/15/03/15-03-45-927_512.gif" class="logo" />
        <ul id="sidemenu">
            <li><a href="/">Home</a></li>
            <li><a href="/uitjes">Uitjes</a></li>
            <i class="fa-solid fa-xmark" onclick="closemenu()"></i>
        </ul>
        <i class="fa-solid fa-bars" onclick="openmenu()"></i>
      </nav>
    `;

    // If the user is on the login or signup page we'll redirect them to the home page
    if (
      window.location.pathname === "/login" ||
      window.location.pathname === "/signup"
    ) {
      window.location.href = "/";
    }
  }
});
