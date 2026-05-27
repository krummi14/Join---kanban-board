import { createAddTaskForm } from "../addtask/addTaskForm.js";
import { createAddTaskFormTemplate } from "../template/add_task_template.js";
import { createEditTaskTemplate } from "../template/board_edit_template.js";
import { getTasks, moveTask, syncTaskLocally, toggleSubtask } from "./board_taskService.js";
import {
  generateTaskOverlay,
  getAssigneeTemplate,
  getNoAssigneesTemplate,
  getNoSubtasksTemplate,
  generateSubtask,
} from "../template/board_overlay_template.js";
import { initializeDueDatePicker } from "../addtask/dueDate.js";


let addTaskFormController = null;

/**
 * Opens the task overlay for the selected task.
 * 
 * Resolves the task from the current board cache and renders
 * its detail markup into the overlay.
 * 
 * @param {string} taskId - Id of the task to display.
 */
export function openOverlay(taskId) {
  const task = findTask(taskId);
  if (!task) return;
  renderOverlay(generateTaskOverlay(task));
}

/**
 * Closes the task overlay.
 * 
 * Hides the overlay root without destroying its current content.
 */
export function closeOverlay() {
  getOverlayElement()?.classList.add("hidden");
}

/**
 * Closes the overlay when its backdrop is clicked.
 * 
 * @param {MouseEvent} event - Click event from the overlay root.
 */
export function handleOverlayClick(event) {
  if (event.target.id !== "overlay") return;
  closeOverlay();
}

/**
 * Returns the current user name stored in local storage.
 * 
 * @returns {string} Stored user name or an empty string.
 */
function getCurrentUserName() {
  return localStorage.getItem("userName") || "";
}

/**
 * Returns the assignee section markup for a task overlay.
 * 
 * Marks the current user in the list and falls back to the empty state
 * when the task has no assignees.
 * 
 * @param {Object} task - Task displayed in the overlay.
 * @returns {string} Assignee section markup.
 */
function generateAssigneesContent(task) {
  const currentUser = getCurrentUserName();
  if (!task.assignees?.length) return getNoAssigneesTemplate();
  return task.assignees.map((assignee) => createAssigneeMarkup(assignee, currentUser)).join("");
}

/**
 * Returns the subtask section markup for a task overlay.
 * 
 * @param {Object} task - Task displayed in the overlay.
 * @returns {string} Subtask section markup.
 */
function generateSubtasksContent(task) {
  if (!task.subtasks?.length) return getNoSubtasksTemplate();
  return task.subtasks.map((subtask, index) => generateSubtask(task, subtask, index)).join("");
}

window.toggleSubtask = async function (taskId, index) {
  await toggleSubtask(taskId, index);
  refreshBoard();
};

/**
 * Formats a stored due date for display in the overlay.
 * 
 * Accepts both already formatted strings and ISO-like date values.
 * 
 * @param {string} dateString - Stored task due date.
 * @returns {string} Display-ready date string.
 */
function formatDate(dateString) {
  if (!dateString) return "";
  if (dateString.includes("/")) return dateString;
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return formatDateParts(date);
}

/**
 * Opens the edit form for the selected task.
 * 
 * Replaces the task detail view with the reusable add-task form
 * configured for edit mode.
 * 
 * @param {string} taskId - Id of the task to edit.
 */
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
/** Renders the edit-task form inside the overlay. */
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

/** Initializes the add-task form controller in edit mode. */
function initEditController(form, task) {
  destroyEditController();
  addTaskFormController = createAddTaskForm(form, getTaskSourcePath(task), getEditControllerConfig());
}

/** Applies board-specific UI adjustments for edit mode. */
function setupEditUI() {
  const submitBtn = document.getElementById("createTask");
  const clearBtn = document.querySelector(".clear_btn");
  if (submitBtn) submitBtn.textContent = "Save changes";
  if (clearBtn) clearBtn.style.display = "none";

  // 🔥 FIX
  const menu = document.getElementById("assigneeDropdownMenu");
  menu?.classList.add("d_none");
}

/** Prefills the edit form with the selected task data. */
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
window.moveTaskFromOverlay = moveTaskFromOverlay;
window.createAddTaskFormTemplate = createAddTaskFormTemplate;

window.toggleAssigneeDropdown = function (event) {
  event.stopPropagation();
  toggleMenuVisibility("assigneeDropdownMenu");
};

window.toggleCategoryDropdown = function (event) {
  if (event) event.stopPropagation();
  toggleMenuVisibility("categoryDropdownMenu");
};

/**
 * Finds a task by id in the current task collection.
 * 
 * @param {string} taskId - Id of the requested task.
 * @returns {Object|undefined} Matching task record.
 */
function findTask(taskId) {
  return getTasks().find((task) => task.id === taskId);
}

/**
 * Returns the overlay root element.
 * 
 * @returns {HTMLElement|null} Overlay container element.
 */
function getOverlayElement() {
  return document.getElementById("overlay");
}

/** Renders markup into the overlay and shows it. */
function renderOverlay(markup) {
  const overlay = getOverlayElement();
  if (!overlay) return;
  overlay.innerHTML = markup;
  overlay.classList.remove("hidden");
}

/** Returns the markup for one assignee row inside the overlay. */
function createAssigneeMarkup(assignee, currentUser) {
  const isYou = assignee.name === currentUser;
  return getAssigneeTemplate(assignee, isYou);
}

/**
 * Refreshes the board after overlay-based task changes.
 * 
 * Delegates to the board page's synchronized render helper when present.
 */
function refreshBoard() {
  window.syncBoardColumns?.(getTasks());
}

/** Formats a Date object as a day/month/year string. */
function formatDateParts(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Destroys the active edit controller if one exists. */
function destroyEditController() {
  addTaskFormController?.destroy();
}

/** Returns the storage path that should back the edit form. */
function getTaskSourcePath(task) {
  return task.sourcePath || task.status;
}

/** Moves a task from the overlay into a different board column. */
async function moveTaskFromOverlay(taskId, targetPath) {
  const task = findTask(taskId);
  const boardColumns = window.BOARD_COLUMNS;
  if (!task || task.status === targetPath || !Array.isArray(boardColumns)) return;
  const result = await moveTask(taskId, targetPath, boardColumns);
  if (!result) return;
  refreshBoard();
  closeOverlay();
}

/** Returns the controller configuration used in edit mode. */
function getEditControllerConfig() {
  return { onSave: handleEditSave, mode: "edit" };
}

/** Handles a successful task save from the edit overlay. */
async function handleEditSave(taskId, updatedTask) {
  syncTaskLocally(taskId, updatedTask);
  refreshBoard();
  closeOverlay();
  openOverlay(taskId);
}

/** Toggles the visibility of a simple dropdown menu. */
function toggleMenuVisibility(menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.classList.toggle("d_none");
}
