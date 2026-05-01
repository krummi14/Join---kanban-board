

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
  allowDrop,
  moveTo,
  highlight,
  removeHighlight
} from "./board_dragDropController.js";

// 📊 Board config
const BOARD_COLUMNS = [
  { path: "to_do", label: "to do", containerId: "to_do" },
  { path: "in_progress", label: "in progress", containerId: "in_progress" },
  { path: "await_feedback", label: "await feedback", containerId: "await_feedback" },
  { path: "done", label: "done", containerId: "done" },
];
window.BOARD_COLUMNS = BOARD_COLUMNS;
// 🚀 INIT
async function initBoard() {
  if (typeof window.userInitials === "function") {
    window.userInitials();
  }

  await loadTasks(BOARD_COLUMNS);

  updateHTML(BOARD_COLUMNS);

  initDragDrop(BOARD_COLUMNS);

  // Overlay click close
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

// 🌍 GLOBAL EXPORTS (HTML onclick / drag handlers)
window.initBoard = initBoard;

window.startDragging = startDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;
window.highlight = highlight;
window.removeHighlight = removeHighlight;

window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;

window.deleteTask = deleteTask;
window.updateHTML = updateHTML;