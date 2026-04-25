import { getData, putUserData } from "./firebase.js";



import { normalizeStatus} from "./assets.js";
import { createAssigneeOption } from "./template/add_task_template.js";
import { createSubtaskItem } from "./template/add_task_template.js";


const formControllers = new WeakMap();
const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_CATEGORY_LABEL = "Select task category";





export function createAddTaskForm(taskForm, createTaskPath, options = {}) { //Board overaly edit 
  if (!taskForm) return null;

  const existing = formControllers.get(taskForm);
  if (existing) return existing;


  const context = createContext(taskForm, createTaskPath, options); // Create a context object to hold state and elements


  initializeForm(context);

  const controller = createController(context);

  formControllers.set(taskForm, controller);

  return controller;
}




function createContext(taskForm, createTaskPath, options) { //Board overaly edit 
  const context = { 
    taskForm, 
    createTaskPath,// Store the create task path in the context for later use
    options, // 🔥 NEU (WICHTIG!)
    state: createState(), 
    elements: createElements(taskForm) 

  };

  context.handlers = createHandlers(context);

  return context;
}

function createState() {
  return { assigneeContacts: [], selectedAssignees: [], selectedCategory: "", subtasks: [], selectedPriority: "", editingSubtaskIndex: null };
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
    clearSubtaskButton: byId(taskForm, "clearSubtaskButton"),
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
    formKeydown: (event) => handleFormKeydown(context, event),
    subtaskInput: () => updateSubtaskButtonState(context),
    subtaskKeydown: (event) => handleSubtaskKeydown(context, event),
    clearSubtaskClick: () => clearSubtaskInput(context),
    addSubtaskClick: () => addSubtask(context),
  };
}

function initializeForm(context) {
  setupSubtaskControls(context);
  renderAssigneeContacts(context);

  renderCategoryOptions(context); // 👈 HIER

  registerEvents(context);
}
function createController(context) {
  return { 
    reset: () => resetTaskFormState(context),
    destroy: () => destroy(context),
    context // 🔥 BOARD OVERLAY EDIT 
  };
}

function registerEvents(context) {
  document.addEventListener("click", context.handlers.documentClick);
  context.taskForm.addEventListener("reset", context.handlers.formReset);
  context.taskForm.addEventListener("submit", context.handlers.formSubmit);
  context.taskForm.addEventListener("click", context.handlers.formClick);
  context.taskForm.addEventListener("change", context.handlers.formChange);
  context.taskForm.addEventListener("keydown", context.handlers.formKeydown);
}

function unregisterEvents(context) {
  document.removeEventListener("click", context.handlers.documentClick);
  context.taskForm.removeEventListener("reset", context.handlers.formReset);
  context.taskForm.removeEventListener("submit", context.handlers.formSubmit);
  context.taskForm.removeEventListener("click", context.handlers.formClick);
  context.taskForm.removeEventListener("change", context.handlers.formChange);
  context.taskForm.removeEventListener("keydown", context.handlers.formKeydown);
}

function setupSubtaskControls(context) {
  updateSubtaskButtonState(context);
  renderSubtasks(context);
  context.elements.subtaskInput?.addEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.addEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.clearSubtaskButton?.addEventListener("click", context.handlers.clearSubtaskClick);
  context.elements.addSubtaskButton?.addEventListener("click", context.handlers.addSubtaskClick);
}

function teardownSubtaskControls(context) {
  context.elements.subtaskInput?.removeEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.removeEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.clearSubtaskButton?.removeEventListener("click", context.handlers.clearSubtaskClick);
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
  if (handleEditSubtaskClick(context, event.target)) return;
  if (handleSaveSubtaskEditClick(context, event.target)) return;
  if (handleCancelSubtaskEditClick(context, event.target)) return;
  handleRemoveSubtaskClick(context, event.target);
}

