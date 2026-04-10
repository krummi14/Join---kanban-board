import { getData, putUserData } from "./firebase.js";

const formControllers = new WeakMap();
const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_CATEGORY_LABEL = "Select task category";

export function createAddTaskForm(taskForm, createTaskCategory) {
  const existingController = formControllers.get(taskForm);

  if (existingController) return existingController;

  const context = createFormContext(taskForm, createTaskCategory);
  initializeForm(context);
  const controller = createController(context);
  formControllers.set(taskForm, controller);
  return controller;
}

function createFormContext(taskForm, createTaskCategory) {
  const context = {
    taskForm,
    createTaskCategory,
    state: createInitialState(),
    elements: createElements(taskForm),
  };

  context.handlers = createHandlers(context);
  return context;
}

function createInitialState() {
  return {
    assigneeContacts: [],
    selectedAssignees: [],
    selectedCategory: "",
    subtasks: [],
    selectedPriority: "",
  };
}

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

function getElement(taskForm, id) {
  return taskForm.querySelector(`#${id}`);
}

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

function initializeForm(context) {
  setupSubtaskControls(context);
  renderAssigneeContacts(context);
  registerFormEvents(context);
}

function createController(context) {
  return {
    reset: () => resetTaskFormState(context),
    destroy: () => destroy(context),
  };
}

function registerFormEvents(context) {
  document.addEventListener("click", context.handlers.documentClick);
  context.taskForm.addEventListener("reset", context.handlers.formReset);
  context.taskForm.addEventListener("submit", context.handlers.formSubmit);
  context.taskForm.addEventListener("click", context.handlers.formClick);
  context.taskForm.addEventListener("change", context.handlers.formChange);
}

function unregisterFormEvents(context) {
  document.removeEventListener("click", context.handlers.documentClick);
  context.taskForm.removeEventListener("reset", context.handlers.formReset);
  context.taskForm.removeEventListener("submit", context.handlers.formSubmit);
  context.taskForm.removeEventListener("click", context.handlers.formClick);
  context.taskForm.removeEventListener("change", context.handlers.formChange);
}

function setupSubtaskControls(context) {
  updateSubtaskButtonState(context);
  renderSubtasks(context);

  if (context.elements.subtaskInput) {
    context.elements.subtaskInput.addEventListener("input", context.handlers.subtaskInput);
    context.elements.subtaskInput.addEventListener("keydown", context.handlers.subtaskKeydown);
  }

  context.elements.addSubtaskButton?.addEventListener("click", context.handlers.addSubtaskClick);
}

function teardownSubtaskControls(context) {
  context.elements.subtaskInput?.removeEventListener("input", context.handlers.subtaskInput);
  context.elements.subtaskInput?.removeEventListener("keydown", context.handlers.subtaskKeydown);
  context.elements.addSubtaskButton?.removeEventListener("click", context.handlers.addSubtaskClick);
}

function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  addSubtask(context);
}

function delegateFormClick(context, event) {
  if (handlePriorityClick(context, event.target)) return;
  if (handleAssigneeToggleClick(context, event.target)) return;
  if (handleCategoryToggleClick(context, event.target)) return;
  if (handleCategoryOptionClick(context, event.target)) return;
  handleRemoveSubtaskClick(context, event.target);
}

function handlePriorityClick(context, target) {
  const priorityButton = target.closest("[data-priority]");

  if (!priorityButton || !context.taskForm.contains(priorityButton)) {
    return false;
  }

  setPriority(context, priorityButton.dataset.priority);
  return true;
}

function handleAssigneeToggleClick(context, target) {
  const assigneeToggle = target.closest("[data-assignee-toggle]");

  if (!assigneeToggle || !context.taskForm.contains(assigneeToggle)) {
    return false;
  }

  toggleAssigneeDropdown(context);
  return true;
}

function handleCategoryToggleClick(context, target) {
  const categoryToggle = target.closest("[data-category-toggle]");

  if (!categoryToggle || !context.taskForm.contains(categoryToggle)) {
    return false;
  }

  toggleCategoryDropdown(context);
  return true;
}

function handleCategoryOptionClick(context, target) {
  const categoryOption = target.closest("[data-category-value]");

  if (!categoryOption || !context.taskForm.contains(categoryOption)) {
    return false;
  }

  selectCategory(context, categoryOption.dataset.categoryValue);
  return true;
}

function handleRemoveSubtaskClick(context, target) {
  const removeSubtaskButton = target.closest("[data-remove-subtask]");

  if (!removeSubtaskButton || !context.taskForm.contains(removeSubtaskButton)) {
    return false;
  }

  removeSubtask(context, Number(removeSubtaskButton.dataset.removeSubtask));
  return true;
}

function delegateFormChange(context, event) {
  const assigneeCheckbox = event.target.closest("[data-assignee-id]");

  if (!assigneeCheckbox || !context.taskForm.contains(assigneeCheckbox)) {
    return;
  }

  toggleAssigneeSelection(context, assigneeCheckbox.dataset.assigneeId);
}

