

// 📦 Task Service (Daten / Firebase)
import {
  loadTasks,
  deleteTask as deleteTaskService,
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
  allowDrop,
  moveTo,
  highlight,
  removeHighlight
} from "./board_dragDropController.js";

import {
  getDialogAddTaskTemplate
} from "../template/board_template.js";

import { initAddTask } from "../addtask/addTask.js";

// 📊 Board config
let BOARD_COLUMNS = [
  { path: "to_do", label: "to do", containerId: "to_do" },
  { path: "in_progress", label: "in progress", containerId: "in_progress" },
  { path: "await_feedback", label: "await feedback", containerId: "await_feedback" },
  { path: "done", label: "done", containerId: "done" },
];

window.BOARD_COLUMNS = BOARD_COLUMNS;

async function initBoard() {
  initializeUserInitials();
  const tasks = await loadTasks(BOARD_COLUMNS);
  syncBoardColumns(tasks);
  bindOverlayClick();
}


// 🗑️ DELETE TASK
async function deleteTask(taskId) {
  await deleteTaskService(taskId);
  closeOverlay();
  syncBoardColumns(await loadTasks(BOARD_COLUMNS));
}

function openAddNewtaskDialog(path = "to_do") {
  stopWindowEvent();
  contentDialogOfAddTask.innerHTML = getDialogAddTaskTemplate();
  window.getAddTaskFormTemplate?.(`${path}`);
  initAddTask();
  const contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.showModal();
  contentDialogAddTask.classList.add("dialog_opend");
  contentDialogAddTask.classList.remove("dialog_closed");
}

function closeAddNewTaskDialog() {
  const contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.classList.remove("dialog_opend");
  contentDialogAddTask.classList.add("dialog_closed");
  window.setTimeout(() => contentDialogAddTask.close(), 125);
}

function closeDialogOnBodyclick(event) {
  event.stopPropagation();
}

async function filterAndShowTask() {
  const filterWord = getFilterWord();
  if (emptyInputField(filterWord)) return;
  let tasks = await loadTasks(BOARD_COLUMNS);
  if (toShortfilterWord(filterWord)) return;
  const filteredTasks = filterTasksByTitle(tasks, filterWord);
  if (wordDoesntExist(filteredTasks)) return;
  boardIsFiltered = true;
  updateHTML(buildFilteredColumns(filteredTasks, BOARD_COLUMNS));
}

function emptyInputField(filterWord) {
  if (!filterWord || filterWord.trim() == "") {
    if (boardIsFiltered) {
      boardIsFiltered = false;
      updateHTML(BOARD_COLUMNS);
      return true;
    } else {
      showSearchInformation();
      return true;
    }
  }
  return false;
}

function toShortfilterWord(filterWord) {
  if (isShortFilter(filterWord)) {
    boardIsFiltered = false;
    showSearchInformation();
    updateHTML(BOARD_COLUMNS);
    return true;
  }
  return false;
}

function wordDoesntExist(filteredTasks, boardIsFiltered) {
  if (filteredTasks.length == 0) {
    boardIsFiltered = false;
    showSearchInformation();
    updateHTML(BOARD_COLUMNS);
    return true;
  }
  return false;
}

function getFilterWord() {
  const searchInput = document.getElementById("search_input_value");
  return searchInput ? searchInput.value : null;
}

function isShortFilter(filterWord) {
  return filterWord.length < 3;
}

function filterTasksByTitle(tasks, filterWord) {
  const normalizedFilter = filterWord.toLowerCase();
  return tasks.filter((task) => task.title.toLowerCase().includes(normalizedFilter));
}

function buildFilteredColumns(tasks, boardColumns) {
  return boardColumns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.path)
  }));
}

function showSearchInformation() {
  openInfoToWriteAtLeastThreeLetters();
  addSearchInformationAsOverlay();
}

function addSearchInformationAsOverlay() {
  contentSearchInformation.classList.add('loading_screen_overlay');
  document.body.classList.add('scroll_lock');
}

function openInfoToWriteAtLeastThreeLetters() {
  contentSearchInformation.classList.remove("task_information_none");
}

function closeSearchInformation() {
  contentSearchInformation.classList.add("task_information_none");
  document.body.classList.remove('scroll_lock');
}

function removeShowButton() {
  contentShowButton.classList.remove('load_button_none');
}

function initializeUserInitials() {
  if (typeof window.userInitials !== "function") return;
  window.userInitials();
}

function syncBoardColumns(tasks) {
  BOARD_COLUMNS = buildFilteredColumns(tasks, BOARD_COLUMNS);
  window.BOARD_COLUMNS = BOARD_COLUMNS;
  updateHTML(BOARD_COLUMNS);
  initDragDrop(BOARD_COLUMNS);
}

window.syncBoardColumns = syncBoardColumns;

function bindOverlayClick() {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  overlay.addEventListener("click", handleOverlayClick);
}

function stopWindowEvent() {
  if (!event) return;
  event.stopPropagation();
}

// 🌍 GLOBAL EXPORTS (HTML onclick / drag handlers)
window.initBoard = initBoard;

window.startDragging = startDragging;
window.endDragging = endDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;
window.highlight = highlight;
window.removeHighlight = removeHighlight;

window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;

window.deleteTask = deleteTask;
window.updateHTML = updateHTML;
window.openAddNewtaskDialog = openAddNewtaskDialog;
window.closeAddNewTaskDialog = closeAddNewTaskDialog;
window.closeDialogOnBodyclick = closeDialogOnBodyclick;
window.filterAndShowTask = filterAndShowTask;
window.closeSearchInformation = closeSearchInformation;