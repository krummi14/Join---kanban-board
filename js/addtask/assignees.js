import { getData } from "../firebase.js";
import { createAssigneeOption } from "../template/add_task_template.js";
import { getContactColor, getContactInitials } from "./contactUtils.js";
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

  menu.innerHTML = context.state.assigneeContacts.map(createAssigneeOption).join("");
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

export function setSelectedAssignees(context, contactIds = []) {
  context.state.selectedAssignees = [...contactIds];
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

export function toggleAssigneeSelection(context, contactId) {
  const index = context.state.selectedAssignees.indexOf(contactId);
  if (index >= 0) context.state.selectedAssignees.splice(index, 1);
  else context.state.selectedAssignees.push(contactId);
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

export function toggleAssigneeDropdown(context) {
  toggleDropdown(context.elements.assigneeToggle, context.elements.assigneeMenu, context.elements.assigneeDropdown);
}

export function closeAssigneeDropdown(context) {
  setDropdownState(context.elements.assigneeToggle, context.elements.assigneeMenu, context.elements.assigneeDropdown, false);
}

export function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) => context.state.selectedAssignees.includes(contact.id));
}

function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    const isSelected = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
    checkbox.checked = isSelected;
    checkbox.closest(".assignee_option")?.classList.toggle("selected", isSelected);
  });
}

function updateAssigneeLabel(context) {
  const label = context.elements.selectedContacts;
  if (!label) return;
  label.innerHTML = getSelectedContacts(context).map(createSelectedAssigneeAvatar).join("");
}

function getSelectedContacts(context) {
  return context.state.assigneeContacts.filter((contact) => context.state.selectedAssignees.includes(contact.id));
}

function createSelectedAssigneeAvatar(contact) {
  return `<div class="avatar selected_assignee_avatar" title="${contact.name}" style="background:${getContactColor(contact.name)}">${getContactInitials(contact.name)}</div>`;
}

function showContactLoadError(menu, error) {
  if (menu) menu.innerHTML = '<div class="assignee_status">Can not load contacts.</div>';
  console.error("Failed to load contacts for assignee dropdown.", error);
}

function showEmptyContacts(context, menu) {
  if (menu) menu.innerHTML = '<div class="assignee_status">No contacts available.</div>';
  updateAssigneeLabel(context);
}

async function fetchContacts() {
  const contacts = await getData("contacts");
  return Object.entries(contacts || {})
    .filter(([, contact]) => contact && typeof contact === "object")
    .map(([id, contact]) => ({ id, name: contact.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}