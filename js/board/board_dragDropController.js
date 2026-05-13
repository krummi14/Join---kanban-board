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
}

// 🔄 DROP / MOVE
export async function moveTo(category) {
  if (!draggedId) return;

  removeHighlight(category);
  const optimisticMove = applyOptimisticMove(draggedId, category);

  if (optimisticMove) {
    updateColumns(
      [optimisticMove.previousPath, optimisticMove.newPath],
      BOARD_COLUMNS_REF
    );
  }

  cleanupDragPreview();
  cleanupDraggedCard();

  const result = await moveTask(
    draggedId,
    category,
    BOARD_COLUMNS_REF
  );

  if (!result) {
    rollbackOptimisticMove(optimisticMove);

    if (optimisticMove) {
      updateColumns(
        [optimisticMove.previousPath, optimisticMove.newPath],
        BOARD_COLUMNS_REF
      );
    }

    draggedId = null;
    return;
  }

  updateColumns(
    [result.previousPath, result.newPath],
    BOARD_COLUMNS_REF
  );

  draggedId = null;
}

function applyOptimisticMove(taskId, nextPath) {
  const previousColumn = BOARD_COLUMNS_REF?.find((column) => Array.isArray(column.tasks) && column.tasks.some((task) => task.id == taskId));
  const nextColumn = BOARD_COLUMNS_REF?.find((column) => column.path === nextPath);

  if (!previousColumn || !nextColumn || previousColumn.path === nextPath) {
    return null;
  }

  const previousIndex = previousColumn.tasks.findIndex((task) => task.id == taskId);
  if (previousIndex === -1) return null;

  const [task] = previousColumn.tasks.splice(previousIndex, 1);
  const nextIndex = nextColumn.tasks.length;
  nextColumn.tasks.push(task);

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

function positionDragPreview(ev) {
  if (!activeDragPreview || typeof ev?.clientX !== "number" || typeof ev?.clientY !== "number") {
    return;
  }

  const deltaX = lastPointerX === null ? 0 : ev.clientX - lastPointerX;
  const targetTilt = Math.max(-14, Math.min(14, deltaX * 0.7));

  dragTilt += (targetTilt - dragTilt) * 0.42;
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;

  activeDragPreview.style.transform = `translate(${ev.clientX - dragAnchorX}px, ${ev.clientY - dragAnchorY - 10}px) rotate(${dragTilt}deg) scale(1.06)`;
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
}