import { getData, putUserData } from "./firebase.js";

const formControllers = new WeakMap();

  
export function createAddTaskForm(taskForm, createTaskCategory) {
  if (!taskForm) {
    return null;
  }

  const existingController = formControllers.get(taskForm);

  if (existingController) {
    return existingController;
  }

  const state = {
    assigneeContacts: [],
    selectedAssignees: [],
    subtasks: [],
    selectedPriority: "",
  };

  const elements = {
    title: getElement("title"),
    description: getElement("description"),
    dueDate: getElement("dueDate"),
    category: getElement("category"),
    assigneeToggle: getElement("assignee"),
    assigneeDropdownMenu: getElement("assigneeDropdownMenu"),
    selectedContacts: getElement("selectedContacts"),
    subtaskInput: getElement("subtask"),
    addSubtaskButton: getElement("addSubtaskButton"),
    subtaskList: getElement("subtaskList"),
    subtaskInputWrapper: taskForm.querySelector(".subtask_input_wrapper"),
    assigneeDropdown: taskForm.querySelector(".assignee_dropdown"),
  };

  const handleDocumentClick = (event) => closeAssigneeDropdownOnOutsideClick(event);
  const handleFormReset = () => resetTaskFormState();
  const handleFormSubmit = (event) => handleTaskSubmit(event);
  const handleFormClick = (event) => delegateFormClick(event);
  const handleFormChange = (event) => delegateFormChange(event);
  const handleSubtaskInput = () => updateSubtaskButtonState();
  const handleSubtaskKeydown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addSubtask();
  };
  const handleAddSubtaskClick = () => addSubtask();

  setupSubtaskControls();
  renderAssigneeContacts();
  document.addEventListener("click", handleDocumentClick);
  taskForm.addEventListener("reset", handleFormReset);
  taskForm.addEventListener("submit", handleFormSubmit);
  taskForm.addEventListener("click", handleFormClick);
  taskForm.addEventListener("change", handleFormChange);

  const controller = {
    reset: resetTaskFormState,
    destroy,
  };

  formControllers.set(taskForm, controller);
  return controller;

  function getElement(id) {
    return taskForm.querySelector(`#${id}`);
  }

  function setupSubtaskControls() {
    updateSubtaskButtonState();
    renderSubtasks();

    if (elements.subtaskInput) {
      elements.subtaskInput.addEventListener("input", handleSubtaskInput);
      elements.subtaskInput.addEventListener("keydown", handleSubtaskKeydown);
    }

    if (elements.addSubtaskButton) {
      elements.addSubtaskButton.addEventListener("click", handleAddSubtaskClick);
    }
  }

  function delegateFormClick(event) {
    const priorityButton = event.target.closest("[data-priority]");

    if (priorityButton && taskForm.contains(priorityButton)) {
      setPriority(priorityButton.dataset.priority);
      return;
    }

    const assigneeToggle = event.target.closest("[data-assignee-toggle]");

    if (assigneeToggle && taskForm.contains(assigneeToggle)) {
      toggleAssigneeDropdown();
      return;
    }

    const removeSubtaskButton = event.target.closest("[data-remove-subtask]");

    if (removeSubtaskButton && taskForm.contains(removeSubtaskButton)) {
      removeSubtask(Number(removeSubtaskButton.dataset.removeSubtask));
    }
  }

  function delegateFormChange(event) {
    const assigneeCheckbox = event.target.closest("[data-assignee-id]");

    if (assigneeCheckbox && taskForm.contains(assigneeCheckbox)) {
      toggleAssigneeSelection(assigneeCheckbox.dataset.assigneeId);
    }
  }

  function resetPriorityButtons() {
    ["urgent", "medium", "low"].forEach((priority) => {
      const button = getElement(`prio_${priority}`);

      if (!button) {
        return;
      }

      button.classList.remove("active");
      button.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_off.svg" alt="Button ${capitalize(priority)}">`;
    });
  }

  function setPriority(priority) {
    const currentButton = getElement(`prio_${priority}`);

    if (!currentButton) {
      return;
    }

    const isAlreadyActive = currentButton.classList.contains("active");

    resetPriorityButtons();
    if (isAlreadyActive) {
      state.selectedPriority = "";
      return;
    }

    currentButton.classList.add("active");
    currentButton.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_on.svg" alt="Button ${capitalize(priority)}">`;
    state.selectedPriority = priority;
  }

  async function renderAssigneeContacts() {
    if (!elements.assigneeDropdownMenu) {
      return;
    }

    try {
      state.assigneeContacts = await fetchContacts();
    } catch (error) {
      elements.assigneeDropdownMenu.innerHTML = '<div class="assignee_status">Can not load contacts.</div>';
      console.error("Failed to load contacts for assignee dropdown.", error);
      return;
    }

    if (state.assigneeContacts.length === 0) {
      elements.assigneeDropdownMenu.innerHTML = '<div class="assignee_status">No contacts available.</div>';
      updateAssigneeLabel();
      return;
    }

    elements.assigneeDropdownMenu.innerHTML = state.assigneeContacts.map((contact) => createAssigneeOption(contact)).join("");
    syncAssigneeCheckboxes();
    updateAssigneeLabel();
  }

  async function fetchContacts() {
    const contacts = await getData("contacts");

    return Object.entries(contacts || {})
      .filter(([, contact]) => contact && typeof contact === "object")
      .map(([id, contact]) => ({
        id,
        name: contact.name,
      }))
      .sort((firstContact, secondContact) => firstContact.name.localeCompare(secondContact.name));
  }

  function toggleAssigneeDropdown() {
    if (!elements.assigneeDropdownMenu || !elements.assigneeToggle) {
      return;
    }

    const isOpen = elements.assigneeDropdownMenu.classList.toggle("open");
    elements.assigneeToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function closeAssigneeDropdownOnOutsideClick(event) {
    if (!elements.assigneeDropdown || !elements.assigneeDropdownMenu || !elements.assigneeToggle) {
      return;
    }

    if (elements.assigneeDropdown.contains(event.target)) {
      return;
    }

    elements.assigneeDropdownMenu.classList.remove("open");
    elements.assigneeToggle.setAttribute("aria-expanded", "false");
  }

  function toggleAssigneeSelection(contactId) {
    const selectedIndex = state.selectedAssignees.indexOf(contactId);

    if (selectedIndex >= 0) {
      state.selectedAssignees.splice(selectedIndex, 1);
    } else {
      state.selectedAssignees.push(contactId);
    }

    syncAssigneeCheckboxes();
    updateAssigneeLabel();
  }

  function syncAssigneeCheckboxes() {
    taskForm.querySelectorAll("[data-assignee-id]").forEach((checkbox) => {
      checkbox.checked = state.selectedAssignees.includes(checkbox.dataset.assigneeId);
    });
  }

  function updateAssigneeLabel() {
    if (!elements.selectedContacts) {
      return;
    }

    const selectedNames = state.assigneeContacts
      .filter((contact) => state.selectedAssignees.includes(contact.id))
      .map((contact) => contact.name);

    elements.selectedContacts.textContent = selectedNames.map(getContactInitials).join(" ");
  }

  function addSubtask() {
    if (!elements.subtaskInput) {
      return;
    }

    const subtaskTitle = elements.subtaskInput.value.trim();

    if (!subtaskTitle) {
      updateSubtaskButtonState();
      return;
    }

    state.subtasks.push(subtaskTitle);
    elements.subtaskInput.value = "";
    renderSubtasks();
    updateSubtaskButtonState();
  }

  function renderSubtasks() {
    if (!elements.subtaskList) {
      return;
    }

    elements.subtaskList.innerHTML = state.subtasks
      .map((subtaskTitle, index) => createSubtaskItem(subtaskTitle, index))
      .join("");
  }

  function removeSubtask(index) {
    state.subtasks.splice(index, 1);
    renderSubtasks();
  }

  function updateSubtaskButtonState() {
    if (!elements.subtaskInput || !elements.addSubtaskButton || !elements.subtaskInputWrapper) {
      return;
    }

    const hasInput = elements.subtaskInput.value.trim().length > 0;

    elements.addSubtaskButton.disabled = !hasInput;
    elements.subtaskInputWrapper.classList.toggle("has-value", hasInput);
  }

  function buildTaskPayload() {
    const assignedContacts = state.assigneeContacts.filter((contact) => state.selectedAssignees.includes(contact.id));

    return {
    id: Date.now().toString(),
    title: elements.title?.value.trim() || "",
    description: elements.description?.value.trim() || "",
    dueDate: elements.dueDate?.value || "",

    // 🔥 WICHTIG
    status: "to do",

    // 🔥 nur für Beschreibung
    type: elements.category?.value || "",

    priority: state.selectedPriority,
    assignees: assignedContacts,
    subtasks: state.subtasks.map((subtaskTitle) => ({
      title: subtaskTitle,
      done: false,
      })),
    };
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();

    const task = buildTaskPayload();
    const createButton = event.submitter;

    try {
      if (createButton) {
        createButton.disabled = true;
      }

      await putUserData(`${createTaskCategory}/${task.id}`, task);
      taskForm.reset();
    } catch (error) {
      console.error("Failed to create task.", error);
    } finally {
      if (createButton) {
        createButton.disabled = false;
      }
    }
  }

  function resetTaskFormState() {
    window.setTimeout(() => {
      state.selectedPriority = "";
      state.selectedAssignees = [];
      state.subtasks = [];
      resetPriorityButtons();
      renderAssigneeContacts();
      updateAssigneeLabel();
      renderSubtasks();
      updateSubtaskButtonState();
    }, 0);
  }

  function destroy() {
    document.removeEventListener("click", handleDocumentClick);
    taskForm.removeEventListener("reset", handleFormReset);
    taskForm.removeEventListener("submit", handleFormSubmit);
    taskForm.removeEventListener("click", handleFormClick);
    taskForm.removeEventListener("change", handleFormChange);

    if (elements.subtaskInput) {
      elements.subtaskInput.removeEventListener("input", handleSubtaskInput);
      elements.subtaskInput.removeEventListener("keydown", handleSubtaskKeydown);
    }

    if (elements.addSubtaskButton) {
      elements.addSubtaskButton.removeEventListener("click", handleAddSubtaskClick);
    }

    formControllers.delete(taskForm);
  }
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

function createSubtaskItem(subtaskTitle, index) {
  return `
    <section class="subtask_item">
      <span class="subtask_item_text">${subtaskTitle}</span>
      <button type="button" class="subtask_remove_button" aria-label="Remove subtask ${subtaskTitle}" data-remove-subtask="${index}">×</button>
    </section>
  `;
}