
/*
window.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash_screen');

    if (localStorage.getItem('splashPlayed')) {
        splash.style.display = 'none';
        return;
    }

    localStorage.setItem('splashPlayed', 'true');

    // Animation als Css oder coden?
});

*/
import { getData } from "./firebase.js";

const isEmpty = (e, p) => !e || !p;
const isValidEmail = (e) => e.includes("@");

const showError = (id, msg) =>
  document.getElementById(id).textContent = msg;

const clearErrors = () => {
  showError("email-error", "");
  showError("password-error", "");
};

async function checkUser(email, password) {
  const users = await getData("users");
  if (!users) return null;

  for (let id in users) {
    let u = users[id];
    if (u.email === email && u.password === password) return id;
  }
  return null;
}

async function loginUser(email, password) {

  clearErrors();

  if (!email) return showError("email-error", "Enter your email");
  if (!password) return showError("password-error", "Enter your password");

  if (!isValidEmail(email))
    return showError("email-error", "Invalid email address");

  const id = await checkUser(email, password);

  if (!id)
    return showError("password-error", "Wrong email or password");

  localStorage.setItem("user", id);
  location.href = "summary.html";
}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("login-btn").addEventListener("click", () => {
    loginUser(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  });

  document.querySelectorAll(".signup-btn").forEach(btn =>
    btn.addEventListener("click", () =>
      location.href = "register.html"
    )
  );

  document.querySelector(".guest-btn")?.addEventListener("click", () =>
    location.href = "summary.html"
  );

});