import { getData, putUserData } from "./firebase.js";
const formControllers = new WeakMap();
const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_CATEGORY_LABEL = "Select task category";

export function createAddTaskForm(taskForm, createTaskStatus) {
  if (!taskForm) return null;
  const existing = formControllers.get(taskForm);
  if (existing) return existing;
  const context = createContext(taskForm, createTaskStatus); // Create a context object to hold state and elements
  initializeForm(context);
  const controller = createController(context);
  formControllers.set(taskForm, controller);
  return controller;
}

function createContext(taskForm, createTaskStatus) {
  const context = { 
    taskForm, 
    createTaskStatus, // Store the create task status in the context for later use
    state: createState(), 
    elements: createElements(taskForm) 
  };
  context.handlers = createHandlers(context);
  return context;
}

function createState() {
  return { assigneeContacts: [], selectedAssignees: [], selectedCategory: "", subtasks: [], selectedPriority: "" };
}

function createElements(taskForm) {
  return {
    ...getInputElements(taskForm),
    ...getDropdownElements(taskForm),
    subtaskInputWrapper: taskForm.querySelector(".subtask_input_wrapper"),
    assigneeDropdown: taskForm.querySelector(".assignee_dropdown"),
    categoryDropdown: taskForm.querySelector(".category_dropdown"),
  };
}

function getInputElements(taskForm) {
  return {
    title: byId(taskForm, "title"), 
    description: byId(taskForm, "description"), 
    dueDate: byId(taskForm, "dueDate"),
    category: byId(taskForm, "category"), 
    subtaskInput: byId(taskForm, "subtask"),
    addSubtaskButton: byId(taskForm, "addSubtaskButton"), 
    subtaskList: byId(taskForm, "subtaskList"),
  };
}

function getDropdownElements(taskForm) {
  return {
    assigneeToggle: byId(taskForm, "assignee"), 
    assigneeMenu: byId(taskForm, "assigneeDropdownMenu"),
    selectedContacts: byId(taskForm, "selectedContacts"), 
    categoryToggle: byId(taskForm, "categoryToggle"),
    categoryMenu: byId(taskForm, "categoryDropdownMenu"), 
    categoryLabel: byId(taskForm, "categoryLabel"),
  };
}

function byId(taskForm, id) {
  return taskForm.querySelector(`#${id}`);
}

function createHandlers(context) {
  return {
    documentClick: (event) => closeDropdownsOnOutsideClick(context, event), 
    formReset: () => resetTaskFormState(context),
    formSubmit: (event) => handleTaskSubmit(context, event), 
    formClick: (event) => delegateFormClick(context, event),
    formChange: (event) => handleAssigneeChange(context, event), 
    subtaskInput: () => updateSubtaskButtonState(context),
    subtaskKeydown: (event) => handleSubtaskKeydown(context, event), 
    addSubtaskClick: () => addSubtask(context),
  };
}

function initializeForm(context) {
  setupSubtaskControls(context);
  renderAssigneeContacts(context);
  registerEvents(context);
}

function createController(context) {
  return { reset: () => resetTaskFormState(context), destroy: () => destroy(context) };
}

function registerEvents(context) {
  document.addEventListener("click", context.handlers.documentClick);
  context.taskForm.addEventListener("reset", context.handlers.formReset);
  context.taskForm.addEventListener("submit", context.handlers.formSubmit);
  context.taskForm.addEventListener("click", context.handlers.formClick);
  context.taskForm.addEventListener("change", context.handlers.formChange);
}

function unregisterEvents(context) {
  document.removeEventListener("click", context.handlers.documentClick);
  context.taskForm.removeEventListener("reset", context.handlers.formReset);
  context.taskForm.removeEventListener("submit", context.handlers.formSubmit);
  context.taskForm.removeEventListener("click", context.handlers.formClick);
  context.taskForm.removeEventListener("change", context.handlers.formChange);
}

function setupSubtaskControls(context) {
  updateSubtaskButtonState(context);
  renderSubtasks(context);
  context.elements.subtaskInput?.addEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.addEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.addSubtaskButton?.addEventListener("click", context.handlers.addSubtaskClick);
}

