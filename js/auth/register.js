import { putUserData, getData } from "../shared/firebase.js";

let formSubmitted = false;

const clearErrors = () => {
  showError("name-error", "");
  showError("email-error", "");
  showError("password-error", "");
  showError("confirm-error", "");
  showError("privacy-error", "");
};

function showOrClear(errorId, message, show) {
  if (!show) return;
  showError(errorId, message);
}







function validateName(name) {
  if (!name) {
    showError("name-error", "Please enter your name");
    return false;
  }

  const regex = /^[A-Za-z]+ [A-Za-z]+$/;

  if (!regex.test(name)) {
    showError("name-error", "Enter first & last name");
    return false;
  }

  showError("name-error", "");
  return true;
}

function validateEmail(email) {
  if (!email) {
    showError("email-error", "Please enter your email");
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

async function emailExists(email) {
  const users = await getData("users");
  if (!users) return false;

  for (let id in users) {
    if (users[id].email === email) return true;
  }
  return false;
}

function passwordsMatch(password, confirm) {
  return password === confirm;
}

function isValidPassword(password) {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  return regex.test(password);
}

function checkPasswordRule(password) {
  if (!password) {
    showError("password-error", "Please enter a password");
    return false;
  }

  if (!isValidPassword(password)) {
    showError("password-error", "8+ chars, 1 number, 1 special");
    return false;
  }

  showError("password-error", "");
  return true;
}

function checkPasswordMatch(password, confirm) {
  if (!confirm) {
    showError("confirm-error", "Please confirm your password");
    return false;
  }

  if (password !== confirm) {
    showError("confirm-error", "Passwords do not match");
    return false;
  }

  showError("confirm-error", "");
  return true;
}

function validatePassword(password, confirm) {
  if (!checkPasswordRule(password)) return false;
  if (!checkPasswordMatch(password, confirm)) return false;
  return true;
}

function validatePrivacy(checked) {
  if (!checked) {
    showError("privacy-error", "Accept privacy policy");
    return false;
  }
  return true;
}

function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    confirm: document.getElementById("confirm-password").value,
    privacy: document.getElementById("privacy").checked,
  };
}

function runValidation(userInput) {
  if (!validateName(userInput.name)) return false;
  if (!validateEmail(userInput.email)) return false;
  if (!validatePassword(userInput.password, userInput.confirm)) return false;
  if (!validatePrivacy(userInput.privacy)) return false;
  return true;
}

async function registerUser(name, email, password) {
  const id = Date.now().toString();
  await putUserData("users/" + id, { name, email, password });
}

function finishSignup() {
  document.getElementById("success-modal").classList.remove("hidden");

  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
  });
}

async function handleSignup() {
  clearErrors();
  const data = getFormData();
  if (!runValidation(data)) return;
  if (!await canRegisterUser(data)) return;
  await registerUser(data.name, data.email, data.password);
  finishSignup();
}

async function canRegisterUser(data) {
  if (!runValidation(data)) return false;
  if (!await emailExists(data.email)) return true;
  showError("email-error", "Email already exists");
  return false;
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("signup-btn");

  console.log("BUTTON FOUND:", btn);

  if (!btn) return;

  btn.addEventListener("click", () => {
    console.log("CLICK WORKS");
    handleSignup();
  });
});

function checkName(e) {
  if (!formSubmitted) return;
  validateName(e.target.value);
}


function checkEmail(e) {
  if (!formSubmitted) return;
  validateEmail(e.target.value);
}

function checkPassword(e) {
  if (!formSubmitted) return;

  validatePassword(
    e.target.value,
    document.getElementById("confirm-password").value
  );
}
function checkConfirm(e) {
  if (!formSubmitted) return;

  validatePassword(
    document.getElementById("password").value,
    e.target.value
  );
}

document.getElementById("name").addEventListener("blur", checkName);

document.getElementById("email").addEventListener("blur", checkEmail);

document.getElementById("password").addEventListener("blur", checkPassword);

document
  .getElementById("confirm-password")
  .addEventListener("blur", checkConfirm);

document.getElementById("go-login")?.addEventListener("click", () => {
  location.href = "index.html";
});

function toggleSignupButton() {
  const data = getFormData();

  const valid =
    validateName(data.name) &&
    validateEmail(data.email) &&
    validatePassword(data.password, data.confirm) &&
    validatePrivacy(data.privacy);

  document.getElementById("signup-btn").disabled = !valid;
}

document
  .querySelectorAll("input")
  .forEach((input) => input.addEventListener("input", toggleSignupButton));
