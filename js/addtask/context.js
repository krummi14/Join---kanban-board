/** Creates the default state object for the Add Task form. */
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

/** Collects and returns the DOM elements used by the form. */
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

/** Returns the form input elements used by the Add Task module. */
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

/** Returns the dropdown-related elements used by the Add Task module. */
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

/** Finds an element by id within the current form. */
export function byId(taskForm, id) {
  return taskForm.querySelector(`#${id}`);
}