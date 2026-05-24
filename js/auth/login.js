import { getData } from "../shared/firebase.js";

/** Clears the visible login validation errors. */
const clearErrors = () => {
  showError("email-error", "");
  showError("password-error", "");
};

/** Validates the login email field. */
function validateEmail(email) {
  if (!email) {
    showError("email-error", "Enter your email");
    return false;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    showError("email-error", "Please enter a valid email address");
    return false;
  }

  showError("email-error", "");
  return true;
}

/** Validates the login password field. */
function validatePassword(password) {
  if (!password)
    return showError("password-error", "Enter your password");

  showError("password-error", "");
  return true;
}

/** Validates the login credentials before authentication. */
function validateLogin(email, password) {
  if (!validateEmail(email)) return false;
  if (!validatePassword(password)) return false;
  return true;
}

/** Looks up a user id that matches the provided credentials. */
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

/** Logs in a user and redirects on success. */
async function loginUser(email, password) {
  clearErrors();
  const id = await authenticateUser(email, password);
  if (!id) return;
  await persistLoginSession(id);
  redirectToSummary();
}

/** Authenticates a user and reports invalid credentials. */
async function authenticateUser(email, password) {
  if (!validateLogin(email, password)) return null;
  const id = await checkUser(email, password);
  if (id) return id;
  showError("password-error", "Wrong email or password");
  return null;
}

/** Persists the login session details in local storage. */
async function persistLoginSession(id) {
  localStorage.setItem("user", id);
  let userName = await getData(`users/${id}/name`);
  localStorage.setItem("userName", userName);
  localStorage.setItem("greetingShown", "false");
}

/** Redirects the user to the summary page. */
function redirectToSummary() {
  location.href = "../html/summary.html";
}


/** Revalidates the email field on blur. */
function checkEmail(e) {
  validateEmail(e.target.value.trim());
}

/** Revalidates the password field on blur. */
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

  // GUEST LOGIN (richtig) Jeder User wird automatisch als "Guest" gespeichert auch wenn er sich normal einloggt ❌

  document.querySelector(".guest-btn")?.addEventListener("click", () => {
    localStorage.setItem("user", "guest");
    localStorage.setItem("userName", "Guest");

    location.href = "../html/summary.html";
  });

});