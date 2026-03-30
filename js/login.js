import { getData } from "./firebase.js";


const showError = (id, msg) =>
  document.getElementById(id).textContent = msg;

const clearErrors = () => {
  showError("email-error", "");
  showError("password-error", "");
};


function validateEmail(email) {
  if (!email) return showError("email-error", "Enter your email");

  if (!email.includes("@"))
    return showError("email-error", "Invalid email address");

  showError("email-error", "");
  return true;
}

function validatePassword(password) {
  if (!password)
    return showError("password-error", "Enter your password");

  showError("password-error", "");
  return true;
}

function validateLogin(email, password) {
  if (!validateEmail(email)) return false;
  if (!validatePassword(password)) return false;
  return true;
}


async function checkUser(email, password) {
  const users = await getData("users");
  if (!users) return null;

  for (let id in users) {
    let u = users[id];
    if (u.email === email && u.password === password)
     return id;
  }
  return null;
}


async function loginUser(email, password) {

  clearErrors();

  if (!validateLogin(email, password)) return;

  const id = await checkUser(email, password);

  if (!id)
    return showError("password-error", "Wrong email or password");

  localStorage.setItem("user", id);

  let userName = await getData(`users/${id}/name`);
  localStorage.setItem("userName", userName);
  
  location.href = "../html/summary.html";
}


function checkEmail(e) {
  validateEmail(e.target.value.trim());
}

function checkPassword(e) {
  validatePassword(e.target.value);
}


document.addEventListener("DOMContentLoaded", () => {


  document.getElementById("login-btn")
    .addEventListener("click", () => {
      loginUser(
        document.getElementById("email").value.trim(),
        document.getElementById("password").value
      );
    });


  document.getElementById("email")
    .addEventListener("blur", checkEmail);

  document.getElementById("password")
    .addEventListener("blur", checkPassword);


  document.querySelectorAll(".signup-btn").forEach(btn =>
    btn.addEventListener("click", () =>
      location.href = "register.html"
    )
  );
  let userName = 'Guest';
  localStorage.setItem("userName", userName);
  document.querySelector(".guest-btn")?.addEventListener("click", () =>
    location.href = "../html/summary.html"
  );

});