function toggleCategoryDropdown(context) {
  if (!context.elements.categoryDropdownMenu || !context.elements.categoryToggle) {
    return;
  }

  const isOpen = context.elements.categoryDropdownMenu.classList.toggle("open");
  context.elements.categoryDropdown?.classList.toggle("open", isOpen);
  context.elements.categoryToggle.setAttribute("aria-expanded", String(isOpen));
}

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

function closeDropdownsOnOutsideClick(context, event) {
  closeAssigneeDropdownOnOutsideClick(context, event);
  closeCategoryDropdownOnOutsideClick(context, event);
}

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

function closeCategoryDropdown(context) {
  const { categoryDropdown, categoryDropdownMenu, categoryToggle } = context.elements;

  if (!categoryDropdownMenu || !categoryToggle) {
    return;
  }

  categoryDropdownMenu.classList.remove("open");
  categoryDropdown?.classList.remove("open");
  categoryToggle.setAttribute("aria-expanded", "false");
}

function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

function resetPriorityButton(context, priority) {
  const button = getElement(context.taskForm, `prio_${priority}`);

  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

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

function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

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

async function fetchContacts() {
  const contacts = await getData("contacts");

  return Object.entries(contacts || {})
    .filter(([, contact]) => contact && typeof contact === "object")
    .map(([id, contact]) => ({ id, name: contact.name }))
    .sort((firstContact, secondContact) => firstContact.name.localeCompare(secondContact.name));
}

function toggleAssigneeDropdown(context) {
  if (!context.elements.assigneeDropdownMenu || !context.elements.assigneeToggle) {
    return;
  }

  const isOpen = context.elements.assigneeDropdownMenu.classList.toggle("open");
  context.elements.assigneeToggle.setAttribute("aria-expanded", String(isOpen));
}

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

function syncAssigneeCheckboxes(context) {
  context.taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
    checkbox.checked = context.state.selectedAssignees.includes(checkbox.dataset.assigneeId);
  });
}

function updateAssigneeLabel(context) {
  if (!context.elements.selectedContacts) {
    return;
  }

  const selectedNames = context.state.assigneeContacts
    .filter((contact) => context.state.selectedAssignees.includes(contact.id))
    .map((contact) => contact.name);

  context.elements.selectedContacts.textContent = selectedNames.map(getContactInitials).join(" ");
}

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

function renderSubtasks(context) {
  if (!context.elements.subtaskList) {
    return;
  }

  context.elements.subtaskList.innerHTML = context.state.subtasks.map(createSubtaskItem).join("");
}

function createSubtaskItem(subtaskTitle, index) {
  return `
    <section class="subtask_item">
      <span class="subtask_item_text">${subtaskTitle}</span>
      <button type="button" class="subtask_remove_button" aria-label="Remove subtask ${subtaskTitle}" data-remove-subtask="${index}">×</button>
    </section>
  `;
}

function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  renderSubtasks(context);
}

function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, subtaskInputWrapper } = context.elements;

  if (!subtaskInput || !addSubtaskButton || !subtaskInputWrapper) {
    return;
  }

  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

async function handleTaskSubmit(context, event) {
  event.preventDefault();

  if (!validateCategorySelection(context)) {
    return;
  }

  const task = buildTaskPayload(context);
  const createButton = event.submitter;

  try {
    setSubmitterDisabled(createButton, true);
    await putUserData(`${context.createTaskCategory}/${task.id}`, task);
    context.taskForm.reset();
  } catch (error) {
    console.error("Failed to create task.", error);
  } finally {
    setSubmitterDisabled(createButton, false);
  }
}

function setSubmitterDisabled(button, disabled) {
  if (button) {
    button.disabled = disabled;
  }
}

function resetTaskFormState(context) {
  window.setTimeout(() => refreshFormState(context), 0);
}

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

function destroy(context) {
  unregisterFormEvents(context);
  teardownSubtaskControls(context);
  formControllers.delete(context.taskForm);
}

function buildTaskPayload(context) {
  const assignedContacts = context.state.assigneeContacts.filter((contact) => {
    return context.state.selectedAssignees.includes(contact.id);
  });

  return {
    id: Date.now().toString(),
    title: context.elements.title?.value.trim() || "",
    description: context.elements.description?.value.trim() || "",
    dueDate: context.elements.dueDate?.value || "",
    status: `${context.createTaskCategory}`,
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority,
    assignees: assignedContacts,
    subtasks: context.state.subtasks.map((subtaskTitle) => ({
      title: subtaskTitle,
      done: false,
    })),
  };
}

function resetCategorySelection(context) {
  if (context.elements.category) {
    context.elements.category.value = "";
  }

  if (context.elements.categoryLabel) {
    context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
  }
}

function validateCategorySelection(context) {
  if (context.state.selectedCategory) {
    return true;
  }

  context.elements.categoryToggle?.focus();
  return false;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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