import { getData, putUserData } from "./firebase.js";

const formControllers = new WeakMap();
const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_CATEGORY_LABEL = "Select task category";

// Expose createAddTaskForm for testing purposes and to allow reuse in other contexts if needed
export function createAddTaskForm(taskForm, createTaskValue) {
  const existingController = formControllers.get(taskForm);

  if (existingController) return existingController;

  const context = createFormContext(taskForm, createTaskValue);
  initializeForm(context);
  const controller = createController(context);
  formControllers.set(taskForm, controller);
  return controller;
}

// Internal functions for form context creation, event handling, and state management
function createFormContext(taskForm, createTaskValue) {
  const context = {
    taskForm,
    createTaskValue,
    state: createInitialState(),
    elements: createElements(taskForm),
  };

  context.handlers = createHandlers(context);
  return context;
}

// Initializes the form state with default values
function createInitialState() {
  return {
    assigneeContacts: [],
    selectedAssignees: [],
    selectedCategory: "",
    subtasks: [],
    selectedPriority: "",
  };
}

// Creates references to important form elements for easy access in event handlers and state updates
function createElements(taskForm) {
  return {
    title: getElement(taskForm, "title"),
    description: getElement(taskForm, "description"),
    dueDate: getElement(taskForm, "dueDate"),
    category: getElement(taskForm, "category"),
    categoryDropdown: taskForm.querySelector(".category_dropdown"),
    categoryToggle: getElement(taskForm, "categoryToggle"),
    categoryDropdownMenu: getElement(taskForm, "categoryDropdownMenu"),
    categoryLabel: getElement(taskForm, "categoryLabel"),
    assigneeToggle: getElement(taskForm, "assignee"),
    assigneeDropdownMenu: getElement(taskForm, "assigneeDropdownMenu"),
    selectedContacts: getElement(taskForm, "selectedContacts"),
    subtaskInput: getElement(taskForm, "subtask"),
    addSubtaskButton: getElement(taskForm, "addSubtaskButton"),
    subtaskList: getElement(taskForm, "subtaskList"),
    subtaskInputWrapper: taskForm.querySelector(".subtask_input_wrapper"),
    assigneeDropdown: taskForm.querySelector(".assignee_dropdown"),
  };
}

// Utility function to get an element by ID within the task form context
function getElement(taskForm, id) {
  return taskForm.querySelector(`#${id}`);
}

// Creates event handlers for various interactions within the form
function createHandlers(context) {
  return {
    documentClick: (event) => closeDropdownsOnOutsideClick(context, event),
    formReset: () => resetTaskFormState(context),
    formSubmit: (event) => handleTaskSubmit(context, event),
    formClick: (event) => delegateFormClick(context, event),
    formChange: (event) => delegateFormChange(context, event),
    subtaskInput: () => updateSubtaskButtonState(context),
    subtaskKeydown: (event) => handleSubtaskKeydown(context, event),
    addSubtaskClick: () => addSubtask(context),
  };
}

// Initializes the form by setting up event handlers, rendering dynamic content
function initializeForm(context) {
  setupSubtaskControls(context);
  renderAssigneeContacts(context);
  registerFormEvents(context);
}

// Creates a controller object that provides methods to reset the form state
function createController(context) {
  return {
    reset: () => resetTaskFormState(context),
    destroy: () => destroy(context),
  };
}

// Event delegation and handling functions for various user interactions within the form
function registerFormEvents(context) {
  document.addEventListener("click", context.handlers.documentClick);
  context.taskForm.addEventListener("reset", context.handlers.formReset);
  context.taskForm.addEventListener("submit", context.handlers.formSubmit);
  context.taskForm.addEventListener("click", context.handlers.formClick);
  context.taskForm.addEventListener("change", context.handlers.formChange);
}

