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

/**
 * Creates and initializes an Add Task form controller.
 * 
 * Reuses an existing controller for the same form when available,
 * otherwise builds the runtime context, initializes the UI, and returns the API.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @param {string} createTaskPath - Storage path used for persisted tasks.
 * @param {Object} [options={}] - Optional lifecycle callbacks and settings.
 * @returns {Object|null} The form controller or null when the form is missing.
 */
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

/**
 * Creates the runtime context object for the form.
 * 
 * Bundles the form element, persistence path, options, state,
 * cached DOM references, and event handlers in one controller context.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @param {string} createTaskPath - Storage path used for persisted tasks.
 * @param {Object} options - Optional lifecycle callbacks and settings.
 * @returns {Object} Runtime context for the form controller.
 */
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

/**
 * Creates the event handlers used by the form controller.
 * 
 * Returns a stable set of bound callbacks so listeners can be
 * registered and later removed cleanly.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Object} Event handler callbacks for the form.
 */
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

/**
 * Initializes the form UI and its supporting modules.
 * 
 * Sets up the due-date picker, subtask controls, assignee and category UI,
 * default priority, and the required event listeners.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function initializeForm(context) {
  initializeDueDatePicker(context);
  setupSubtaskControls(context);
  renderAssigneeContacts(context);
  renderCategoryOptions(context);
  applyDefaultPriority(context);
  registerEvents(context);
}

/**
 * Creates the public controller API for the form.
 * 
 * Exposes a minimal surface for resetting, destroying, and prefilling
 * the form, plus selected field mutators used by other modules.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Object} Public controller methods for the form.
 */
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

/**
 * Registers the document and form event listeners.
 * 
 * Attaches the controller handlers to the document and current form
 * so user interactions are delegated through the shared context.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function registerEvents(context) {
  document.addEventListener("click", context.handlers.documentClick);
  context.taskForm.addEventListener("reset", context.handlers.formReset);
  context.taskForm.addEventListener("submit", context.handlers.formSubmit);
  context.taskForm.addEventListener("click", context.handlers.formClick);
  context.taskForm.addEventListener("change", context.handlers.formChange);
  context.taskForm.addEventListener("keydown", context.handlers.formKeydown);
}

/**
 * Removes the document and form event listeners.
 * 
 * Detaches the previously registered controller handlers from the
 * document and current form during cleanup.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function unregisterEvents(context) {
  document.removeEventListener("click", context.handlers.documentClick);
  context.taskForm.removeEventListener("reset", context.handlers.formReset);
  context.taskForm.removeEventListener("submit", context.handlers.formSubmit);
  context.taskForm.removeEventListener("click", context.handlers.formClick);
  context.taskForm.removeEventListener("change", context.handlers.formChange);
  context.taskForm.removeEventListener("keydown", context.handlers.formKeydown);
}

/**
 * Initializes the subtask input controls and listeners.
 * 
 * Synchronizes the initial subtask UI and attaches the dedicated
 * input, keyboard, and button listeners for subtask interactions.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function setupSubtaskControls(context) {
  updateSubtaskButtonState(context);
  renderSubtasks(context);
  context.elements.subtaskInput?.addEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.addEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.clearSubtaskButton?.addEventListener("click", context.handlers.clearSubtaskClick);
  context.elements.addSubtaskButton?.addEventListener("click", context.handlers.addSubtaskClick);
}

/**
 * Removes the subtask-specific event listeners.
 * 
 * Detaches the dedicated subtask handlers from the related input
 * and button controls during controller teardown.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function teardownSubtaskControls(context) {
  context.elements.subtaskInput?.removeEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.removeEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.clearSubtaskButton?.removeEventListener("click", context.handlers.clearSubtaskClick);
  context.elements.addSubtaskButton?.removeEventListener("click", context.handlers.addSubtaskClick);
}

/**
 * Delegates click events to the matching form handlers.
 * 
 * Routes a click to the first matching feature handler and stops
 * once the interaction has been handled.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {MouseEvent} event - Click event from the form.
 */
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

/**
 * Handles keyboard interactions inside the Add Task form.
 * 
 * Delegates due-date keyboard behavior and supports Enter and Escape
 * while a subtask edit input is active.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {KeyboardEvent} event - Keyboard event from the form.
 */
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

/** Handles clicks on priority buttons. */
function handlePriorityClick(context, target) {
  const button = getScopedMatch(context, target, "[data-priority]");
  if (!button) return false;
  setPriority(context, button.dataset.priority);
  return true;
}

/** Handles generic toggle clicks scoped to the current form. */
function handleToggleClick(context, target, selector, action) {
  const element = getScopedMatch(context, target, selector);
  if (!element) return false;
  action(context);
  return true;
}

