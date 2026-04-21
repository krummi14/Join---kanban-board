import { createAddTaskForm } from "./addTaskForm.js";
import { createAddTaskFormTemplate,  createSubtaskItem } from "./template/add_task_template.js";
import { getTasks, deleteTask, toggleSubtask } from "./board_taskService.js";
import {
  generateTaskOverlay,
  getAssigneeTemplate,
  getNoAssigneesTemplate,
  getNoSubtasksTemplate,
  generateSubtask,
} from "./template/board_template.js";
import { loadTasks } from "./board_taskService.js";
import { updateHTML } from "./board_taskView.js";
import { createEditTaskTemplate } from "./template/board_template.js";

let addTaskFormController = null;

// ======================
// OVERLAY OPEN (VIEW)
// ======================
export function openOverlay(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return;

  const overlay = document.getElementById("overlay");

  overlay.innerHTML = generateTaskOverlay(task);
  overlay.classList.remove("hidden");
}

// ======================
// CLOSE + CLICK
// ======================
export function closeOverlay() {
  document.getElementById("overlay")?.classList.add("hidden");
}

export function handleOverlayClick(event) {
  if (event.target.id === "overlay") {
    closeOverlay();
  }
}

// ======================
// USER HELPERS
// ======================
function getCurrentUserName() {
  return localStorage.getItem("userName") || "";
}


function generateAvatarHTML(assignees) {
  let visible = assignees.slice(0, 3);
  let rest = assignees.length - 3;

  let html = "";

  for (let i = 0; i < visible.length; i++) {
    html += generateSingleAvatar(visible[i]);
  }

  if (rest > 0) {
    html += generateExtraAvatar(rest);
  }

  return html;
}

export function getAvatarHTML(task) {
  const hasAssignees = task.assignees && task.assignees.length > 0;

  if (!hasAssignees) {
    return getNoAssigneesCardTemplate();
  }

  return generateAvatarHTML(task.assignees);
}

// ======================
// ASSIGNEES RENDER
// ======================
function generateAssigneesContent(task) {
  if (!task.assignees || task.assignees.length === 0) {
    return getNoAssigneesTemplate();
  }

  let html = "";
  const currentUser = getCurrentUserName();

  for (let i = 0; i < task.assignees.length; i++) {
    const a = task.assignees[i];
    const isYou = a.name === currentUser;

    html += getAssigneeTemplate(a, isYou);
  }

  return html;
}

// ======================
// SUBTASKS RENDER
// ======================
function generateSubtasksContent(task) {
  if (!task.subtasks || task.subtasks.length === 0) {
    return getNoSubtasksTemplate();
  }

  let html = "";

  for (let i = 0; i < task.subtasks.length; i++) {
    html += generateSubtask(task, task.subtasks[i], i);
  }

  return html;
}

// ======================
// SUBTASK TOGGLE
// ======================
window.toggleSubtask = async function(taskId, index) {
  console.log("CLICK WORKS");

  await toggleSubtask(taskId, index);

  await loadTasks(window.BOARD_COLUMNS);
  window.updateHTML(window.BOARD_COLUMNS);
};
// ======================
// DATE FORMAT
// ======================
function formatDate(dateString) {
  if (!dateString) return "";

  if (dateString.includes("/")) return dateString;

  const date = new Date(dateString);
  if (isNaN(date)) return dateString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ======================
// DELETE
// ======================
window.deleteTask = async function(taskId) {
  await deleteTask(taskId);

  closeOverlay();
  updateHTML?.();
};

// ======================
// EDIT (UNVERÄNDERT STRUKTUR)
// ======================
async function editTask(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const form = renderEditForm(task);
  initEditController(form, task);
  setupEditUI(form);
  initEditPrefill(task, form);
}

// ======================
// RENDER EDIT FORM
// ======================
function renderEditForm(task) {
  const overlay = document.getElementById("overlay");

  overlay.innerHTML = createEditTaskTemplate(); // ✅ NEU
  overlay.classList.remove("hidden");

  return document.getElementById("taskForm");
}

// ======================
// INIT CONTROLLER
// ======================
function initEditController(form, task) {
  addTaskFormController?.destroy();

  addTaskFormController = createAddTaskForm(
    form,
    task.sourcePath || task.status,
    {
      onSave: async (taskId) => {
  console.log("SAVE TRIGGERED");
  console.log(window.BOARD_COLUMNS);

  await loadTasks(window.BOARD_COLUMNS);
  updateHTML(window.BOARD_COLUMNS);

  closeOverlay();
  openOverlay(taskId);
}
    }
  );

  form.dataset.editId = task.id;
}

// ======================
// UI EDIT
// ======================
function setupEditUI() {
  const submitBtn = document.getElementById("createTask");
  const clearBtn = document.querySelector(".clear_btn");

  if (submitBtn) submitBtn.textContent = "Save changes";
  if (clearBtn) clearBtn.style.display = "none";
}

// ======================
// PREFILL
// ======================
function initEditPrefill(task, form) {
  setTimeout(() => {
    fillBasicFields(task);
    fillCategory(task);
    fillPriority(task);
    fillSubtasks(task);
    fillAssignees(task, form);

    form.dataset.editId = task.id;
  }, 0);
}

// ======================
// PREFILL FIELDS
// ======================
function fillBasicFields(task) {
  document.getElementById("title").value = task.title || "";
  document.getElementById("description").value = task.description || "";
  document.getElementById("dueDate").value = task.dueDate || "";
}

function fillCategory(task) {
  const label = document.getElementById("categoryLabel");
  const input = document.getElementById("category");

  if (!label || !input) return;

  label.textContent = task.type || "Select task category";
  input.value = task.type || "";
}

function fillPriority(task) {
  if (!task.priority) return;

  const btn = document.querySelector(`[data-priority="${task.priority}"]`);
  btn?.click();
}

function fillSubtasks(task) {
  if (!task.subtasks?.length) return;

  const ctx = addTaskFormController.context;

  ctx.state.subtasks = [...task.subtasks];

  ctx.elements.subtaskList.innerHTML =
    task.subtasks.map((st, i) => createSubtaskItem(st, i)).join("");
}

function fillAssignees(task, form) {
  if (!task.assignees?.length) return;

  const ctx = addTaskFormController.context;
  const ids = task.assignees.map(a => a.id);

  ctx.state.selectedAssignees = ids;

  // ✅ CHECKBOXEN setzen (wie bisher)
  setTimeout(() => {
    form.querySelectorAll("[data-assignee-id]").forEach(cb => {
      cb.checked = ids.includes(cb.dataset.assigneeId);
    });
  }, 50);


}


window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;
window.generateAssigneesContent = generateAssigneesContent;
window.generateSubtasksContent = generateSubtasksContent;
window.formatDate = formatDate;

window.deleteTask = deleteTask;
window.editTask = editTask;
window.createAddTaskFormTemplate = createAddTaskFormTemplate;


window.toggleAssigneeDropdown = function (event) {
  if (event) event.stopPropagation();

  const menu = document.getElementById("assigneeDropdownMenu");
  if (!menu) return;

  menu.classList.toggle("d_none");
};

window.toggleCategoryDropdown = function (event) {
  if (event) event.stopPropagation();

  const menu = document.getElementById("categoryDropdownMenu");
  if (!menu) return;

  menu.classList.toggle("d_none");
};