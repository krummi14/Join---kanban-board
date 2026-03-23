import { putData } from "./firebase.js";


async function registerUser(email, password) {
  const id = Date.now().toString();

  await putData("users/" + id, {
    email: email,
    password: password
  });

  alert("Registered! You can now login.");
}

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("register-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    registerUser(email, password);
  });

});