function teardownSubtaskControls(context) {
  context.elements.subtaskInput?.removeEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.removeEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.addSubtaskButton?.removeEventListener("click", context.handlers.addSubtaskClick);
}

function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtask(context);
}

function delegateFormClick(context, event) {
  if (handlePriorityClick(context, event.target)) return;
  if (handleToggleClick(context, event.target, "[data-assignee-toggle]", toggleAssigneeDropdown)) return;
  if (handleToggleClick(context, event.target, "[data-category-toggle]", toggleCategoryDropdown)) return;
  if (handleCategoryOptionClick(context, event.target)) return;
  handleRemoveSubtaskClick(context, event.target);
}

function handlePriorityClick(context, target) {
  const button = getScopedMatch(context, target, "[data-priority]");
  if (!button) return false;
  setPriority(context, button.dataset.priority);
  return true;
}

function handleToggleClick(context, target, selector, action) {
  const element = getScopedMatch(context, target, selector);
  if (!element) return false;
  action(context);
  return true;
}

function handleCategoryOptionClick(context, target) {
  const option = getScopedMatch(context, target, "[data-category-value]");
  if (!option) return false;
  selectCategory(context, option.dataset.categoryValue);
  return true;
}

function handleRemoveSubtaskClick(context, target) {
  const button = getScopedMatch(context, target, "[data-remove-subtask]");
  if (!button) return false;
  removeSubtask(context, Number(button.dataset.removeSubtask));
  return true;
}

function handleAssigneeChange(context, event) {
  const checkbox = getScopedMatch(context, event.target, "[data-assignee-id]");
  if (!checkbox) return;
  toggleAssigneeSelection(context, checkbox.dataset.assigneeId);
}

function getScopedMatch(context, target, selector) {
  const element = target.closest(selector);
  return element && context.taskForm.contains(element) ? element : null;
}

function toggleCategoryDropdown(context) {
  toggleDropdown(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown);
}

function toggleAssigneeDropdown(context) {
  toggleDropdown(context.elements.assigneeToggle, context.elements.assigneeMenu, context.elements.assigneeDropdown);
}

function toggleDropdown(toggle, menu, wrapper) {
  if (!toggle || !menu) return;
  setDropdownState(toggle, menu, wrapper, !menu.classList.contains("open"));
}

function closeCategoryDropdown(context) {
  setDropdownState(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown, false);
}

function closeAssigneeDropdown(context) {
  setDropdownState(context.elements.assigneeToggle, context.elements.assigneeMenu, context.elements.assigneeDropdown, false);
}

