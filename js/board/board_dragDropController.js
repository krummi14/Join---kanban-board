import { moveTask } from "./board_taskService.js";
import { updateColumns } from "./board_taskView.js";

let draggedId = null;
let BOARD_COLUMNS_REF = null;
let activeDragPreview = null;
let activeDraggedCard = null;
let dragAnchorX = 0;
let dragAnchorY = 0;
let transparentDragImage = null;
let dragTrackingInitialized = false;
let lastPointerX = null;
let lastPointerY = null;
let dragTilt = 0;
let pendingDropPath = null;
let pendingDropIndex = null;

export function initDragDrop(BOARD_COLUMNS) {
  BOARD_COLUMNS_REF = BOARD_COLUMNS;

  if (!dragTrackingInitialized) {
    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("drop", endDragging);
    dragTrackingInitialized = true;
  }
}

// 🖱️ START DRAG
export function startDragging(ev, id) {
  draggedId = id;

  const taskCard = ev?.currentTarget;
  const dragImage = ev?.dataTransfer;
  if (!taskCard || !dragImage?.setDragImage) return;

  cleanupDragPreview();
  cleanupDraggedCard();

  dragAnchorX = taskCard.offsetWidth / 2;
  dragAnchorY = 0;
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;
  dragTilt = 0;

  activeDragPreview = taskCard.cloneNode(true);
  activeDragPreview.classList.add("task-drag-preview");
  activeDragPreview.style.position = "fixed";
  activeDragPreview.style.top = "0";
  activeDragPreview.style.left = "0";
  activeDragPreview.style.width = `${taskCard.offsetWidth}px`;
  activeDragPreview.style.height = `${taskCard.offsetHeight}px`;
  activeDragPreview.style.opacity = "1";
  activeDragPreview.style.pointerEvents = "none";
  activeDragPreview.style.transform = "none";
  activeDragPreview.style.margin = "0";
  activeDragPreview.style.zIndex = "9999";
  document.body.appendChild(activeDragPreview);

  activeDraggedCard = taskCard;
  activeDraggedCard.classList.add("task-dragging");
  activeDraggedCard.style.setProperty("visibility", "hidden", "important");

  positionDragPreview(ev);

  transparentDragImage ??= createTransparentDragImage();
  dragImage.setDragImage(transparentDragImage, 0, 0);
}

export function endDragging() {
  cleanupDragPreview();
  cleanupDraggedCard();
  lastPointerX = null;
  lastPointerY = null;
  dragTilt = 0;
  resetPendingDropTarget();
  draggedId = null;
}

function cleanupDragPreview() {
  activeDragPreview?.remove();
  activeDragPreview = null;
}

function cleanupDraggedCard() {
  if (!activeDraggedCard) return;

  activeDraggedCard.classList.remove("task-dragging");
  activeDraggedCard.style.removeProperty("visibility");
  activeDraggedCard = null;
}

// 🧱 ALLOW DROP
export function allowDrop(ev) {
  ev.preventDefault();
  positionDragPreview(ev);
  updatePendingDropTarget(ev);
}

// 🔄 DROP / MOVE
export async function moveTo(category) {
  if (!draggedId) return;

  const targetIndex = resolveDropIndex(category);

  removeHighlight(category);
  const optimisticMove = applyOptimisticMove(draggedId, category, targetIndex);

  if (optimisticMove) {
    updateColumns(
      [...new Set([optimisticMove.previousPath, optimisticMove.newPath])],
      BOARD_COLUMNS_REF
    );
  }

  cleanupDragPreview();
  cleanupDraggedCard();

  const result = await moveTask(
    draggedId,
    category,
    BOARD_COLUMNS_REF,
    targetIndex
  );

  if (!result) {
    rollbackOptimisticMove(optimisticMove);

    if (optimisticMove) {
      updateColumns(
        [...new Set([optimisticMove.previousPath, optimisticMove.newPath])],
        BOARD_COLUMNS_REF
      );
    }

    resetPendingDropTarget();
    draggedId = null;
    return;
  }

  updateColumns(
    [...new Set([result.previousPath, result.newPath])],
    BOARD_COLUMNS_REF
  );

  resetPendingDropTarget();
  draggedId = null;
}

function applyOptimisticMove(taskId, nextPath, targetIndex) {
  const previousColumn = BOARD_COLUMNS_REF?.find((column) => Array.isArray(column.tasks) && column.tasks.some((task) => task.id == taskId));
  const nextColumn = BOARD_COLUMNS_REF?.find((column) => column.path === nextPath);

  if (!previousColumn || !nextColumn) {
    return null;
  }

  const previousIndex = previousColumn.tasks.findIndex((task) => task.id == taskId);
  if (previousIndex === -1) return null;

  const [task] = previousColumn.tasks.splice(previousIndex, 1);
  const nextIndex = getNormalizedDropIndex(nextColumn.tasks, targetIndex);
  nextColumn.tasks.splice(nextIndex, 0, task);

  return {
    previousPath: previousColumn.path,
    newPath: nextColumn.path,
    previousIndex,
    nextIndex,
    task,
  };
}

