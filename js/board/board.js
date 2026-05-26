// 📦 Task Service (Daten / Firebase)
import {
  getTasks,
  loadTasks,
  deleteTask as deleteTaskService,
  moveTask as moveTaskService,
} from "./board_taskService.js";

// 🎨 View Layer (Rendering)
import {
  updateHTML,
} from "./board_taskView.js";

// 🪟 Overlay / Form
import {
  openOverlay,
  closeOverlay,
  handleOverlayClick
} from "./board_overlayController.js";

// 🖱️ Drag & Drop Controller
import {
  initDragDrop,
  startDragging,
  endDragging,
  handleTaskCardClick,
  moveTo,
} from "./board_dragDropController.js";

import {
  getDialogAddTaskTemplate
} from "../template/board_dialog_template.js";

let addTaskDialogResourcesPromise = null;

// 📊 Board config
let BOARD_COLUMNS = [
  { path: "to_do", label: "to do", containerId: "to_do" },
  { path: "in_progress", label: "in progress", containerId: "in_progress" },
  { path: "await_feedback", label: "await feedback", containerId: "await_feedback" },
  { path: "done", label: "done", containerId: "done" },
];

window.BOARD_COLUMNS = BOARD_COLUMNS;

/**
 * Initializes the board page and loads its tasks.
 * 
 * Loads tasks from the service layer, syncs board columns,
 * and initializes user-related UI elements and overlay behavior.
 */
async function initBoard() {
  initializeUserInitials();
  const tasks = await loadTasks(BOARD_COLUMNS);
  syncBoardColumns(tasks);
  bindOverlayClick();
}

/**
 * Deletes a task and refreshes the board view.
 * 
 * Removes the task from storage, closes the overlay,
 * and updates the board columns.
 * 
 * @param {string} taskId - The ID of the task to delete.
 */
async function deleteTask(taskId) {
  await deleteTaskService(taskId);
  closeOverlay();
  syncBoardColumns(getTasks());
}

/**
 * Moves a task card to an adjacent column.
 * 
 * Handles drag or button-based movement of tasks between columns.
 * 
 * @param {Event} event - The triggering event.
 * @param {string} taskId - The ID of the task.
 * @param {number|string} direction - Movement direction (-1 or +1).
 */
async function moveTaskFromCard(event, taskId, direction) {
  event?.stopPropagation();
  const targetPath = resolveAdjacentColumnPath(taskId, direction);
  if (!targetPath) return;
  const result = await moveTaskService(taskId, targetPath, BOARD_COLUMNS);
  if (!result) return;
  syncBoardColumns(getTasks());
}

/**
 * Resolves the adjacent column path for a task move.
 * 
 * Calculates the next valid board column based on current task status.
 * 
 * @param {string} taskId - The task ID.
 * @param {number|string} direction - Movement direction.
 * @returns {string|null} The target column path or null if invalid.
 */
function resolveAdjacentColumnPath(taskId, direction) {
  const task = getTasks().find((entry) => entry.id === taskId);
  if (!task) return null;
  const currentIndex = BOARD_COLUMNS.findIndex((column) => column.path === task.status);
  if (currentIndex === -1) return null;
  const nextIndex = currentIndex + Number(direction || 0);
  return BOARD_COLUMNS[nextIndex]?.path || null;
}

/**
 * Opens the add-task dialog for the requested board column.
 * 
 * Loads required modules lazily, renders the form,
 * and displays the dialog with animation.
 * 
 * @param {string} path - Target column (default: "to_do").
 */
async function openAddNewtaskDialog(path = "to_do") {
  stopWindowEvent();
  contentDialogOfAddTask.innerHTML = getDialogAddTaskTemplate();
  const [{ initAddTask }, { createAddTaskFormTemplate }] = await loadAddTaskDialogResources();
  renderAddTaskDialog(path, createAddTaskFormTemplate);
  await initAddTask();
  const contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.showModal();
  contentDialogAddTask.classList.add("dialog_opend");
  contentDialogAddTask.classList.remove("dialog_closed");
}

