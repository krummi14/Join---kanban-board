

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
import { createAddTaskFormTemplate } from "../template/add_task_template.js";

import { initAddTask } from "../addtask/addTask.js";

// 📊 Board config
// Julian const BOARD_COLUMNS = [
let BOARD_COLUMNS = [
  { path: "to_do", label: "to do", containerId: "to_do" },
  { path: "in_progress", label: "in progress", containerId: "in_progress" },
  { path: "await_feedback", label: "await feedback", containerId: "await_feedback" },
  { path: "done", label: "done", containerId: "done" },
];

let currentTasks = [];
let isFiltering = false;
let filteredColumns = null;

window.BOARD_COLUMNS = BOARD_COLUMNS;

////Julian 🚀 INIT
//async function initBoard() {
//  if (typeof window.userInitials === "function") {
//    window.userInitials();
//  }
//  await loadTasks(BOARD_COLUMNS);
//  updateHTML(BOARD_COLUMNS);
//  initDragDrop(BOARD_COLUMNS);
//// Overlay click close
//  const overlay = document.getElementById("overlay");
//if (overlay) {
//  overlay.addEventListener("click", handleOverlayClick);
//}
//}

async function initBoard() {
  if (typeof window.userInitials === "function") {
    window.userInitials();
  }
  const tasks = await loadTasks(BOARD_COLUMNS);
  BOARD_COLUMNS = buildFilteredColumns(tasks, BOARD_COLUMNS);
  window.BOARD_COLUMNS = BOARD_COLUMNS;
  updateHTML(BOARD_COLUMNS);
  initDragDrop(BOARD_COLUMNS);
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.addEventListener("click", handleOverlayClick);
  }
}

// 🔁 SUBTASK (global bridge)


// 🗑️ DELETE TASK
async function deleteTask(taskId) {
  await deleteTaskService(taskId);

  closeOverlay();
  updateHTML(BOARD_COLUMNS);
}

function openAddNewtaskDialog(path = "to_do") {
  if (event) event.stopPropagation();
  contentDialogOfAddTask.innerHTML = getDialogAddTaskTemplate();
  window.getAddTaskFormTemplate?.(`${path}`);
  initAddTask();
  let contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.showModal();
  contentDialogAddTask.classList.add("dialog_opend");
  contentDialogAddTask.classList.remove("dialog_closed");
}

function closeAddNewTaskDialog() {
  let contentDialogAddTask = document.getElementById("addTask_dialog");
  contentDialogAddTask.classList.remove("dialog_opend");
  contentDialogAddTask.classList.add("dialog_closed");
  setTimeout(function () {
    contentDialogAddTask.close();
  }, 125);
}

function closeDialogOnBodyclick(event) {
  event.stopPropagation()
}

function buildFilteredColumns(tasks, BOARD_COLUMNS) {
  return BOARD_COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.path)
  }));
}

async function filterAndShowTask() {
  const contentSearchInput = document.getElementById("search_input_value");
  if (!contentSearchInput) return;

  let filterWord = contentSearchInput.value;
  let tasks = await loadTasks(BOARD_COLUMNS);
  if (filterWord.length < 3) {
    isFiltering = false;
    filteredColumns = null;
    updateHTML(BOARD_COLUMNS);
    return;
  }
  isFiltering = true;
  currentTasks = tasks.filter(task => task.title.toLowerCase().includes(filterWord.toLowerCase()));
  filteredColumns = buildFilteredColumns(currentTasks, BOARD_COLUMNS);
  updateHTML(filteredColumns);
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