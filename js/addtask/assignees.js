import { getData } from "../shared/firebase.js";

import {
  createAssigneeOption,
  createSelectedAssigneeAvatar,
  createAssigneeLoadError,
  createAssigneeEmptyState,
} from "../template/add_task_template.js";

import { setDropdownState, toggleDropdown } from "./dropdowns.js";

/**
 * Renders the available contacts into the assignee dropdown.
 * 
 * Loads the contact data, stores it in the shared add-task state,
 * and updates the dropdown UI based on the result.
 * Shows an error or empty state when no selectable contacts exist.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Promise<void>}
 */
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

/**
 * Renders the assignee option list for the current contact set.
 * 
 * Replaces the dropdown content with contact options and synchronizes
 * the current checkbox and label state afterward.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {HTMLElement|null} menu - Dropdown container for assignee options.
 */
function renderAssigneeOptions(context, menu) {
  menu.innerHTML = context.state.assigneeContacts.map(createAssigneeOption).join("");
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

/**
 * Replaces the selected assignee ids with a new selection.
 * 
 * Copies the provided ids into the shared state and refreshes
 * the checkbox and avatar label UI to match the new selection.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string[]} [contactIds=[]] - Contact ids that should be selected.
 */
export function setSelectedAssignees(context, contactIds = []) {
  context.state.selectedAssignees = [...contactIds];
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

/**
 * Toggles a single assignee inside the current selection.
 * 
 * Removes the contact id when it is already selected,
 * otherwise adds it and updates the related UI state.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} contactId - Contact id to add or remove.
 */
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

/**
 * Toggles the open state of the assignee dropdown.
 * 
 * Uses the shared dropdown helper to switch between the
 * expanded and collapsed state for the assignee selector.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function toggleAssigneeDropdown(context) {
  toggleDropdown(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
  );
}

/**
 * Closes the assignee dropdown.
 * 
 * Forces the dropdown helper state to collapsed so the
 * assignee menu is hidden regardless of its previous state.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function closeAssigneeDropdown(context) {
  setDropdownState(
    context.elements.assigneeToggle,
    context.elements.assigneeMenu,
    context.elements.assigneeDropdown,
    false,
  );
}

/**
 * Returns the contact records for the currently selected assignees.
 * 
 * Filters the loaded contact list by the selected assignee ids
 * and returns the matching contact objects.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Array<Object>} The selected contact records.
 */
export function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

/**
 * Synchronizes assignee checkboxes with the current selection state.
 * 
 * Updates the checked state of each assignee input and mirrors
 * that state on the surrounding option element for styling.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    const isSelected = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
    checkbox.checked = isSelected;
    checkbox.closest(".assignee_option")?.classList.toggle("selected", isSelected);
  });
}

/**
 * Updates the selected-contact avatar label.
 * 
 * Renders the avatar preview for all currently selected contacts
 * into the label container below the assignee dropdown.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function updateAssigneeLabel(context) {
  const label = context.elements.selectedContacts;
  if (!label) return;
  label.innerHTML = getSelectedContacts(context).map(createSelectedAssigneeAvatar).join("");
}

/**
 * Returns the contact records for the current selection.
 * 
 * Filters the loaded contacts to those whose ids are present
 * in the selected-assignee state array.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Array<Object>} The selected contact objects.
 */
function getSelectedContacts(context) {
  return context.state.assigneeContacts.filter((contact) =>
    context.state.selectedAssignees.includes(contact.id),
  );
}

/**
 * Shows the assignee load error state and logs the failure.
 * 
 * Replaces the dropdown content with an error message when contact
 * loading fails and writes the original error to the console.
 * 
 * @param {HTMLElement|null} menu - Dropdown container for assignee options.
 * @param {unknown} error - Original error thrown while loading contacts.
 */
function showContactLoadError(menu, error) {
  if (menu) {
    menu.innerHTML = createAssigneeLoadError();
  }

  console.error("Failed to load contacts for assignee dropdown.", error);
}

/**
 * Shows the empty state when no contacts are available.
 * 
 * Replaces the dropdown content with the empty-state markup
 * and clears the selected-avatar label rendering.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {HTMLElement|null} menu - Dropdown container for assignee options.
 */
function showEmptyContacts(context, menu) {
  if (menu) {
    menu.innerHTML = createAssigneeEmptyState();
  }

  updateAssigneeLabel(context);
}

/**
 * Fetches and normalizes the contacts available for assignment.
 * 
 * Loads the contact collection from Firebase, filters invalid entries,
 * maps them into a predictable shape, and sorts them alphabetically.
 * 
 * @returns {Promise<Array<{id: string, name: string}>>} The normalized contacts.
 */
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