/**
 * Closes the add-task dialog with animation.
 */
function closeAddNewTaskDialog() {
  const contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.classList.remove("dialog_opend");
  contentDialogAddTask.classList.add("dialog_closed");
  window.setTimeout(() => contentDialogAddTask.close(), 125);
}

/**
 * Stops dialog body clicks from bubbling to the overlay.
 * 
 * Prevents accidental dialog closure when interacting inside content.
 * 
 * @param {Event} event - Click event.
 */
function closeDialogOnBodyclick(event) {
  event.stopPropagation();
}

/**
 * Filters tasks by the current search input and updates the board.
 * 
 * Handles empty input, short input, and no-result states,
 * and updates board rendering accordingly.
 */
async function filterAndShowTask() {
  const filterWord = getFilterWord();
  if (emptyInputField(filterWord)) return;
  if (toShortfilterWord(filterWord)) return;
  const tasks = getTasks();
  const filteredTasks = filterTasksByTitle(tasks, filterWord);
  if (wordDoesntExist(filteredTasks)) return; closeSearchInformation();
  boardIsFiltered = true;
  updateHTML(buildFilteredColumns(filteredTasks, BOARD_COLUMNS));
}

/**
 * Handles an empty board search input state.
 * 
 * Resets board view when input is empty.
 * 
 * @param {string} filterWord - Search input value.
 * @returns {boolean} True if handled.
 */
function emptyInputField(filterWord) {
  if (!filterWord || filterWord.trim() == "") {
    closeSearchInformation();
    boardIsFiltered = false;
    updateHTML(BOARD_COLUMNS);
    return true;
  }
  return false;
}

/**
 * Handles search inputs that are too short to filter.
 * 
 * Prevents filtering when input length is below minimum threshold.
 * 
 * @param {string} filterWord - Search input value.
 * @returns {boolean} True if handled.
 */
function toShortfilterWord(filterWord) {
  if (filterWord.length > 0 && filterWord.length < 3) {
    boardIsFiltered = false;
    closeSearchInformation();
    updateHTML(BOARD_COLUMNS);
    return true;
  }
  return false;
}

/**
 * Handles filter results with no matching tasks.
 * 
 * Shows search information overlay when no tasks match the filter.
 * 
 * @param {Array} filteredTasks - Result of filtering.
 * @returns {boolean} True if no results were found.
 */
function wordDoesntExist(filteredTasks, boardIsFiltered) {
  if (filteredTasks.length == 0) {
    boardIsFiltered = false;
    showSearchInformation();
    updateHTML(BOARD_COLUMNS);
    return true;
  }
  return false;
}

/**
 * Returns the current board search term.
 * 
 * @returns {string|null} The search input value.
 */
function getFilterWord() {
  const searchInput = document.getElementById("search_input_value");
  return searchInput ? searchInput.value : null;
}

/** Returns whether a filter term is shorter than the minimum length. */
function isShortFilter(filterWord) {
  return filterWord.length < 3;
}

/**
 * Filters tasks whose title includes the search term.
 * 
 * Case-insensitive matching against task titles.
 * 
 * @param {Array} tasks - List of all tasks.
 * @param {string} filterWord - Search term.
 * @returns {Array} Filtered tasks.
 */

function filterTasksByTitle(tasks, filterWord) {
  const normalizedFilter = filterWord.toLowerCase();
  return tasks.filter((task) => task.title.toLowerCase().includes(normalizedFilter));
}

/**
 * Builds a filtered board-columns structure from tasks.
 * 
 * Groups tasks into their respective board columns.
 * 
 * @param {Array} tasks - Filtered task list.
 * @param {Array} boardColumns - Current board configuration.
 * @returns {Array} Updated board columns.
 */
