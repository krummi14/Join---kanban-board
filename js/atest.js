import { getData } from "./firebase.js";

// JavaScript for Add Task Page
let assigneeContacts = [];
let selectedAssignees = [];

document.addEventListener("DOMContentLoaded", initAddTask);

async function initAddTask() {
  const userName = localStorage.getItem("userName");

  if (userName !== 'Guest') {
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }

  await renderAssigneeContacts();
  document.addEventListener("click", closeAssigneeDropdownOnOutsideClick);
}

// Function for priority buttons
// Priority Button Functions
function resetPriorityButtons() {
  const priorities = ["urgent", "medium", "low"];

  priorities.forEach((priority) => {
    const button = document.getElementById("prio_" + priority);
    button.classList.remove("active");
    button.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_off.svg" alt="Button ${capitalize(priority)}">`;
  });
}

// Set the priority and update button states
function setPriority(priority) {
  const currentButton = document.getElementById("prio_" + priority);
  const isAlreadyActive = currentButton.classList.contains("active");

  resetPriorityButtons();

  if (isAlreadyActive) {
    return;
  }

  currentButton.classList.add("active");
  currentButton.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_on.svg" alt="Button ${capitalize(priority)}">`;
}

// Utility function to capitalize the first letter of a string
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// a function to show all contacts in the assignee dropdown with checkboxes
async function renderAssigneeContacts() {
  const dropdownMenu = document.getElementById("assigneeDropdownMenu");

  if (!dropdownMenu) {
    return;
  }

  dropdownMenu.innerHTML = '<div class="assignee_status">Loading contacts...</div>';

  try {
    assigneeContacts = await fetchContacts();
  } catch (error) {
    dropdownMenu.innerHTML = '<div class="assignee_status">Unable to load contacts.</div>';
    console.error("Failed to load contacts for assignee dropdown.", error);
    return;
  }

  if (assigneeContacts.length === 0) {
    dropdownMenu.innerHTML = '<div class="assignee_status">No contacts available.</div>';
    updateAssigneeLabel();
    return;
  }

  dropdownMenu.innerHTML = assigneeContacts.map((contact) => createAssigneeOption(contact)).join("");
  updateAssigneeLabel();
}

async function fetchContacts() {
  const contacts = await getData("contacts");

  if (!contacts) {
    return [];
  }

  return Object.entries(contacts)
    .filter(([, contact]) => contact && typeof contact === "object")
    .map(([id, contact]) => ({
      id,
      name: contact.name || "Unnamed contact",
      email: contact.email || "",
    }))
    .sort((firstContact, secondContact) => firstContact.name.localeCompare(secondContact.name));
}

function createAssigneeOption(contact) {
  const safeName = escapeHtml(contact.name);
  const safeEmail = escapeHtml(contact.email);

  return `
    <label class="assignee_option" for="assignee_${contact.id}">
      <span class="assignee_option_text">
        <span class="assignee_option_name">${safeName}</span>
        <span class="assignee_option_email">${safeEmail}</span>
      </span>
      <input type="checkbox" id="assignee_${contact.id}" value="${contact.id}" onchange="toggleAssigneeSelection('${contact.id}')">
    </label>
  `;
}

function toggleAssigneeDropdown() {
  const dropdownMenu = document.getElementById("assigneeDropdownMenu");
  const toggleButton = document.getElementById("assignee");

  if (!dropdownMenu || !toggleButton) {
    return;
  }

  const isOpen = dropdownMenu.classList.toggle("open");
  toggleButton.setAttribute("aria-expanded", String(isOpen));
}

function closeAssigneeDropdownOnOutsideClick(event) {
  const dropdownWrapper = document.querySelector(".assignee_dropdown");
  const dropdownMenu = document.getElementById("assigneeDropdownMenu");
  const toggleButton = document.getElementById("assignee");

  if (!dropdownWrapper || !dropdownMenu || !toggleButton) {
    return;
  }

  if (dropdownWrapper.contains(event.target)) {
    return;
  }

  dropdownMenu.classList.remove("open");
  toggleButton.setAttribute("aria-expanded", "false");
}

function toggleAssigneeSelection(contactId) {
  const selectedIndex = selectedAssignees.indexOf(contactId);

  if (selectedIndex >= 0) {
    selectedAssignees.splice(selectedIndex, 1);
  } else {
    selectedAssignees.push(contactId);
  }

  updateAssigneeLabel();
}

function updateAssigneeLabel() {
  const assigneeLabel = document.getElementById("assigneeLabel");

  if (!assigneeLabel) {
    return;
  }

  if (selectedAssignees.length === 0) {
    assigneeLabel.textContent = "Select contacts to assign";
    return;
  }

  const selectedNames = assigneeContacts
    .filter((contact) => selectedAssignees.includes(contact.id))
    .map((contact) => contact.name);

  assigneeLabel.textContent = selectedNames.join(", ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.setPriority = setPriority;
window.toggleAssigneeDropdown = toggleAssigneeDropdown;
window.toggleAssigneeSelection = toggleAssigneeSelection;
