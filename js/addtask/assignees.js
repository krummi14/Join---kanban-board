import { getData } from "../firebase.js";

import {
  createAssigneeOption,
  createSelectedAssigneeAvatar,
  createAssigneeLoadError,
  createAssigneeEmptyState,
} from "../template/add_task_template.js";

import { setDropdownState, toggleDropdown } from "./dropdowns.js";

export async function renderAssigneeContacts(context) {
  const menu = context.elements.assigneeMenu;

  try {
    context.state.assigneeContacts = await fetchContacts();
  } catch (error) {
    showContactLoadError(menu, error);
    return;
  }

  if (!context.state.assigneeContacts.length) {
    showEmptyContacts(context, menu);
    return;
  }

  menu.innerHTML = context.state.assigneeContacts
    .map(createAssigneeOption)
    .join("");

  const options = menu.querySelectorAll(".assignee_option");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      toggleAssigneeSelection(context, option.dataset.assigneeId);
    });
  });

  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

function updateAssigneeLabel(context) {
  const label = context.elements.selectedContacts;

  if (!label) return;

  label.innerHTML = getSelectedContacts(context)
    .map(createSelectedAssigneeAvatar)
    .join("");
}

function getSelectedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

export function setSelectedAssignees(context, contactIds = []) {
  context.state.selectedAssignees = [...contactIds];
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

export function toggleAssigneeSelection(context, contactId) {
  const index = context.state.selectedAssignees.indexOf(contactId);

  if (index >= 0) {
    context.state.selectedAssignees.splice(index, 1);
  } else {
    context.state.selectedAssignees.push(contactId);
  }

  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

export function toggleAssigneeDropdown(context) {
  toggleDropdown(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
  );
}

export function closeAssigneeDropdown(context) {
  setDropdownState(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
    false,
  );
}

export function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

function syncAssigneeCheckboxes(context) {
  const options =
    context.elements.assigneeMenu.querySelectorAll(".assignee_option");

  options.forEach((option) => {
    const assigneeId = option.dataset.assigneeId;

    const isSelected =
      context.state.selectedAssignees.includes(assigneeId);

    option.classList.toggle("selected", isSelected);

    const checkedIcon = option.querySelector(
      ".assignee_option_checkbox_icon_checked",
    );

    const uncheckedIcon = option.querySelector(
      ".assignee_option_checkbox_icon_unchecked",
    );

    if (checkedIcon) {
      checkedIcon.style.display = isSelected ? "block" : "none";
    }

    if (uncheckedIcon) {
      uncheckedIcon.style.display = isSelected ? "none" : "block";
    }
  });
}

function showContactLoadError(menu, error) {
  if (menu) {
    menu.innerHTML = createAssigneeLoadError();
  }

  console.error("Failed to load contacts for assignee dropdown.", error);
}

function showEmptyContacts(context, menu) {
  if (menu) {
    menu.innerHTML = createAssigneeEmptyState();
  }

  updateAssigneeLabel(context);
}

async function fetchContacts() {
  const contacts = await getData("contacts");

  return Object.entries(contacts || {})
    .filter(([, contact]) => contact && typeof contact === "object")
    .map(([id, contact]) => ({
      id,
      name: contact.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}