import { moveTask } from "./board_taskService.js";
import { updateColumns } from "./board_taskView.js";

let draggedId = null;
let BOARD_COLUMNS_REF = null;
let activeDragPreview = null;
let activeDraggedCard = null;
let dragAnchorX = 0;
let dragAnchorY = 0;
let dragTrackingInitialized = false;
let lastPointerX = null;
let lastPointerY = null;
let dragTilt = 0;
let pendingDropPath = null;
let pendingDropIndex = null;
let suppressTaskClickUntil = 0;
let pendingDragStart = null;

const TASK_CLICK_SUPPRESSION_MS = 250;
const DRAG_START_DISTANCE = 6;

export function initDragDrop(boardColumns) {
  BOARD_COLUMNS_REF = boardColumns;
  if (dragTrackingInitialized) return;
  document.addEventListener("mousemove", handlePointerMove);
  document.addEventListener("mouseup", handlePointerEnd);
  document.addEventListener("touchmove", handlePointerMove, { passive: false });
  document.addEventListener("touchend", handlePointerEnd);
  document.addEventListener("touchcancel", handlePointerCancel);
  dragTrackingInitialized = true;
}

export function startDragging(ev, id) {
  if (!isValidDragStartEvent(ev)) return;
  const point = getEventPoint(ev);
  if (!point) return;
  pendingDragStart = {
    id,
    taskCard: ev?.currentTarget,
    startX: point.clientX,
    startY: point.clientY,
  };
}

function beginDragging(point) {
  if (!pendingDragStart?.taskCard) {
    pendingDragStart = null;
    return;
  }

  draggedId = pendingDragStart.id;
  suppressTaskClickUntil = Date.now() + TASK_CLICK_SUPPRESSION_MS;
  resetActiveDragState();
  syncDragAnchor(pendingDragStart.taskCard, point);
  createDragPreview(pendingDragStart.taskCard);
  hideDraggedCard(pendingDragStart.taskCard);
  positionDragPreview(point);
  pendingDragStart = null;
}

export function handleTaskCardClick(ev, taskId) {
  if (shouldSuppressTaskClick()) {
    ev?.preventDefault();
    ev?.stopPropagation();
    return;
  }

  window.openOverlay?.(taskId);
}

export function endDragging() {
  pendingDragStart = null;
  cleanupDragPreview();
  cleanupDraggedCard();
  resetDragMotion();
  resetPendingDropTarget();
  draggedId = null;
}

export async function moveTo(category) {
  if (!draggedId) return;
  const moveState = prepareMove(category);
  const result = await moveTask(draggedId, category, BOARD_COLUMNS_REF, moveState.targetIndex);
  handleMoveResult(result, moveState);
}

function shouldSuppressTaskClick() {
  return draggedId !== null || pendingDragStart !== null || Date.now() < suppressTaskClickUntil;
}

function resetActiveDragState() {
  cleanupDragPreview();
  cleanupDraggedCard();
}

function syncDragAnchor(taskCard, ev) {
  dragAnchorX = taskCard.offsetWidth / 2;
  dragAnchorY = 0;
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;
  dragTilt = 0;
}

function createDragPreview(taskCard) {
  activeDragPreview = buildDragPreview(taskCard);
  document.body.appendChild(activeDragPreview);
}

function buildDragPreview(taskCard) {
  const preview = taskCard.cloneNode(true);
  preview.classList.add("task-drag-preview");
  Object.assign(preview.style, getDragPreviewStyles(taskCard));
  return preview;
}

