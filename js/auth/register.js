import { putUserData, getData } from "../shared/firebase.js";

let formSubmitted = false;

/**
 * Clears all visible signup validation errors.
 * 
 * Resets every field-specific error area before the
 * registration flow runs a fresh validation pass.
 */
const clearErrors = () => {
  showError("name-error", "");
  showError("email-error", "");
  showError("password-error", "");
  showError("confirm-error", "");
  showError("privacy-error", "");
};

/**
 * Validates the signup name field.
 * 
 * Ensures that a full name (first + last name) is entered.
 * Requires at least two words in alphabetical format.
 * 
 * @param {string} name - The full name entered by the user.
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Validates the signup email field.
 * 
 * Checks if the email is present and matches a valid format.
 * 
 * @param {string} email - The email entered by the user.
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Checks whether an email address already exists in the database.
 * 
 * Prevents duplicate registrations by scanning stored user entries.
 * 
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the email already exists.
 */
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

/**
 * Checks whether a password meets the minimum requirements.
 * 
 * Currently validates minimum length.
 * 
 * @param {string} password - The password entered by the user.
 * @returns {boolean} True if valid length, otherwise false.
 */
function isValidPassword(password) {
  return password.length >= 3;
}

/**
 * Validates password strength requirements.
 * 
 * Ensures password is not empty and meets minimum length rules.
 * 
 * @param {string} password - The password entered by the user.
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Validates that the password confirmation matches the password.
 * 
 * Ensures both password fields are identical.
 * 
 * @param {string} password - The original password.
 * @param {string} confirm - The confirmation password.
 * @returns {boolean} True if both match, otherwise false.
 */
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

/**
 * Validates the complete password input (rules + match check).
 * 
 * Combines password strength validation and confirmation check.
 * 
 * @param {string} password - The password entered by the user.
 * @param {string} confirm - The confirmation password.
 * @returns {boolean} True if valid, otherwise false.
 */
function validatePassword(password, confirm) {
  if (!checkPasswordRule(password)) return false;

  if (!checkPasswordMatch(password, confirm)) return false;

  return true;
}

/**
 * Validates whether the privacy policy checkbox is checked.
 * 
 * Ensures user acceptance of privacy policy before signup.
 * 
 * @param {boolean} checked - Whether the checkbox is selected.
 * @returns {boolean} True if accepted, otherwise false.
 */
function validatePrivacy(checked) {
  if (!checked) {
    showError("privacy-error", "Accept privacy policy");
    return false;
  }

  showError("privacy-error", "");
  return true;
}

/**
 * Collects all current values from the signup form.
 * 
 * @returns {Object} The form data object.
 * @returns {string} return.name - User's full name.
 * @returns {string} return.email - User's email.
 * @returns {string} return.password - User's password.
 * @returns {string} return.confirm - Password confirmation.
 * @returns {boolean} return.privacy - Privacy checkbox state.
 */
function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    confirm: document.getElementById("confirm-password").value,
    privacy: document.getElementById("privacy").checked,
  };
}

/**
 * Runs the full signup validation pipeline.
 * 
 * Executes all field validations and returns overall result.
 * 
 * @param {Object} userInput - The signup form data.
 * @returns {boolean} True if all validations pass.
 */
function runValidation(userInput) {
  let valid = true;

  if (!validateName(userInput.name)) valid = false;

  if (!validateEmail(userInput.email)) valid = false;

  if (!validatePassword(userInput.password, userInput.confirm))
    valid = false;

  if (!validatePrivacy(userInput.privacy)) valid = false;

  return valid;
}

/**
 * Checks whether a user can be registered (email uniqueness check).
 * 
 * @param {Object} data - User signup data.
 * @returns {Promise<boolean>} True if registration is allowed.
 */
async function canRegisterUser(data) {
  if (await emailExists(data.email)) {
    showError("email-error", "Email already exists");
    return false;
  }

  return true;
}

/**
 * Saves a newly registered user into the database.
 * 
 * Creates a unique user ID and stores user credentials.
 * 
 * @param {string} name - User's full name.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 */
async function registerUser(name, email, password) {
  const id = Date.now().toString();

  await putUserData("users/" + id, {
    name,
    email,
    password,
  });
}

/**
 * Displays the signup success state.
 * 
 * Shows success modal and triggers confetti animation.
 */
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

/**
 * Handles the complete signup flow.
 * 
 * Runs validation, checks for duplicates,
 * registers the user and shows success state.
 */
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

/**
 * Revalidates the name field after user input.
 * 
 * Only triggers validation after the first form submission.
 * 
 * @param {Event} e - Input event.
 */
function checkName(e) {
  if (!formSubmitted) return;

  validateName(e.target.value);
}

/**
 * Revalidates the email field after user input.
 * 
 * Only triggers validation after the first form submission.
 * 
 * @param {Event} e - Input event.
 */
function checkEmail(e) {
  if (!formSubmitted) return;

  validateEmail(e.target.value);
}

/**
 * Revalidates the password fields after user input.
 * 
 * Ensures both password and confirmation are validated together.
 */
function checkPassword() {
  if (!formSubmitted) return;

  validatePassword(
    document.getElementById("password").value,
    document.getElementById("confirm-password").value
  );
}

/**
 * Revalidates the confirmation field after user input.
 * 
 * Runs the combined password validation again so the confirmation
 * state always reflects the latest password values.
 */
function checkConfirm() {
  if (!formSubmitted) return;

  validatePassword(
    document.getElementById("password").value,
    document.getElementById("confirm-password").value
  );
}

/**
 * Registers the signup page event handlers after the DOM is ready.
 * 
 * Connects the signup button and live validation listeners
 * for the registration page.
 */
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