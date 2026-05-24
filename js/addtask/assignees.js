import { getData } from "../shared/firebase.js";

import {
  createAssigneeOption,
  createSelectedAssigneeAvatar,
  createAssigneeLoadError,
  createAssigneeEmptyState,
} from "../template/add_task_template.js";

import { setDropdownState, toggleDropdown } from "./dropdowns.js";

/** Renders the available assignee contacts into the dropdown. */
export async function renderAssigneeContacts(context) {
  const menu = context.elements.assigneeMenu;
  try {
    context.state.assigneeContacts = await fetchContacts();
  } catch (error) {
    showContactLoadError(menu, error);
    return;
  }

  if (!context.state.assigneeContacts.length) return showEmptyContacts(context, menu);
  renderAssigneeOptions(context, menu);
}

/** Renders the assignee option list for the current contacts. */
function renderAssigneeOptions(context, menu) {
  menu.innerHTML = context.state.assigneeContacts.map(createAssigneeOption).join("");
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

/** Replaces the selected assignee ids with a new set. */
export function setSelectedAssignees(context, contactIds = []) {
  context.state.selectedAssignees = [...contactIds];
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

/** Toggles a single assignee in the current selection. */
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

/** Opens or closes the assignee dropdown. */
export function toggleAssigneeDropdown(context) {
  toggleDropdown(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
  );
}

/** Closes the assignee dropdown. */
export function closeAssigneeDropdown(context) {
  setDropdownState(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
    false,
  );
}

/** Returns the contact records for the selected assignees. */
export function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

/** Synchronizes the assignee checkboxes with the current selection. */
function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    const isSelected = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
    checkbox.checked = isSelected;
    checkbox.closest(".assignee_option")?.classList.toggle("selected", isSelected);
  });
}

/** Updates the selected-contact avatar label. */
function updateAssigneeLabel(context) {
  const label = context.elements.selectedContacts;
  if (!label) return;
  label.innerHTML = getSelectedContacts(context).map(createSelectedAssigneeAvatar).join("");
}

/** Returns the selected contact records. */
function getSelectedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

/** Shows the assignee load error state and logs the failure. */
function showContactLoadError(menu, error) {
  if (menu) {
    menu.innerHTML = createAssigneeLoadError();
  }

  console.error("Failed to load contacts for assignee dropdown.", error);
}

/** Shows the empty state when no contacts are available. */
function showEmptyContacts(context, menu) {
  if (menu) {
    menu.innerHTML = createAssigneeEmptyState();
  }

  updateAssigneeLabel(context);
}

/** Fetches and normalizes the contacts available for assignment. */
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