function getDragPreviewStyles(taskCard) {
  return {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${taskCard.offsetWidth}px`,
    height: `${taskCard.offsetHeight}px`,
    opacity: "1",
    pointerEvents: "none",
    transform: "none",
    margin: "0",
    zIndex: "9999",
  };
}

function hideDraggedCard(taskCard) {
  activeDraggedCard = taskCard;
  activeDraggedCard.classList.add("task-dragging");
  activeDraggedCard.style.setProperty("visibility", "hidden", "important");
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

function resetDragMotion() {
  lastPointerX = null;
  lastPointerY = null;
  dragTilt = 0;
}

function prepareMove(category) {
  const targetIndex = resolveDropIndex(category);
  clearDropZoneHighlights();
  const optimisticMove = applyOptimisticMove(draggedId, category, targetIndex);
  renderMoveColumns(optimisticMove);
  cleanupDragPreview();
  cleanupDraggedCard();
  return { optimisticMove, targetIndex };
}

function handleMoveResult(result, moveState) {
  if (!result) return handleFailedMove(moveState.optimisticMove);
  renderColumns(getUpdatedPaths(result));
  finalizeMove();
}

function handleFailedMove(optimisticMove) {
  rollbackOptimisticMove(optimisticMove);
  renderMoveColumns(optimisticMove);
  finalizeMove();
}

function renderMoveColumns(moveData) {
  if (!moveData) return;
  renderColumns(getUpdatedPaths(moveData));
}

function renderColumns(paths) {
  updateColumns(paths, BOARD_COLUMNS_REF);
}

function getUpdatedPaths(moveData) {
  return [...new Set([moveData.previousPath, moveData.newPath])];
}

function finalizeMove() {
  resetPendingDropTarget();
  draggedId = null;
}

function applyOptimisticMove(taskId, nextPath, targetIndex) {
  const previousColumn = findTaskColumn(taskId);
  const nextColumn = findColumn(nextPath);
  if (!previousColumn || !nextColumn) return null;
  const previousIndex = getTaskIndex(previousColumn, taskId);
  if (previousIndex === -1) return null;
  const [task] = previousColumn.tasks.splice(previousIndex, 1);
  const nextIndex = getNormalizedDropIndex(nextColumn.tasks, targetIndex);
  nextColumn.tasks.splice(nextIndex, 0, task);
  return { previousPath: previousColumn.path, newPath: nextColumn.path, previousIndex, nextIndex, task };
}

function rollbackOptimisticMove(optimisticMove) {
  if (!optimisticMove) return;
  const previousColumn = findColumn(optimisticMove.previousPath);
  const nextColumn = findColumn(optimisticMove.newPath);
  if (!previousColumn || !nextColumn) return;
  nextColumn.tasks = nextColumn.tasks.filter((task) => task.id !== optimisticMove.task.id);
  previousColumn.tasks.splice(optimisticMove.previousIndex, 0, optimisticMove.task);
}

function findTaskColumn(taskId) {
  return BOARD_COLUMNS_REF?.find((column) => hasTask(column, taskId));
}

function hasTask(column, taskId) {
  return Array.isArray(column.tasks) && column.tasks.some((task) => task.id == taskId);
}

function findColumn(path) {
  return BOARD_COLUMNS_REF?.find((column) => column.path === path);
}

function getTaskIndex(column, taskId) {
  return column.tasks.findIndex((task) => task.id == taskId);
}

function updatePendingDropTargetByPoint(point) {
  const columnId = getDropZoneId(point);
  if (!columnId) return;
  const nextDropIndex = getDropIndexForColumn(columnId, point.clientY);
  syncDropZoneHighlight(columnId);
  pendingDropPath = columnId;
  pendingDropIndex = nextDropIndex;
  updateDropIndicator(columnId, pendingDropIndex);
}

function getDropZoneId(pointOrDropZone) {
  if (typeof pointOrDropZone?.clientX === "number" && typeof pointOrDropZone?.clientY === "number") {
    const dropZone = getDropZoneFromPoint(pointOrDropZone.clientX, pointOrDropZone.clientY);
    return dropZone?.id || null;
  }

  return pointOrDropZone?.querySelector(".drag_area")?.id || null;
}

function getDropIndexForColumn(columnId, pointerY) {
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return 0;
  const nextTaskIndex = taskCards.findIndex((taskCard) => isPointerAboveTaskMidpoint(taskCard, pointerY));
  return nextTaskIndex === -1 ? taskCards.length : nextTaskIndex;
}

function getColumnTaskCards(columnId) {
  const container = document.getElementById(columnId);
  return Array.from(container?.querySelectorAll(".task:not(.task-dragging)") || []);
}

function isPointerAboveTaskMidpoint(taskCard, pointerY) {
  const bounds = taskCard.getBoundingClientRect();
  return pointerY < bounds.top + bounds.height / 2;
}

function resolveDropIndex(category) {
  if (pendingDropPath === category && Number.isInteger(pendingDropIndex)) return pendingDropIndex;
  return getColumnTaskCount(category);
}

function getColumnTaskCount(category) {
  const targetColumn = findColumn(category);
  return Array.isArray(targetColumn?.tasks) ? targetColumn.tasks.length : 0;
}

function getNormalizedDropIndex(tasks, targetIndex) {
  if (!Number.isInteger(targetIndex)) return tasks.length;
  return Math.max(0, Math.min(targetIndex, tasks.length));
}

function resetPendingDropTarget() {
  clearDropIndicators();
  clearDropZoneHighlights();
  pendingDropPath = null;
  pendingDropIndex = null;
}

function updateDropIndicator(columnId, targetIndex) {
  clearDropIndicators();
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return;
  taskCards[targetIndex - 1]?.classList.add("task-drop-after");
  taskCards[targetIndex]?.classList.add("task-drop-before");
}

function clearDropIndicators() {
  const markedCards = document.querySelectorAll(".task-drop-before, .task-drop-after");
  markedCards.forEach((taskCard) => taskCard.classList.remove("task-drop-before", "task-drop-after"));
}

function positionDragPreview(ev) {
  if (!activeDragPreview || !hasPointerCoordinates(ev)) return;
  const previewState = getPreviewState(ev);
  activeDragPreview.style.transform = buildPreviewTransform(previewState);
  activeDragPreview.style.boxShadow = buildPreviewShadow(previewState.tilt);
}

function hasPointerCoordinates(ev) {
  return typeof ev?.clientX === "number" && typeof ev?.clientY === "number";
}

function getPreviewState(ev) {
  const tilt = updateDragTilt(ev.clientX);
  const x = Math.round(ev.clientX - dragAnchorX);
  const y = Math.round(ev.clientY - dragAnchorY - 10);
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;
  return { x, y, tilt: Math.round(tilt * 10) / 10 };
}

function updateDragTilt(clientX) {
  const deltaX = lastPointerX === null ? 0 : clientX - lastPointerX;
  const targetTilt = Math.max(-14, Math.min(14, deltaX * 0.7));
  dragTilt += (targetTilt - dragTilt) * 0.42;
  return dragTilt;
}

function buildPreviewTransform(previewState) {
  return `translate3d(${previewState.x}px, ${previewState.y}px, 0) rotate(${previewState.tilt}deg) scale(1.06)`;
}

function buildPreviewShadow(tilt) {
  return `0 26px 44px rgba(0, 0, 0, 0.24), ${tilt * 1.8}px 16px 24px rgba(0, 0, 0, 0.18)`;
}

function handlePointerMove(ev) {
  const point = getEventPoint(ev);
  if (!point) return;

  if (!draggedId && pendingDragStart && shouldStartDragging(point)) {
    beginDragging(point);
  }

  if (!draggedId) return;
  if (ev.cancelable) ev.preventDefault();
  positionDragPreview(point);
  updatePendingDropTargetByPoint(point);
}

function handlePointerEnd(ev) {
  if (pendingDragStart && !draggedId) {
    pendingDragStart = null;
    return;
  }

  if (!draggedId) return;
  if (ev.cancelable) ev.preventDefault();
  if (!pendingDropPath) {
    endDragging();
    return;
  }

  void moveTo(pendingDropPath);
}

function handlePointerCancel() {
  endDragging();
}

function shouldStartDragging(point) {
  if (!pendingDragStart) return false;
  const deltaX = point.clientX - pendingDragStart.startX;
  const deltaY = point.clientY - pendingDragStart.startY;
  return Math.hypot(deltaX, deltaY) >= DRAG_START_DISTANCE;
}

function getEventPoint(ev) {
  if (typeof ev?.clientX === "number" && typeof ev?.clientY === "number") {
    return { clientX: ev.clientX, clientY: ev.clientY };
  }

  const touch = ev?.touches?.[0] || ev?.changedTouches?.[0];
  if (!touch) return null;
  return { clientX: touch.clientX, clientY: touch.clientY };
}

function getEventInputType(ev) {
  if (ev?.type?.startsWith("touch")) return "touch";
  if (ev?.type?.startsWith("mouse")) return "mouse";
  return ev?.type || "unknown";
}

function isValidDragStartEvent(ev) {
  if (ev?.type === "mousedown") {
    return ev.button === 0;
  }

  return ev?.type === "touchstart";
}

function getDropZoneFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint === "function") {
    return document.elementsFromPoint(clientX, clientY).find((element) => element.classList?.contains("drag_area")) || null;
  }

  return document.elementFromPoint(clientX, clientY)?.closest?.(".drag_area") || null;
}

function syncDropZoneHighlight(columnId) {
  if (pendingDropPath === columnId) return;
  clearDropZoneHighlights();
  document.getElementById(columnId)?.classList.add("drag-area-highlight");
}

function clearDropZoneHighlights() {
  document.querySelectorAll(".drag-area-highlight").forEach((dropZone) => {
    dropZone.classList.remove("drag-area-highlight");
  });
}
