import { createAddTaskForm } from "../addtask/addTaskForm.js";
import { createAddTaskFormTemplate } from "../template/add_task_template.js";
import { createEditTaskTemplate } from "../template/board_edit_template.js";
import { getTasks, toggleSubtask } from "./board_taskService.js";
import {
  generateTaskOverlay,
  getAssigneeTemplate,
  getNoAssigneesTemplate,
  getNoSubtasksTemplate,
  generateSubtask,
} from "../template/board_template.js";
import { loadTasks } from "./board_taskService.js";
import { initializeDueDatePicker } from "../addtask/dueDate.js";


let addTaskFormController = null;

export function openOverlay(taskId) {
  const task = findTask(taskId);
  if (!task) return;
  renderOverlay(generateTaskOverlay(task));
}

export function closeOverlay() {
  getOverlayElement()?.classList.add("hidden");
}

export function handleOverlayClick(event) {
  if (event.target.id !== "overlay") return;
  closeOverlay();
}

function getCurrentUserName() {
  return localStorage.getItem("userName") || "";
}

function generateAssigneesContent(task) {
  const currentUser = getCurrentUserName();
  if (!task.assignees?.length) return getNoAssigneesTemplate();
  return task.assignees.map((assignee) => createAssigneeMarkup(assignee, currentUser)).join("");
}

function generateSubtasksContent(task) {
  if (!task.subtasks?.length) return getNoSubtasksTemplate();
  return task.subtasks.map((subtask, index) => generateSubtask(task, subtask, index)).join("");
}

window.toggleSubtask = async function (taskId, index) {
  await toggleSubtask(taskId, index);
  await refreshBoard();
};

function formatDate(dateString) {
  if (!dateString) return "";
  if (dateString.includes("/")) return dateString;
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return formatDateParts(date);
}

async function editTask(taskId) {
  const task = findTask(taskId);
  if (!task) return;
  const form = renderEditForm();
  initEditController(form, task);
  setupEditUI();
  initEditPrefill(task);
}

// ======================
// RENDER EDIT FORM
// ======================
function renderEditForm(task) {
  const overlay = document.getElementById("overlay");

  overlay.innerHTML = createEditTaskTemplate();
  overlay.classList.remove("hidden");

  const form = document.getElementById("taskForm");

  const context = {
    taskForm: form,
    elements: {
      dueDate: form.querySelector("[data-due-date]"),
      dueDatePicker: form.querySelector(".due_date_picker"),
      dueDateMenu: form.querySelector(".due_date_menu"),
      dueDateDays: form.querySelector(".due_date_days"),
      dueDateMonthLabel: form.querySelector(".due_date_month_label"),
    },
    state: {},
  };

  initializeDueDatePicker(context);

  return form;
}
// ======================
// INIT CONTROLLER
// ======================

function initEditController(form, task) {
  destroyEditController();
  addTaskFormController = createAddTaskForm(form, getTaskSourcePath(task), getEditControllerConfig());
}

function setupEditUI() {
  const submitBtn = document.getElementById("createTask");
  const clearBtn = document.querySelector(".clear_btn");
  if (submitBtn) submitBtn.textContent = "Save changes";
  if (clearBtn) clearBtn.style.display = "none";

  // 🔥 FIX
  const menu = document.getElementById("assigneeDropdownMenu");
  menu?.classList.add("d_none");
}

function initEditPrefill(task) {
  if (!addTaskFormController) return;
  addTaskFormController.prefillTask(task);
}

window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;
window.generateAssigneesContent = generateAssigneesContent;
window.generateSubtasksContent = generateSubtasksContent;
window.formatDate = formatDate;
window.editTask = editTask;
window.createAddTaskFormTemplate = createAddTaskFormTemplate;

window.toggleAssigneeDropdown = function (event) {
  event.stopPropagation();
  toggleMenuVisibility("assigneeDropdownMenu");
};

window.toggleCategoryDropdown = function (event) {
  if (event) event.stopPropagation();
  toggleMenuVisibility("categoryDropdownMenu");
};

function findTask(taskId) {
  return getTasks().find((task) => task.id === taskId);
}

function getOverlayElement() {
  return document.getElementById("overlay");
}

function renderOverlay(markup) {
  const overlay = getOverlayElement();
  if (!overlay) return;
  overlay.innerHTML = markup;
  overlay.classList.remove("hidden");
}

function createAssigneeMarkup(assignee, currentUser) {
  const isYou = assignee.name === currentUser;
  return getAssigneeTemplate(assignee, isYou);
}

async function refreshBoard() {
  const tasks = await loadTasks(window.BOARD_COLUMNS);
  window.syncBoardColumns?.(tasks);
}

function formatDateParts(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function destroyEditController() {
  addTaskFormController?.destroy();
}

function getTaskSourcePath(task) {
  return task.sourcePath || task.status;
}

function getEditControllerConfig() {
  return { onSave: handleEditSave, mode: "edit" };
}

async function handleEditSave(taskId) {
  await refreshBoard();
  closeOverlay();
  openOverlay(taskId);
}

function toggleMenuVisibility(menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.classList.toggle("d_none");
}
