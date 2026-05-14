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

export function initDragDrop(boardColumns) {
  BOARD_COLUMNS_REF = boardColumns;
  if (dragTrackingInitialized) return;
  document.addEventListener("dragover", handleGlobalDragOver);
  document.addEventListener("drop", endDragging);
  dragTrackingInitialized = true;
}

export function startDragging(ev, id) {
  draggedId = id;
  const dragContext = getDragContext(ev);
  if (!dragContext) return;
  resetActiveDragState();
  syncDragAnchor(dragContext.taskCard, ev);
  createDragPreview(dragContext.taskCard);
  hideDraggedCard(dragContext.taskCard);
  positionDragPreview(ev);
  setTransparentDragImage(dragContext.dragImage);
}

export function endDragging() {
  cleanupDragPreview();
  cleanupDraggedCard();
  resetDragMotion();
  resetPendingDropTarget();
  draggedId = null;
}

export function allowDrop(ev) {
  ev.preventDefault();
  positionDragPreview(ev);
  updatePendingDropTarget(ev);
}

export async function moveTo(category) {
  if (!draggedId) return;
  const moveState = prepareMove(category);
  const result = await moveTask(draggedId, category, BOARD_COLUMNS_REF, moveState.targetIndex);
  handleMoveResult(result, moveState);
}

export function highlight(id) {
  document.getElementById(id)?.classList.add("drag-area-highlight");
}

export function removeHighlight(id) {
  document.getElementById(id)?.classList.remove("drag-area-highlight");
  if (pendingDropPath !== id) return;
  resetPendingDropTarget();
}

function getDragContext(ev) {
  const taskCard = ev?.currentTarget;
  const dragImage = ev?.dataTransfer;
  if (!taskCard || !dragImage?.setDragImage) return null;
  return { taskCard, dragImage };
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

function setTransparentDragImage(dragImage) {
  transparentDragImage ??= createTransparentDragImage();
  dragImage.setDragImage(transparentDragImage, 0, 0);
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
  removeHighlight(category);
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

function updatePendingDropTarget(ev) {
  const columnId = getDropZoneId(ev?.currentTarget);
  if (!columnId) return;
  pendingDropPath = columnId;
  pendingDropIndex = getDropIndexForColumn(columnId, ev.clientY);
  updateDropIndicator(columnId, pendingDropIndex);
}

function getDropZoneId(dropZone) {
  return dropZone?.querySelector(".drag_area")?.id || null;
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

function handleGlobalDragOver(ev) {
  positionDragPreview(ev);
}

function createTransparentDragImage() {
  const pixel = document.createElement("div");
  Object.assign(pixel.style, getTransparentPixelStyles());
  document.body.appendChild(pixel);
  return pixel;
}

function getTransparentPixelStyles() {
  return {
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    left: "0",
  };
}