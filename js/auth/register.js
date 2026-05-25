import { putUserData, getData } from "../shared/firebase.js";

let formSubmitted = false;

/** Clears all visible signup validation errors. */
const clearErrors = () => {
  showError("name-error", "");
  showError("email-error", "");
  showError("password-error", "");
  showError("confirm-error", "");
  showError("privacy-error", "");
};


function validateName(name) {
  if (!name) {
    showError("name-error", "Please enter your name");
    return false;
  }

  const regex = /^[A-Za-z]+ [A-Za-z]+$/;

  if (!regex.test(name.trim())) {
    showError("name-error", "Enter first & last name");
    return false;
  }

  showError("name-error", "");
  return true;
}

/** Validates the signup email field. */
function validateEmail(email) {
  if (!email) {
    showError("email-error", "Please enter your email");
    return false;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    showError("email-error", "Please enter a valid email");
    return false;
  }

  showError("email-error", "");
  return true;
}

/** Checks whether an email address already exists in storage. */
async function emailExists(email) {
  const users = await getData("users");

  if (!users) return false;

  for (let id in users) {
    if (users[id].email === email) {
      return true;
    }
  }

  return false;
}


function isValidPassword(password) {
  return password.length >= 3;
}

/** Validates the password rule requirements. */
function checkPasswordRule(password) {
  if (!password) {
    showError("password-error", "Please enter a password");
    return false;
  }

  if (!isValidPassword(password)) {
    showError("password-error", "Password too short");
    return false;
  }

  showError("password-error", "");
  return true;
}

/** Validates that the password confirmation matches. */
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

/** Validates the complete password input pair. */
function validatePassword(password, confirm) {
  if (!checkPasswordRule(password)) return false;

  if (!checkPasswordMatch(password, confirm)) return false;

  return true;
}

/** Validates the privacy-policy checkbox. */
function validatePrivacy(checked) {
  if (!checked) {
    showError("privacy-error", "Accept privacy policy");
    return false;
  }

  showError("privacy-error", "");
  return true;
}

/** Collects the current values from the signup form. */
function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    confirm: document.getElementById("confirm-password").value,
    privacy: document.getElementById("privacy").checked,
  };
}

/** Runs the full signup validation pipeline. */
function runValidation(userInput) {
  let valid = true;

  if (!validateName(userInput.name)) valid = false;

  if (!validateEmail(userInput.email)) valid = false;

  if (!validatePassword(userInput.password, userInput.confirm))
    valid = false;

  if (!validatePrivacy(userInput.privacy)) valid = false;

  return valid;
}

async function canRegisterUser(data) {
  if (await emailExists(data.email)) {
    showError("email-error", "Email already exists");
    return false;
  }

  return true;
}

/** Persists a newly registered user. */
async function registerUser(name, email, password) {
  const id = Date.now().toString();

  await putUserData("users/" + id, {
    name,
    email,
    password,
  });
}

/** Displays the signup success state. */
function finishSignup() {
  document
    .getElementById("success-modal")
    .classList.remove("hidden");

  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
  });
}

/** Handles the complete signup flow. */
async function handleSignup() {
  formSubmitted = true;

  clearErrors();

  const data = getFormData();

  if (!runValidation(data)) return;

  if (!(await canRegisterUser(data))) return;

  await registerUser(
    data.name,
    data.email,
    data.password
  );

  finishSignup();
}


function checkName(e) {
  if (!formSubmitted) return;

  validateName(e.target.value);
}

function checkEmail(e) {
  if (!formSubmitted) return;

  validateEmail(e.target.value);
}

function checkPassword() {
  if (!formSubmitted) return;

  validatePassword(
    document.getElementById("password").value,
    document.getElementById("confirm-password").value
  );
}

function checkConfirm() {
  if (!formSubmitted) return;

  validatePassword(
    document.getElementById("password").value,
    document.getElementById("confirm-password").value
  );
}

window.addEventListener("DOMContentLoaded", () => {
  const btn =
    document.getElementById("signup-btn");

  if (!btn) return;

  btn.addEventListener("click", handleSignup);

  document
    .getElementById("name")
    .addEventListener("input", checkName);

  document
    .getElementById("email")
    .addEventListener("input", checkEmail);

  document
    .getElementById("password")
    .addEventListener("input", checkPassword);

  document
    .getElementById("confirm-password")
    .addEventListener("input", checkConfirm);
});

document
  .getElementById("go-login")
  ?.addEventListener("click", () => {
    location.href = "index.html";
  });