// Unregisters all event listeners associated with the form to prevent memory leaks
function unregisterFormEvents(context) {
  document.removeEventListener("click", context.handlers.documentClick);
  context.taskForm.removeEventListener("reset", context.handlers.formReset);
  context.taskForm.removeEventListener("submit", context.handlers.formSubmit);
  context.taskForm.removeEventListener("click", context.handlers.formClick);
  context.taskForm.removeEventListener("change", context.handlers.formChange);
}

// Sets up event listeners and renders the initial state for subtask management
function setupSubtaskControls(context) {
  updateSubtaskButtonState(context);
  renderSubtasks(context);

  if (context.elements.subtaskInput) {
    context.elements.subtaskInput.addEventListener("input", context.handlers.subtaskInput);
    context.elements.subtaskInput.addEventListener("keydown", context.handlers.subtaskKeydown);
  }

  context.elements.addSubtaskButton?.addEventListener("click", context.handlers.addSubtaskClick);
}

// Cleans up event listeners related to subtask management to prevent memory leaks
function teardownSubtaskControls(context) {
  context.elements.subtaskInput?.removeEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.removeEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.addSubtaskButton?.removeEventListener("click", context.handlers.addSubtaskClick);
}

// Handles the keydown event for the subtask input field
function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  addSubtask(context);
}

// Delegates click events within the form to specific handlers based on the target element
function delegateFormClick(context, event) {
  if (handlePriorityClick(context, event.target)) return;
  if (handleAssigneeToggleClick(context, event.target)) return;
  if (handleCategoryToggleClick(context, event.target)) return;
  if (handleCategoryOptionClick(context, event.target)) return;
  handleRemoveSubtaskClick(context, event.target);
}

// Handles clicks on priority buttons
function handlePriorityClick(context, target) {
  const priorityButton = target.closest("[data-priority]");

  if (!priorityButton || !context.taskForm.contains(priorityButton)) {
    return false;
  }

  setPriority(context, priorityButton.dataset.priority);
  return true;
}

// Handles clicks on the assignee toggle button
function handleAssigneeToggleClick(context, target) {
  const assigneeToggle = target.closest("[data-assignee-toggle]");

  if (!assigneeToggle || !context.taskForm.contains(assigneeToggle)) {
    return false;
  }

  toggleAssigneeDropdown(context);
  return true;
}

// Handles clicks on the category toggle button
function handleCategoryToggleClick(context, target) {
  const categoryToggle = target.closest("[data-category-toggle]");

  if (!categoryToggle || !context.taskForm.contains(categoryToggle)) {
    return false;
  }

  toggleCategoryDropdown(context);
  return true;
}

// Handles clicks on category options within the category dropdown menu
function handleCategoryOptionClick(context, target) {
  const categoryOption = target.closest("[data-category-value]");

  if (!categoryOption || !context.taskForm.contains(categoryOption)) {
    return false;
  }

  selectCategory(context, categoryOption.dataset.categoryValue);
  return true;
}

// Handles clicks on the remove subtask buttons, allowing users to remove subtasks 
// from the list and updating the UI accordingly
function handleRemoveSubtaskClick(context, target) {
  const removeSubtaskButton = target.closest("[data-remove-subtask]");

  if (!removeSubtaskButton || !context.taskForm.contains(removeSubtaskButton)) {
    return false;
  }

  removeSubtask(context, Number(removeSubtaskButton.dataset.removeSubtask));
  return true;
}

// Delegates change events within the form to specific handlers based on the target element
function delegateFormChange(context, event) {
  const assigneeCheckbox = event.target.closest("[data-assignee-id]");

  if (!assigneeCheckbox || !context.taskForm.contains(assigneeCheckbox)) {
    return;
  }

  toggleAssigneeSelection(context, assigneeCheckbox.dataset.assigneeId);
}

