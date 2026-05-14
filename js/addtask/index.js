import { createElements, createState } from "./context.js";
import { closeOutside } from "./dropdowns.js";
import {
  applyDefaultPriority,
  resetPriorityButtons,
  setPriority,
} from "./priority.js";
import {
  closeCategoryDropdown,
  renderCategoryOptions,
  resetCategorySelection,
  selectCategory,
  setCategory,
  validateCategorySelection,
  toggleCategoryDropdown,
} from "./category.js";
import {
  closeAssigneeDropdown,
  renderAssigneeContacts,
  setSelectedAssignees,
  toggleAssigneeDropdown,
  toggleAssigneeSelection,
} from "./assignees.js";
import {
  addSubtask,
  cancelSubtaskEdit,
  clearSubtaskInput,
  handleSubtaskKeydown,
  removeSubtask,
  renderSubtasks,
  saveSubtaskEdit,
  setSubtasks,
  startSubtaskEdit,
  updateSubtaskButtonState,
} from "./subtasks.js";
import {
  closeDueDatePicker,
  closeDueDatePickerOnOutsideClick,
  handleDueDateClick,
  handleDueDateKeydown,
  initializeDueDatePicker,
  resetDueDatePicker,
  setDueDateValue,
} from "./dueDate.js";
import { handleTaskSubmit } from "./persistence.js";

const formControllers = new WeakMap();

export function createAddTaskForm(taskForm, createTaskPath, options = {}) {
  if (!taskForm) return null;
  const existing = formControllers.get(taskForm);
  if (existing) return existing;
  const context = createContext(taskForm, createTaskPath, options);
  initializeForm(context);
  const controller = createController(context);
  formControllers.set(taskForm, controller);
  return controller;
}

export { validateCategorySelection };

function createContext(taskForm, createTaskPath, options) {
  const context = {
    taskForm,
    createTaskPath,
    options,
    state: createState(),
    elements: createElements(taskForm),
  };
  context.handlers = createHandlers(context);
  return context;
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
  initializeDueDatePicker(context);
  setupSubtaskControls(context);
  renderAssigneeContacts(context);
  renderCategoryOptions(context);
  applyDefaultPriority(context);
  registerEvents(context);
}

function createController(context) {
  return {
    reset: () => resetTaskFormState(context),
    destroy: () => destroy(context),
    prefillTask: (task) => prefillTask(context, task),
    setPriority: (priority) => setPriority(context, priority),
    setCategory: (category) => setCategory(context, category),
    setSubtasks: (subtasks) => setSubtasks(context, subtasks),
    setSelectedAssignees: (contactIds) => setSelectedAssignees(context, contactIds),
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

function delegateFormClick(context, event) {
  if (handleDueDateClick(context, event.target)) return;
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
  if (handleDueDateKeydown(context, event)) return;
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
  console.log("EDIT SUBTASK CLICK TARGET:", target);

  const button = getScopedMatch(
    context,
    target,
    "[data-edit-subtask]"
  );

  console.log("EDIT BUTTON:", button);

  if (!button) return false;

  console.log(
    "EDIT SUBTASK INDEX:",
    button.dataset.editSubtask
  );

  console.log(
    "SUBTASKS BEFORE EDIT:",
    context.state.subtasks
  );

  startSubtaskEdit(
    context,
    Number(button.dataset.editSubtask)
  );

  console.log(
    "EDITING INDEX NOW:",
    context.state.editingSubtaskIndex
  );

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

function handleAssigneeChange(context, event) {   //CHANGE
  console.log("CHANGE EVENT TARGET:", event.target);
  console.log("ASSIGNEE ID:", event.target?.dataset?.assigneeId);

  const checkbox = getScopedMatch(context, event.target, "[data-assignee-id]");
  if (!checkbox) return;

  toggleAssigneeSelection(context, checkbox.dataset.assigneeId);
}

function getScopedMatch(context, target, selector) {
  const element = target.closest(selector);
  return element && context.taskForm.contains(element) ? element : null;
}

function closeDropdownsOnOutsideClick(context, event) {
  closeDueDatePickerOnOutsideClick(context, event);
  closeOutside(event, context.elements.assigneeDropdown, () => closeAssigneeDropdown(context));
  closeOutside(event, context.elements.categoryDropdown, () => closeCategoryDropdown(context));
}

function resetTaskFormState(context) {
  window.setTimeout(() => refreshFormState(context), 0);
}

function refreshFormState(context) {
  resetState(context.state);
  resetDueDatePicker(context);
  closeDueDatePicker(context);
  closeCategoryDropdown(context);
  closeAssigneeDropdown(context);
  resetPriorityButtons(context);
  applyDefaultPriority(context);
  resetCategorySelection(context);
  renderAssigneeContacts(context);
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

function prefillTask(context, task = {}) {
  setBasicFields(context, task);
  context.taskForm.dataset.editId = task.id || "";
  context.taskForm.dataset.status = task.status || "";
  setCategory(context, task.type || "");
  resetPriorityButtons(context);
  if (task.priority) setPriority(context, task.priority);
  else applyDefaultPriority(context);
  setSubtasks(context, task.subtasks || []);
  setSelectedAssignees(context, (task.assignees || []).map((assignee) => assignee.id));
}

function setBasicFields(context, task) {
  if (context.elements.title) context.elements.title.value = task.title || "";
  if (context.elements.description) context.elements.description.value = task.description || "";
  setDueDateValue(context, task.dueDate || "");
}

function destroy(context) {
  unregisterEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}