/** Handles clicks on category selection options. */
function handleCategoryOptionClick(context, target) {
  const option = getScopedMatch(context, target, "[data-category-value]");
  if (!option) return false;
  selectCategory(context, option.dataset.categoryValue);
  return true;
}

/** Handles clicks that remove a subtask item. */
function handleRemoveSubtaskClick(context, target) {
  const button = getScopedMatch(context, target, "[data-remove-subtask]");
  if (!button) return false;
  removeSubtask(context, Number(button.dataset.removeSubtask));
  return true;
}

/** Handles clicks that start editing a subtask item. */
function handleEditSubtaskClick(context, target) {
  const button = getScopedMatch(
    context,
    target,
    "[data-edit-subtask]"
  );

  if (!button) return false;

  startSubtaskEdit(
    context,
    Number(button.dataset.editSubtask)
  );

  return true;
}


/** Handles clicks that save an edited subtask item. */
function handleSaveSubtaskEditClick(context, target) {
  const button = getScopedMatch(context, target, "[data-save-subtask-edit]");
  if (!button) return false;
  saveSubtaskEdit(context, Number(button.dataset.saveSubtaskEdit));
  return true;
}

/** Handles clicks that cancel subtask editing. */
function handleCancelSubtaskEditClick(context, target) {
  const button = getScopedMatch(context, target, "[data-cancel-subtask-edit]");
  if (!button) return false;
  cancelSubtaskEdit(context);
  return true;
}

/**
 * Handles assignee checkbox changes inside the form.
 * 
 * Detects assignee checkbox changes within the current form and
 * toggles the matching contact selection in state.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {Event} event - Change event from the form.
 */
function handleAssigneeChange(context, event) {
  const checkbox = getScopedMatch(context, event.target, "[data-assignee-id]");
  if (!checkbox) return;

  toggleAssigneeSelection(context, checkbox.dataset.assigneeId);
}

/**
 * Returns a selector match scoped to the current task form.
 * 
 * Finds the nearest matching ancestor for the target and ensures
 * the matched element belongs to the current form instance.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {HTMLElement} target - Event target to evaluate.
 * @param {string} selector - Selector that identifies the desired element.
 * @returns {HTMLElement|null} The scoped matching element or null.
 */
function getScopedMatch(context, target, selector) {
  const element = target.closest(selector);
  return element && context.taskForm.contains(element) ? element : null;
}

/**
 * Closes open dropdowns when clicking outside their wrappers.
 * 
 * Applies outside-click handling to the due-date, assignee, and category
 * dropdown wrappers within the current form.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {Event} event - Click event to evaluate.
 */
function closeDropdownsOnOutsideClick(context, event) {
  closeDueDatePickerOnOutsideClick(context, event);
  closeOutside(event, context.elements.assigneeDropdown, () => closeAssigneeDropdown(context));
  closeOutside(event, context.elements.categoryDropdown, () => closeCategoryDropdown(context));
}

/**
 * Schedules a reset of the derived form state after reset events.
 * 
 * Defers the state refresh until the browser has applied the native
 * form reset so derived UI can be synchronized correctly.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function resetTaskFormState(context) {
  window.setTimeout(() => refreshFormState(context), 0);
}

/**
 * Refreshes the full UI state after a form reset.
 * 
 * Restores all derived state, dropdowns, priorities, assignees,
 * subtasks, and button states to their initial defaults.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
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

/**
 * Resets the stored state fields to their defaults.
 * 
 * Clears transient selection and editing state without recreating
 * the state object itself.
 * 
 * @param {Object} state - Mutable add-task state object.
 */
function resetState(state) {
  state.selectedPriority = "";
  state.selectedAssignees = [];
  state.selectedCategory = "";
  state.subtasks = [];
  state.editingSubtaskIndex = null;
}

/**
 * Prefills the form with the values of an existing task.
 * 
 * Applies persisted task values to the form fields and state so the form
 * can be used for editing an existing task.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {Object} [task={}] - Task data used to populate the form.
 */
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

/**
 * Applies the basic text and date fields from a task object.
 * 
 * Sets the title, description, and due-date fields from the provided task data.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {Object} task - Task data used to populate the fields.
 */
function setBasicFields(context, task) {
  if (context.elements.title) context.elements.title.value = task.title || "";
  if (context.elements.description) context.elements.description.value = task.description || "";
  setDueDateValue(context, task.dueDate || "");
}

/**
 * Destroys the controller and unregisters its listeners.
 * 
 * Removes all registered listeners and deletes the controller entry
 * for the current form from the internal cache.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
function destroy(context) {
  unregisterEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}