// Toggles the visibility of the category dropdown menu and updates 
// the aria-expanded attribute for accessibility
function toggleCategoryDropdown(context) {
  if (!context.elements.categoryDropdownMenu || !context.elements.categoryToggle) {
    return;
  }

  const isOpen = context.elements.categoryDropdownMenu.classList.toggle("open");
  context.elements.categoryDropdown?.classList.toggle("open", isOpen);
  context.elements.categoryToggle.setAttribute("aria-expanded", String(isOpen));
}

// Handles the selection of a category from the dropdown menu, updating the form state
function selectCategory(context, categoryValue) {
  context.state.selectedCategory = categoryValue;

  if (context.elements.category) {
    context.elements.category.value = categoryValue;
  }

  if (context.elements.categoryLabel) {
    context.elements.categoryLabel.textContent = categoryValue;
  }

  closeCategoryDropdown(context);
}

// Closes any open dropdown menus when the user clicks outside of them
function closeDropdownsOnOutsideClick(context, event) {
  closeAssigneeDropdownOnOutsideClick(context, event);
  closeCategoryDropdownOnOutsideClick(context, event);
}

// Closes the category dropdown menu if the user clicks outside of it
function closeCategoryDropdownOnOutsideClick(context, event) {
  const { categoryDropdown, categoryDropdownMenu, categoryToggle } = context.elements;

  if (!categoryDropdown || !categoryDropdownMenu || !categoryToggle) {
    return;
  }

  if (categoryDropdown.contains(event.target)) {
    return;
  }

  closeCategoryDropdown(context);
}

// Closes the category dropdown menu and resets the aria-expanded attribute for accessibility
function closeCategoryDropdown(context) {
  const { categoryDropdown, categoryDropdownMenu, categoryToggle } = context.elements;

  if (!categoryDropdownMenu || !categoryToggle) {
    return;
  }

  categoryDropdownMenu.classList.remove("open");
  categoryDropdown?.classList.remove("open");
  categoryToggle.setAttribute("aria-expanded", "false");
}

// Resets the state of all priority buttons to inactive, ensuring that only one priority can be active at a time
function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

// Resets a specific priority button to inactive state, updating the UI to reflect that it is no longer selected
function resetPriorityButton(context, priority) {
  const button = getElement(context.taskForm, `prio_${priority}`);

  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

// Sets the selected priority for the task based on user interaction
function setPriority(context, priority) {
  const currentButton = getElement(context.taskForm, `prio_${priority}`);

  const isAlreadyActive = currentButton.classList.contains("active");
  resetPriorityButtons(context);

  if (isAlreadyActive) {
    context.state.selectedPriority = "";
    return;
  }

  currentButton.classList.add("active");
  currentButton.innerHTML = createPriorityMarkup(priority, "on");
  context.state.selectedPriority = priority;
}

// Creates the inner HTML markup for a priority button based on its priority level
function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

// Renders the list of contacts available for assignment in the assignee dropdown menu
async function renderAssigneeContacts(context) {
  try {
    context.state.assigneeContacts = await fetchContacts();
  } catch (error) {
    context.elements.assigneeDropdownMenu.innerHTML = '<div class="assignee_status">Can not load contacts.</div>';
    console.error("Failed to load contacts for assignee dropdown.", error);
    return;
  }

  if (context.state.assigneeContacts.length === 0) {
    context.elements.assigneeDropdownMenu.innerHTML = '<div class="assignee_status">No contacts available.</div>';
    updateAssigneeLabel(context);
    return;
  }

  context.elements.assigneeDropdownMenu.innerHTML = context.state.assigneeContacts.map(createAssigneeOption).join("");
  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

// Fetches the list of contacts from the data source, processes the data to extract relevant information,
// and returns a sorted array of contact objects for use in the assignee dropdown menu
async function fetchContacts() {
  const contacts = await getData("contacts");

  return Object.entries(contacts || {})
    .filter(([, contact]) => contact && typeof contact === "object")
    .map(([id, contact]) => ({ id, name: contact.name }))
    .sort((firstContact, secondContact) => firstContact.name.localeCompare(secondContact.name));
}

// Toggles the visibility of the assignee dropdown menu and updates the aria-expanded attribute for accessibility
function toggleAssigneeDropdown(context) {
  if (!context.elements.assigneeDropdownMenu || !context.elements.assigneeToggle) {
    return;
  }

  const isOpen = context.elements.assigneeDropdownMenu.classList.toggle("open");
  context.elements.assigneeToggle.setAttribute("aria-expanded", String(isOpen));
}

// Closes the assignee dropdown menu if the user clicks outside of it, ensuring that the dropdown is hidden when not in use
function closeAssigneeDropdownOnOutsideClick(context, event) {
  const { assigneeDropdown, assigneeDropdownMenu, assigneeToggle } = context.elements;

  if (!assigneeDropdown || !assigneeDropdownMenu || !assigneeToggle) {
    return;
  }

  if (assigneeDropdown.contains(event.target)) {
    return;
  }

  assigneeDropdownMenu.classList.remove("open");
  assigneeToggle.setAttribute("aria-expanded", "false");
}

// Toggles the selection of an assignee based on user interaction with the checkboxes in the assignee dropdown menu,
// updating the form state and synchronizing the UI to reflect the current selection of assignees for the task
function toggleAssigneeSelection(context, contactId) {
  const selectedIndex = context.state.selectedAssignees.indexOf(contactId);

  if (selectedIndex >= 0) {
    context.state.selectedAssignees.splice(selectedIndex, 1);
  } else {
    context.state.selectedAssignees.push(contactId);
  }

  syncAssigneeCheckboxes(context);
  updateAssigneeLabel(context);
}

// Synchronizes the state of the assignee checkboxes in the dropdown menu with 
// the current selection of assignees in the form state, ensuring that the UI accurately reflects the user's selections
function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    checkbox.checked = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
  });
}