function setDropdownState(toggle, menu, wrapper, isOpen) {
  if (!toggle || !menu) return;
  menu.classList.toggle("open", isOpen);
  wrapper?.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function selectCategory(context, categoryValue) {
  context.state.selectedCategory = categoryValue;
  if (context.elements.category) context.elements.category.value = categoryValue;
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = categoryValue;
  closeCategoryDropdown(context);
}

function closeDropdownsOnOutsideClick(context, event) {
  closeOutside(event, context.elements.assigneeDropdown, () => closeAssigneeDropdown(context));
  closeOutside(event, context.elements.categoryDropdown, () => closeCategoryDropdown(context));
}

function closeOutside(event, wrapper, close) {
  if (!wrapper || wrapper.contains(event.target)) return;
  close();
}

function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

function resetPriorityButton(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

function setPriority(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  const isActive = button.classList.contains("active");
  resetPriorityButtons(context);
  if (isActive) return void (context.state.selectedPriority = "");
  button.classList.add("active");
  button.innerHTML = createPriorityMarkup(priority, "on");
  context.state.selectedPriority = priority;
}

function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

async function renderAssigneeContacts(context) {
  const menu = context.elements.assigneeMenu;
  try { context.state.assigneeContacts = await fetchContacts(); }
  catch (error) { return showContactLoadError(menu, error); }
  if (!context.state.assigneeContacts.length) return showEmptyContacts(context, menu);
  menu.innerHTML = context.state.assigneeContacts.map(createAssigneeOption).join("");
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

function showContactLoadError(menu, error) {
  menu.innerHTML = '<div class="assignee_status">Can not load contacts.</div>';
  console.error("Failed to load contacts for assignee dropdown.", error);
}

function showEmptyContacts(context, menu) {
  menu.innerHTML = '<div class="assignee_status">No contacts available.</div>';
  updateAssigneeLabel(context);
}

async function fetchContacts() {
  const contacts = await getData("contacts");
  return Object.entries(contacts || {}).filter(([, c]) => c && typeof c === "object").map(([id, c]) => ({ id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
}

function toggleAssigneeSelection(context, contactId) {
  const index = context.state.selectedAssignees.indexOf(contactId);
  if (index >= 0) context.state.selectedAssignees.splice(index, 1);
  else context.state.selectedAssignees.push(contactId);
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    checkbox.checked = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
  });
}

function updateAssigneeLabel(context) {
  const label = context.elements.selectedContacts;
  if (!label) return;
  label.textContent = getSelectedNames(context).map(getContactInitials).join(" ");
}

function getSelectedNames(context) {
  return context.state.assigneeContacts.filter((contact) => context.state.selectedAssignees.includes(contact.id)).map((contact) => contact.name);
}

function addSubtask(context) {
  const title = context.elements.subtaskInput?.value.trim();
  if (!title) return updateSubtaskButtonState(context);
  context.state.subtasks.push(title);
  context.elements.subtaskInput.value = "";
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

function renderSubtasks(context) {
  if (!context.elements.subtaskList) return;
  context.elements.subtaskList.innerHTML = context.state.subtasks.map(createSubtaskItem).join("");
}

function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  renderSubtasks(context);
}

function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, subtaskInputWrapper } = context.elements;
  if (!subtaskInput || !addSubtaskButton || !subtaskInputWrapper) return;
  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

async function handleTaskSubmit(context, event) {
  event.preventDefault();
  if (!validateCategorySelection(context)) return;
  const button = event.submitter;
  setSubmitterDisabled(button, true);
  try { await saveTask(context); context.taskForm.reset(); }
  catch (error) { console.error("Failed to create task.", error); }
  finally { setSubmitterDisabled(button, false); }
}

// This function simulates saving the task to a backend. Replace with actual API call as needed.
function saveTask(context) {
  const task = buildTaskPayload(context);
  return putUserData(`${context.createTaskStatus}/${task.id}`, task); // Simulate network delay with a timeout
}

function setSubmitterDisabled(button, disabled) {
  if (button) button.disabled = disabled;
}

function resetTaskFormState(context) {
  window.setTimeout(() => refreshFormState(context), 0);
}

function refreshFormState(context) {
  resetState(context.state);
  closeCategoryDropdown(context);
  closeAssigneeDropdown(context);
  resetPriorityButtons(context);
  resetCategorySelection(context);
  renderAssigneeContacts(context);
  updateAssigneeLabel(context);
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

function resetState(state) {
  state.selectedPriority = "";
  state.selectedAssignees = [];
  state.selectedCategory = "";
  state.subtasks = [];
}

function destroy(context) {
  unregisterEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}

// Helper functions to build task payload and manage form state
function buildTaskPayload(context) {
  return {
    id: Date.now().toString(), 
    title: context.elements.title?.value.trim() || "", 
    description: context.elements.description?.value.trim() || "",
    dueDate: context.elements.dueDate?.value || "", 
    status: context.createTaskStatus, // The status of the task when created
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority, 
    assignees: getAssignedContacts(context), 
    subtasks: createSubtaskPayload(context.state.subtasks),
  };
}

function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) => context.state.selectedAssignees.includes(contact.id));
}

function createSubtaskPayload(subtasks) {
  return subtasks.map((title) => ({ title, done: false }));
}

function resetCategorySelection(context) {
  if (context.elements.category) context.elements.category.value = "";
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
}

function validateCategorySelection(context) {
  if (context.state.selectedCategory) return true;
  context.elements.categoryToggle?.focus();
  return false;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getContactInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}