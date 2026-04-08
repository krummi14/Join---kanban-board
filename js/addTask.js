import { getData, putUserData } from "./firebase.js";  //es gibt kein putData! in firebase JS

let assigneeContacts = [];
let selectedAssignees = [];
let subtasks = [];
let selectedPriority = "";

document.addEventListener("DOMContentLoaded", initAddTask);

async function initAddTask() {
  const userName = localStorage.getItem("userName");
  const taskForm = document.getElementById("taskForm");

  if (userName !== 'Guest') {
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }

  setupSubtaskControls();
  renderAssigneeContacts();
  document.addEventListener("click", closeAssigneeDropdownOnOutsideClick);
  taskForm.addEventListener("reset", resetTaskFormState);
  taskForm.addEventListener("submit", handleTaskSubmit);
}

// Functions for priority buttons
function resetPriorityButtons() {
  const priorities = ["urgent", "medium", "low"];

  priorities.forEach((priority) => {
    const button = document.getElementById("prio_" + priority);
    button.classList.remove("active");
    button.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_off.svg" alt="Button ${capitalize(priority)}">`;
  });
}

function setPriority(priority) {
  const currentButton = document.getElementById("prio_" + priority);
  const isAlreadyActive = currentButton.classList.contains("active");

  resetPriorityButtons();
  if (isAlreadyActive) {
    selectedPriority = "";
    return;
  }

  currentButton.classList.add("active");
  currentButton.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_on.svg" alt="Button ${capitalize(priority)}">`;
  selectedPriority = priority;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// assignee dropdown functions
async function renderAssigneeContacts() {
  const dropdownMenu = document.getElementById("assigneeDropdownMenu");

  try {
    assigneeContacts = await fetchContacts();
  } catch (error) {
    dropdownMenu.innerHTML = '<div class="assignee_status">Can not load contacts.</div>';
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
      name: contact.name,
    }))
    .sort((firstContact, secondContact) => firstContact.name.localeCompare(secondContact.name));
}

function toggleAssigneeDropdown() {
  const isOpen = document.getElementById("assigneeDropdownMenu").classList.toggle("open");
  document.getElementById("assignee").setAttribute("aria-expanded", String(isOpen));
}

function closeAssigneeDropdownOnOutsideClick(event) {
  const dropdownWrapper = document.querySelector(".assignee_dropdown");
  const dropdownMenu = document.getElementById("assigneeDropdownMenu");
  const toggleButton = document.getElementById("assignee");

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
  const selectedContacts = document.getElementById("selectedContacts");

  const selectedNames = assigneeContacts
    .filter((contact) => selectedAssignees.includes(contact.id))
    .map((contact) => contact.name);

  selectedContacts.textContent = selectedNames.map(getContactInitials).join(" ");
}

function getContactInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// create and manage subtasks
function setupSubtaskControls() {
  const subtaskInput = document.getElementById("subtask");
  const addSubtaskButton = document.getElementById("addSubtaskButton");

  updateSubtaskButtonState();
  renderSubtasks();

  subtaskInput.addEventListener("input", updateSubtaskButtonState);
  subtaskInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addSubtask();
  });

  addSubtaskButton.addEventListener("click", addSubtask);
}

function addSubtask() {
  const subtaskInput = document.getElementById("subtask");
  const subtaskTitle = subtaskInput.value.trim();

  if (!subtaskTitle) {
    updateSubtaskButtonState();
    return;
  }

  subtasks.push(subtaskTitle);
  subtaskInput.value = "";
  renderSubtasks();
  updateSubtaskButtonState();
}

function renderSubtasks() {
  const subtaskList = document.getElementById("subtaskList");

  subtaskList.innerHTML = "";

  subtasks.forEach((subtaskTitle, index) => {
    const subtaskItem = document.createElement("section");
    subtaskItem.className = "subtask_item";

    const subtaskText = document.createElement("span");
    subtaskText.className = "subtask_item_text";
    subtaskText.textContent = subtaskTitle;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "subtask_remove_button";
    removeButton.setAttribute("aria-label", `Remove subtask ${subtaskTitle}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => removeSubtask(index));

    subtaskItem.append(subtaskText, removeButton);
    subtaskList.appendChild(subtaskItem);
  });
}

function removeSubtask(index) {
  subtasks.splice(index, 1);
  renderSubtasks();
}

function updateSubtaskButtonState() {
  const subtaskInput = document.getElementById("subtask");
  const addSubtaskButton = document.getElementById("addSubtaskButton");
  const subtaskInputWrapper = document.querySelector(".subtask_input_wrapper");
  const hasInput = subtaskInput.value.trim().length > 0;

  addSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

function buildTaskPayload() {
  const taskId = Date.now().toString();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  const assignedContacts = assigneeContacts.filter((contact) =>
    selectedAssignees.includes(contact.id)
  );

  return {
    id: taskId,
    title,
    description,
    dueDate,

    // DAS IST WICHTIG, es muss ja zuerst in to do reinkommen alles was hier erstellt wird!
    category: "to do",

    priority: selectedPriority,
    assignees: assignedContacts,
    subtasks: subtasks.map((subtaskTitle) => ({
      title: subtaskTitle,
      done: false,
    })),
  };
}

async function handleTaskSubmit(event) {
  event.preventDefault();

  const task = buildTaskPayload();
  const createButton = event.submitter;

  try {
    if (createButton) {
      createButton.disabled = true;
    }

   await putUserData(`tasks/${task.id}`, task); //putData
    event.target.reset();
  } catch (error) {
    console.error("Failed to create task.", error);
    window.alert("Task could not be created. Please try again.");
  } finally {
    if (createButton) {
      createButton.disabled = false;
    }
  }
}

function resetTaskFormState() {
  window.setTimeout(() => {
    selectedPriority = "";
    selectedAssignees = [];
    subtasks = [];
    resetPriorityButtons();
    renderAssigneeContacts();
    updateAssigneeLabel();
    renderSubtasks();
    updateSubtaskButtonState();
  }, 0);
}

window.setPriority = setPriority;
window.toggleAssigneeDropdown = toggleAssigneeDropdown;
window.toggleAssigneeSelection = toggleAssigneeSelection;