function handleFormKeydown(context, event) {
  const input = getScopedMatch(context, event.target, "[data-edit-subtask-input]");
  if (!input) return;
  if (event.key === "Enter") {
    event.preventDefault();
    saveSubtaskEdit(context, Number(input.dataset.editSubtaskInput));
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelSubtaskEdit(context);
  }
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

function handleEditSubtaskClick(context, target) {
  const button = getScopedMatch(context, target, "[data-edit-subtask]");
  if (!button) return false;
  startSubtaskEdit(context, Number(button.dataset.editSubtask));
  return true;
}

function handleSaveSubtaskEditClick(context, target) {
  const button = getScopedMatch(context, target, "[data-save-subtask-edit]");
  if (!button) return false;
  saveSubtaskEdit(context, Number(button.dataset.saveSubtaskEdit));
  return true;
}

function handleCancelSubtaskEditClick(context, target) {
  const button = getScopedMatch(context, target, "[data-cancel-subtask-edit]");
  if (!button) return false;
  cancelSubtaskEdit(context);
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
  menu.classList.toggle("d_none", !isOpen);
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
console.log("🔍 assigneeMenu:", context.elements.assigneeMenu);
console.log("🔍 context.elements:", context.elements);
  try {
    context.state.assigneeContacts = await fetchContacts();
  } catch (error) {
    return showContactLoadError(menu, error);
  }

  if (!context.state.assigneeContacts.length) {
    return showEmptyContacts(context, menu);
  }

  menu.innerHTML = context.state.assigneeContacts
    .map(createAssigneeOption)
    .join(""); //NEU wegen Board Overlay edit 

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

function getContactColor(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][String(name || "").length % 6];
}

function addSubtask(context) {
  const input = context.elements.subtaskInput;
  const title = input?.value.trim();

  if (!title) return updateSubtaskButtonState(context);
  if (!Array.isArray(context.state.subtasks)) context.state.subtasks = [];

  context.state.subtasks.push({title, done: false});
  input.value = "";
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

function startSubtaskEdit(context, index) {
  if (!Number.isInteger(index) || index < 0 || index >= context.state.subtasks.length) return;
  context.state.editingSubtaskIndex = index;
  renderSubtasks(context);
  focusSubtaskEditInput(context, index);
}

function saveSubtaskEdit(context, index) {
  const input = context.taskForm.querySelector(`[data-edit-subtask-input="${index}"]`);
  const title = input?.value.trim();
  if (!title) {
    input?.focus();
    return;
  }
  if (!context.state.subtasks[index]) return;
  context.state.subtasks[index].title = title;
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

function cancelSubtaskEdit(context) {
  if (context.state.editingSubtaskIndex === null) return;
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

function focusSubtaskEditInput(context, index) {
  const input = context.taskForm.querySelector(`[data-edit-subtask-input="${index}"]`);
  if (!input) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function clearSubtaskInput(context) {
  const input = context.elements.subtaskInput;
  if (!input) return;
  input.value = "";
  updateSubtaskButtonState(context);
  input.focus();
}

function renderSubtasks(context) {
  if (!context.elements.subtaskList) return;
  context.elements.subtaskList.innerHTML = context.state.subtasks
    .map((subtask, index) => createSubtaskItem({ ...subtask, isEditing: context.state.editingSubtaskIndex === index }, index))
    .join("");
}

function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  if (context.state.editingSubtaskIndex === index) context.state.editingSubtaskIndex = null;
  else if (context.state.editingSubtaskIndex !== null && context.state.editingSubtaskIndex > index) context.state.editingSubtaskIndex -= 1;
  renderSubtasks(context);
}

function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, clearSubtaskButton, subtaskInputWrapper } = context.elements;
  if (!subtaskInput || !addSubtaskButton || !clearSubtaskButton || !subtaskInputWrapper) return;
  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  clearSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

async function handleTaskSubmit(context, event) { //Board overlay edit
  event.preventDefault();

  const form = context.taskForm;
  const editId = form.dataset.editId;

  try {
    if (editId) {
      await updateExistingTask(context, editId);
    } else {
      await saveTask(context);
    }

    console.log("✅ SAVE DONE");

  } catch (error) {
    console.error("❌ SAVE FAILED", error);
  }
}




async function updateExistingTask(context, taskId) {//Board overlay edit
  const updatedTask = buildTaskPayload(context);

  updatedTask.id = taskId;

  const path = context.createTaskPath;

  await putUserData(`${path}/${taskId}`, updatedTask);

  console.log("✏️ TASK UPDATED");

  // 🔥 NUR CALLBACK!
  if (context.options?.onSave) {
    context.options.onSave(taskId);
  }
}

// This function simulates saving the task to a backend. Replace with actual API call as needed.
function saveTask(context) {
  const task = buildTaskPayload(context);
  return putUserData(`${context.createTaskPath}/${task.id}`, task);
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
  state.editingSubtaskIndex = null;
}

function destroy(context) {
  unregisterEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}

function buildTaskPayload(context) {
  const task = {
   id: context.taskForm.dataset.editId || Date.now().toString(),
    title: context.elements.title?.value.trim() || "",
    description: context.elements.description?.value.trim() || "",
    dueDate: context.elements.dueDate?.value || "",
    status: normalizeStatus(context.createTaskPath),
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority,
    assignees: getAssignedContacts(context),
    subtasks: createSubtaskPayload(context.state.subtasks),
  };
  return task;
}

function getAssignedContacts(context) {
  return context.state.assigneeContacts.filter((contact) => context.state.selectedAssignees.includes(contact.id));
}

function createSubtaskPayload(subtasks) { //GEÄNDERT
  return subtasks.map((st) => {
    return {
      title: st.title || st,
      done: st.done ?? false
    };
  });
}

function resetCategorySelection(context) {
  if (context.elements.category) context.elements.category.value = "";
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
}

export function validateCategorySelection(context) {
  if (context.state.selectedCategory) return true;
  context.elements.categoryToggle?.focus();
  return false;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getContactInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

//board overlay edit 

function renderCategoryOptions(context) {
  const menu = context.elements.categoryMenu;
  if (!menu) return;

  const categories = ["Technical Task", "User Story"];

  menu.innerHTML = categories
    .map((category) => `<button type="button" class="category_option" data-category-value="${category}">${category}</button>`)
    .join("");
}