// Updates the label that displays the selected assignees based on the current selection in the form state,
// showing the names of the selected contacts or a default message if no assignees are selected
function updateAssigneeLabel(context) {
  if (!context.elements.selectedContacts) {
    return;
  }

  const selectedNames = context.state.assigneeContacts
    .filter((contact) => context.state.selectedAssignees.includes(contact.id))
    .map((contact) => contact.name);

  context.elements.selectedContacts.textContent = selectedNames.map(getContactInitials).join(" ");
}

// Handles the addition of a new subtask based on user input, updating the form state and 
// UI to reflect the new subtask in the list
function addSubtask(context) {
  if (!context.elements.subtaskInput) {
    return;
  }

  const subtaskTitle = context.elements.subtaskInput.value.trim();

  if (!subtaskTitle) {
    updateSubtaskButtonState(context);
    return;
  }

  context.state.subtasks.push(subtaskTitle);
  context.elements.subtaskInput.value = "";
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

// Renders the list of subtasks in the UI based on the current state of subtasks 
// in the form state, ensuring that the UI accurately reflects the user's input
function renderSubtasks(context) {
  if (!context.elements.subtaskList) {
    return;
  }

  context.elements.subtaskList.innerHTML = context.state.subtasks.map(createSubtaskItem).join("");
}

// Creates the HTML markup for a single subtask item, including the subtask title and a button to remove the subtask from the list
function createSubtaskItem(subtaskTitle, index) {
  return `
    <section class="subtask_item">
      <span class="subtask_item_text">${subtaskTitle}</span>
      <button type="button" class="subtask_remove_button" aria-label="Remove subtask ${subtaskTitle}" data-remove-subtask="${index}">×</button>
    </section>
  `;
}

// Removes a subtask from the list based on the provided index, updating the form state and 
// re-rendering the list of subtasks to reflect the change in the UI
function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  renderSubtasks(context);
}