function rollbackOptimisticMove(optimisticMove) {
  if (!optimisticMove) return;

  const previousColumn = BOARD_COLUMNS_REF?.find((column) => column.path === optimisticMove.previousPath);
  const nextColumn = BOARD_COLUMNS_REF?.find((column) => column.path === optimisticMove.newPath);

  if (!previousColumn || !nextColumn) return;

  nextColumn.tasks = nextColumn.tasks.filter((task) => task.id !== optimisticMove.task.id);
  previousColumn.tasks.splice(optimisticMove.previousIndex, 0, optimisticMove.task);
}

function updatePendingDropTarget(ev) {
  const dropZone = ev?.currentTarget;
  const columnId = dropZone?.querySelector(".drag_area")?.id;
  if (!columnId) return;

  pendingDropPath = columnId;
  pendingDropIndex = getDropIndexForColumn(columnId, ev.clientY);
  updateDropIndicator(columnId, pendingDropIndex);
}

function getDropIndexForColumn(columnId, pointerY) {
  const container = document.getElementById(columnId);
  const taskCards = Array.from(
    container?.querySelectorAll(".task:not(.task-dragging)") || []
  );

  if (!taskCards.length) return 0;

  const nextTaskIndex = taskCards.findIndex((taskCard) => {
    const bounds = taskCard.getBoundingClientRect();
    return pointerY < bounds.top + bounds.height / 2;
  });

  return nextTaskIndex === -1 ? taskCards.length : nextTaskIndex;
}

function resolveDropIndex(category) {
  if (pendingDropPath === category && Number.isInteger(pendingDropIndex)) {
    return pendingDropIndex;
  }

  const targetColumn = BOARD_COLUMNS_REF?.find((column) => column.path === category);
  return Array.isArray(targetColumn?.tasks) ? targetColumn.tasks.length : 0;
}

function getNormalizedDropIndex(tasks, targetIndex) {
  if (!Number.isInteger(targetIndex)) {
    return tasks.length;
  }

  return Math.max(0, Math.min(targetIndex, tasks.length));
}

function resetPendingDropTarget() {
  clearDropIndicators();
  pendingDropPath = null;
  pendingDropIndex = null;
}

function updateDropIndicator(columnId, targetIndex) {
  clearDropIndicators();

  const container = document.getElementById(columnId);
  const taskCards = Array.from(
    container?.querySelectorAll(".task:not(.task-dragging)") || []
  );

  if (!taskCards.length) return;

  const previousTask = taskCards[targetIndex - 1] || null;
  const nextTask = taskCards[targetIndex] || null;

  previousTask?.classList.add("task-drop-after");
  nextTask?.classList.add("task-drop-before");
}

function clearDropIndicators() {
  document
    .querySelectorAll(".task-drop-before, .task-drop-after")
    .forEach((taskCard) => {
      taskCard.classList.remove("task-drop-before", "task-drop-after");
    });
}

function positionDragPreview(ev) {
  if (!activeDragPreview || typeof ev?.clientX !== "number" || typeof ev?.clientY !== "number") {
    return;
  }

  const deltaX = lastPointerX === null ? 0 : ev.clientX - lastPointerX;
  const targetTilt = Math.max(-14, Math.min(14, deltaX * 0.7));

  dragTilt += (targetTilt - dragTilt) * 0.42;
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;

  const previewX = Math.round(ev.clientX - dragAnchorX);
  const previewY = Math.round(ev.clientY - dragAnchorY - 10);
  const previewTilt = Math.round(dragTilt * 10) / 10;

  activeDragPreview.style.transform = `translate3d(${previewX}px, ${previewY}px, 0) rotate(${previewTilt}deg) scale(1.06)`;
  activeDragPreview.style.boxShadow = `0 26px 44px rgba(0, 0, 0, 0.24), ${dragTilt * 1.8}px 16px 24px rgba(0, 0, 0, 0.18)`;
}

function handleGlobalDragOver(ev) {
  positionDragPreview(ev);
}

function createTransparentDragImage() {
  const pixel = document.createElement("div");
  pixel.style.width = "1px";
  pixel.style.height = "1px";
  pixel.style.opacity = "0";
  pixel.style.pointerEvents = "none";
  pixel.style.position = "fixed";
  pixel.style.top = "0";
  pixel.style.left = "0";
  document.body.appendChild(pixel);
  return pixel;
}

// ✨ HIGHLIGHT
export function highlight(id) {
  document.getElementById(id)?.classList.add("drag-area-highlight");
}

// ❌ REMOVE HIGHLIGHT
export function removeHighlight(id) {
  document.getElementById(id)?.classList.remove("drag-area-highlight");

  if (pendingDropPath === id) {
    clearDropIndicators();
    pendingDropPath = null;
    pendingDropIndex = null;
  }
}