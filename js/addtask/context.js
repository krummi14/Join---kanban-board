/**
 * Creates the default state object for the Add Task form.
 * 
 * Returns the initial in-memory state used by the form controller
 * before any user interaction or task prefilling happens.
 * 
 * @returns {Object} The initial form state.
 */
export function createState() {
  return {
    assigneeContacts: [],
    selectedAssignees: [],
    selectedCategory: "",
    subtasks: [],
    selectedPriority: "",
    editingSubtaskIndex: null,
  };
}

/**
 * Collects and returns the DOM elements used by the form.
 * 
 * Gathers the relevant input, dropdown, and helper elements once
 * so the controller can reuse stable references during runtime.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @returns {Object} Cached DOM element references.
 */
export function createElements(taskForm) {
  return {
    ...getInputElements(taskForm),
    ...getDropdownElements(taskForm),
    subtaskInputWrapper: taskForm.querySelector(".subtask_input_wrapper"),
    assigneeDropdown: taskForm.querySelector(".assignee_dropdown"),
    categoryDropdown: taskForm.querySelector(".category_dropdown"),
    dueDatePicker: taskForm.querySelector("[data-due-date-picker]"),
  };
}

/**
 * Returns the form input elements used by the Add Task module.
 * 
 * Collects all direct input controls and subtask-related elements
 * that belong to the current form instance.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @returns {Object} Input-related DOM element references.
 */
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

/**
 * Returns the dropdown-related elements used by the Add Task module.
 * 
 * Collects the toggle, menu, and label elements required for the
 * assignee, category, and due-date dropdown interactions.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @returns {Object} Dropdown-related DOM element references.
 */
function getDropdownElements(taskForm) {
  return {
    assigneeToggle: byId(taskForm, "assignee"),
    assigneeMenu: byId(taskForm, "assigneeDropdownMenu"),
    selectedContacts: byId(taskForm, "selectedContacts"),
    categoryToggle: byId(taskForm, "categoryToggle"),
    categoryMenu: byId(taskForm, "categoryDropdownMenu"),
    categoryLabel: byId(taskForm, "categoryLabel"),
    dueDateMenu: byId(taskForm, "dueDateMenu"),
    dueDateMonthLabel: byId(taskForm, "dueDateMonthLabel"),
    dueDateDays: byId(taskForm, "dueDateDays"),
  };
}

/**
 * Finds an element by id within the current form.
 * 
 * Limits the lookup to the provided form element so multiple forms
 * can exist without conflicting global id lookups.
 * 
 * @param {HTMLFormElement} taskForm - Form element for the add-task UI.
 * @param {string} id - Element id to find.
 * @returns {HTMLElement|null} The matching element or null.
 */
export function byId(taskForm, id) {
  return taskForm.querySelector(`#${id}`);
}