// Updates the state of the add subtask button based on whether there is input in the subtask input field,
// enabling the button when there is input and disabling it when the input is empty, while also updating the styling of the input wrapper to provide visual feedback to the user
function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, subtaskInputWrapper } = context.elements;

  if (!subtaskInput || !addSubtaskButton || !subtaskInputWrapper) {
    return;
  }

  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

// Handles the form submission event, validating the selected category, building the task payload based on the form state,
// sending the data to the server, and providing feedback to the user based on the success or failure of the operation
async function handleTaskSubmit(context, event) {
  event.preventDefault();

  if (!validateCategorySelection(context)) {
    return;
  }

  const task = buildTaskPayload(context);
  const createButton = event.submitter;

  try {
    setSubmitterDisabled(createButton, true);
    await putUserData(`${context.createTaskValue}/${task.id}`, task);
    context.taskForm.reset();
  } catch (error) {
    console.error("Failed to create task.", error);
  } finally {
    setSubmitterDisabled(createButton, false);
  }
}

// Utility function to enable or disable the form submit button, providing feedback 
// to the user during asynchronous operations such as form submission
function setSubmitterDisabled(button, disabled) {
  if (button) {
    button.disabled = disabled;
  }
}

// Resets the state of the task form to its initial values, clearing all user input and 
// selections, and updating the UI to reflect the reset state, ensuring that the form is ready for new input after a reset action
function resetTaskFormState(context) {
  window.setTimeout(() => refreshFormState(context), 0);
}

// Refreshes the form state by resetting all relevant state properties to their initial values,
// closing any open dropdowns, resetting the UI elements to reflect the cleared state, and ensuring that the form is in a clean state for new input
function refreshFormState(context) {
  context.state.selectedPriority = "";
  context.state.selectedAssignees = [];
  context.state.selectedCategory = "";
  context.state.subtasks = [];
  closeCategoryDropdown(context);
  resetPriorityButtons(context);
  resetCategorySelection(context);
  renderAssigneeContacts(context);
  updateAssigneeLabel(context);
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

// Destroys the form controller by unregistering all event listeners and cleaning up 
// any resources associated with the form, ensuring that there are no memory leaks or unintended behavior when the form is no longer needed
function destroy(context) {
  unregisterFormEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}

// Builds the payload for the new task based on the current state of the form
function buildTaskPayload(context) {
  const assignedContacts = context.state.assigneeContacts.filter((contact) => {
    return context.state.selectedAssignees.includes(contact.id);
  });

  return {
    id: Date.now().toString(),
    title: context.elements.title?.value.trim() || "",
    description: context.elements.description?.value.trim() || "",
    dueDate: context.elements.dueDate?.value || "",
    status: "to do",
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority,
    assignees: assignedContacts,
    subtasks: context.state.subtasks.map((subtaskTitle) => ({
      title: subtaskTitle,
      done: false,
    })),
  };
}

// Resets the category selection in the form, clearing the selected category 
// from the form state and updating the UI to reflect that no category is currently selected
function resetCategorySelection(context) {
  if (context.elements.category) {
    context.elements.category.value = "";
  }

  if (context.elements.categoryLabel) {
    context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
  }
}

// Validates that a category has been selected before allowing the form submission to proceed
function validateCategorySelection(context) {
  if (context.state.selectedCategory) {
    return true;
  }

  context.elements.categoryToggle?.focus();
  return false;
}

// Utility function to capitalize the first letter of a string, used for formatting priority labels and other text in the UI
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Utility function to get the initials of a contact's name, used for displaying selected assignees in a compact format
function getContactInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Creates the HTML markup for an assignee option in the dropdown menu based on the contact information
function createAssigneeOption(contact) {
  return `
    <label class="assignee_option" for="assignee_${contact.id}">
      <span class="assignee_option_text">
        <span class="assignee_option_name">${contact.name}</span>
      </span>
      <input type="checkbox" id="assignee_${contact.id}" value="${contact.id}" data-assignee-id="${contact.id}">
    </label>
  `;
}