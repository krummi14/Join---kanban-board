import { putData, getData } from "./firebase.js";

const showError = (fieldId, message) =>
  (document.getElementById(fieldId).textContent = message);

const clearErrors = () => {
  showError("name-error", "");
  showError("email-error", "");
  showError("password-error", "");
  showError("confirm-error", "");
  showError("privacy-error", "");
};

function validateName(name) {
  const regex = /^[A-Za-z]+ [A-Za-z]+$/;
  if (!regex.test(name)) {
    showError("name-error", "Enter first & last name, letters only.");
    return false;
  }
  showError("name-error", "");
  return true;
}

function validateEmail(email) {
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
  await putData("users/" + id, { name, email, password });
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

  if (await emailExists(data.email)) {
    showError("email-error", "Email already exists");
    return;
  }

  await registerUser(data.name, data.email, data.password);

  finishSignup();
}

document.getElementById("signup-btn").addEventListener("click", handleSignup);

function checkName(inputEvent) {
  validateName(inputEvent.target.value);
}
function checkEmail(inputEvent) {
  validateEmail(inputEvent.target.value);
}
function checkPassword(inputEvent) {
  validatePassword(
    inputEvent.target.value,
    document.getElementById("confirm-password").value,
  );
}
function checkConfirm(inputEvent) {
  validatePassword(
    document.getElementById("password").value,
    inputEvent.target.value,
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
