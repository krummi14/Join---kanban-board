import { getData } from "../shared/firebase.js";


let loginSubmitted = false;

/** Animates splash logo exactly to the header logo position. */
function animateSplashLogo() {

  const splashLogo = document.querySelector(".splash_logo");
  const headerLogo = document.querySelector(".logo");

  if (!splashLogo || !headerLogo) return;

  const headerRect = headerLogo.getBoundingClientRect();

  const logoWidth = headerRect.width;
  const logoHeight = headerRect.height;

  const startX = window.innerWidth / 2 - logoWidth / 2;
  const startY = window.innerHeight / 2 - logoHeight / 2;

  splashLogo.style.width = `${logoWidth}px`;
  splashLogo.style.height = `${logoHeight}px`;

  const animation = splashLogo.animate(
    [
      {
        transform: `translate(${startX}px, ${startY}px) scale(1.6)`,
        opacity: 1,
      },
      {
        transform: `translate(${startX}px, ${startY}px) scale(1)`,
        opacity: 1,
        offset: 0.65,
      },
      {
        transform: `translate(${headerRect.left}px, ${headerRect.top}px) scale(1)`,
        opacity: 0.1,
      }
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards",
    }
  );

  animation.onfinish = () => {

    setTimeout(() => {

      splashLogo.style.transition = "opacity 0.25s ease";
      splashLogo.style.opacity = "0";

      headerLogo.style.opacity = "1";

      setTimeout(() => {
        splashLogo.style.display = "none";
      }, 250);

    }, 80);
  };
}

const clearErrors = () => {
  showError("email-error", "");
  showError("password-error", "");
};

/**
 * Validates the login email field.
 * 
 * Checks if the email is present and matches a valid email format.
 * Displays an error message if validation fails.
 * 
 * @param {string} email - The email entered by the user.
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Validates the login password field.
 * 
 * Ensures the password is not empty before login.
 * Displays an error message if validation fails.
 * 
 * @param {string} password - The password entered by the user.
 * @returns {boolean} True if valid, otherwise false.
 */
function validatePassword(password) {
  if (!password) {
    showError("password-error", "Enter your password");
    return false;
  }

  showError("password-error", "");
  return true;
}

/**
 * Validates login credentials before authentication.
 * 
 * Runs email and password validation and combines results.
 * 
 * @param {string} email - The email entered by the user.
 * @param {string} password - The password entered by the user.
 * @returns {boolean} True if both fields are valid.
 */
function validateLogin(email, password) {
  let isValid = true;

  if (!validateEmail(email)) isValid = false;
  if (!validatePassword(password)) isValid = false;

  return isValid;
}

/**
 * Searches for a user that matches the provided credentials.
 * 
 * Queries the database and returns the user ID if email
 * and password match an existing account.
 * 
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string|null>} The user ID or null if not found.
 */
async function checkUser(email, password) {
  const users = await getData("users");

  if (!users) return null;

  for (let id in users) {
    let user = users[id];

    if (user.email === email && user.password === password) {
      return id;
    }
  }

  return null;
}

/**
 * Logs in a user and redirects on successful authentication.
 * 
 * Clears previous errors, authenticates the user,
 * stores session data, and redirects to summary page.
 * 
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
async function loginUser(email, password) {
  loginSubmitted = true;

  clearErrors();

  const id = await authenticateUser(email, password);

  if (!id) return;

  await persistLoginSession(id);

  redirectToSummary();
}

/**
 * Authenticates the user credentials.
 * 
 * Validates input fields and checks credentials against the database.
 * Shows an error message if authentication fails.
 * 
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string|null>} The user ID if valid, otherwise null.
 */
async function authenticateUser(email, password) {
  if (!validateLogin(email, password)) return null;

  const id = await checkUser(email, password);

  if (id) return id;

  showError("password-error", "Wrong email or password");

  return null;
}

/**
 * Saves the login session to local storage.
 * 
 * Stores user ID, username, and greeting state for later use.
 * 
 * @param {string} id - The authenticated user ID.
 */
async function persistLoginSession(id) {
  localStorage.setItem("user", id);

  let userName = await getData(`users/${id}/name`);

  localStorage.setItem("userName", userName);
  localStorage.setItem("greetingShown", "false");
}

/**
 * Redirects the user to the summary page after login.
 */
function redirectToSummary() {
  location.href = "../html/summary.html";
}

/**
 * Revalidates the email field after user interaction.
 * 
 * Only triggers validation if a login attempt has already been made.
 * 
 * @param {Event} e - Input blur event.
 */
function checkEmail(e) {
  if (!loginSubmitted) return;

  validateEmail(e.target.value.trim());
}
/**
 * Revalidates the password field after user interaction.
 * 
 * Only triggers validation after the first login attempt.
 * 
 * @param {Event} e - Input blur event.
 */
function checkPassword(e) {
  if (!loginSubmitted) return;

  validatePassword(e.target.value);
}

document.addEventListener("DOMContentLoaded", () => {

  animateSplashLogo();

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

  // Guest Login
  document.querySelector(".guest-btn")?.addEventListener("click", () => {

    localStorage.setItem("user", "guest");
    localStorage.setItem("userName", "Guest");

    location.href = "../html/summary.html";
  });

});