function buildFilteredColumns(tasks, boardColumns) {
  return boardColumns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.path)
  }));
}

/**
 * Shows the informational overlay for board search feedback.
 */
function showSearchInformation() {
  openInfoToWriteAtLeastThreeLetters();
  addSearchInformationAsOverlay();
}

/** Adds the search information overlay styling. */
function addSearchInformationAsOverlay() {
  contentSearchInformation.classList.add('loading_screen_overlay');
  document.body.classList.add('scroll_lock');
}

/**
 * Reveals the search information message.
 */
function openInfoToWriteAtLeastThreeLetters() {
  contentSearchInformation.classList.remove("task_information_none");
}

/**
 *  Closes the search information overlay. 
 */
function closeSearchInformation() {
  contentSearchInformation.classList.add("task_information_none");
  document.body.classList.remove('scroll_lock');
}

/** Shows the board action button that was previously hidden. */
function removeShowButton() {
  contentShowButton.classList.remove('load_button_none');
}

/**
 * Initializes the user badge when the board page loads.
 * 
 * Calls the global userInitials function if available.
 */
function initializeUserInitials() {
  if (typeof window.userInitials !== "function") return;
  window.userInitials();
}

/**
 * Lazy-loads the resources needed for the add-task dialog.
 * 
 * Loads modules only once and caches the promise.
 * 
 * @returns {Promise<Array>} Imported modules.
 */
function loadAddTaskDialogResources() {
  if (!addTaskDialogResourcesPromise) {
    addTaskDialogResourcesPromise = Promise.all([
      import("../addtask/addTask.js"),
      import("../template/add_task_template.js"),
    ]);
  }

  return addTaskDialogResourcesPromise;
}

/**
 * Renders the add-task form inside the board dialog.
 * 
 * Inserts the generated template into the dialog container.
 * 
 * @param {string} path - Target board column.
 * @param {Function} createAddTaskFormTemplate - Template renderer.
 */
function renderAddTaskDialog(path, createAddTaskFormTemplate) {
  const addTaskContainer = document.getElementById("addTaskContainer");
  if (!addTaskContainer) return;
  addTaskContainer.innerHTML = createAddTaskFormTemplate(path);
}

/**
 * Synchronizes the board columns with the current task list.
 * 
 * Rebuilds board state, updates UI, and reinitializes drag & drop.
 * 
 * @param {Array} tasks - Current task list.
 */
function syncBoardColumns(tasks) {
  BOARD_COLUMNS = buildFilteredColumns(tasks, BOARD_COLUMNS);
  window.BOARD_COLUMNS = BOARD_COLUMNS;
  updateHTML(BOARD_COLUMNS);
  initDragDrop(BOARD_COLUMNS);
}

window.syncBoardColumns = syncBoardColumns;

/**
 * Binds the overlay click handler for outside-close behavior.
 * 
 * Ensures that clicking on the overlay closes open dialogs.
 */
function bindOverlayClick() {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  overlay.addEventListener("click", handleOverlayClick);
}

/** Stops the current global event from bubbling when present. */
function stopWindowEvent() {
  if (!event) return;
  event.stopPropagation();
}

// 🌍 GLOBAL EXPORTS (HTML onclick / drag handlers)
window.initBoard = initBoard;

window.startDragging = startDragging;
window.endDragging = endDragging;
window.handleTaskCardClick = handleTaskCardClick;
window.moveTo = moveTo;

window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;

window.deleteTask = deleteTask;
window.moveTaskFromCard = moveTaskFromCard;
window.updateHTML = updateHTML;
window.openAddNewtaskDialog = openAddNewtaskDialog;
window.closeAddNewTaskDialog = closeAddNewTaskDialog;
window.closeDialogOnBodyclick = closeDialogOnBodyclick;
window.filterAndShowTask = filterAndShowTask;
window.closeSearchInformation = closeSearchInformation;