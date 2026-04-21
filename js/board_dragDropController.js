import { moveTask } from "./board_taskService.js";
import { updateColumns } from "./board_taskView.js";

let draggedId = null;
let BOARD_COLUMNS_REF = null;

export function initDragDrop(BOARD_COLUMNS) {
  BOARD_COLUMNS_REF = BOARD_COLUMNS;
}

// 🖱️ START DRAG
export function startDragging(id) {
  draggedId = id;
}

// 🧱 ALLOW DROP
export function allowDrop(ev) {
  ev.preventDefault();
}

// 🔄 DROP / MOVE
export async function moveTo(category) {
  if (!draggedId) return;

  const result = await moveTask(
    draggedId,
    category,
    BOARD_COLUMNS_REF
  );

  if (!result) return;

  updateColumns(
    [result.previousPath, result.newPath],
    BOARD_COLUMNS_REF
  );

  draggedId = null;
}

// ✨ HIGHLIGHT
export function highlight(id) {
  document.getElementById(id)?.classList.add("drag-area-highlight");
}

// ❌ REMOVE HIGHLIGHT
export function removeHighlight(id) {
  document.getElementById(id)?.classList.remove("drag-area-highlight");
}