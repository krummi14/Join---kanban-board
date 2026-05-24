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
const TOUCH_LONG_PRESS_MS = 320;
const TOUCH_SCROLL_CANCEL_DISTANCE = 10;

let pendingTouchLongPressId = null;

/** Initializes the global drag-and-drop listeners for the board. */
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

/** Starts tracking a possible drag gesture for a task card. */
export function startDragging(ev, id) {
  if (!isValidDragStartEvent(ev)) return;
  const point = getEventPoint(ev);
  if (!point) return;
  pendingDragStart = createPendingDragStart(ev, id, point);
  if (pendingDragStart?.inputType === "touch") {
    setPendingTouchState();
    armTouchLongPress();
  }
}

/** Creates the pending drag state from the initial pointer event. */
function createPendingDragStart(ev, id, point) {
  return {
    id,
    taskCard: ev?.currentTarget,
    startX: point.clientX,
    startY: point.clientY,
    inputType: getEventInputType(ev),
    longPressReady: false,
  };
}

/** Arms the long-press timer used for touch dragging. */
function armTouchLongPress() {
  clearPendingTouchLongPress();
  pendingTouchLongPressId = window.setTimeout(enableTouchDragStart, TOUCH_LONG_PRESS_MS);
}

/** Marks a touch interaction as ready to start dragging. */
function enableTouchDragStart() {
  if (pendingDragStart?.inputType !== "touch") return;
  pendingDragStart.longPressReady = true;
  suppressTaskClickUntil = Date.now() + TASK_CLICK_SUPPRESSION_MS;
  setTouchDragReadyState();
}

/** Clears the pending touch long-press timer. */
function clearPendingTouchLongPress() {
  if (pendingTouchLongPressId === null) return;
  window.clearTimeout(pendingTouchLongPressId);
  pendingTouchLongPressId = null;
}

/** Clears all pending drag-start state and touch feedback. */
function clearPendingDragStart() {
  clearTouchFeedbackState();
  clearPendingTouchLongPress();
  pendingDragStart = null;
}

/** Applies the pressed touch state to the task card. */
function setPendingTouchState() {
  pendingDragStart?.taskCard?.classList.add("task-touch-pressing");
}

/** Applies the ready-to-drag touch state to the task card. */
function setTouchDragReadyState() {
  pendingDragStart?.taskCard?.classList.remove("task-touch-pressing");
  pendingDragStart?.taskCard?.classList.add("task-touch-drag-ready");
}

/** Clears all touch-drag feedback classes from the task card. */
function clearTouchFeedbackState() {
  pendingDragStart?.taskCard?.classList.remove("task-touch-pressing", "task-touch-drag-ready");
}

/** Promotes a pending drag into an active drag interaction. */
function beginDragging(point) {
  if (!pendingDragStart?.taskCard) {
    clearPendingDragStart();
    return;
  }

  draggedId = pendingDragStart.id;
  suppressTaskClickUntil = Date.now() + TASK_CLICK_SUPPRESSION_MS;
  resetActiveDragState();
  syncDragAnchor(pendingDragStart.taskCard, point);
  createDragPreview(pendingDragStart.taskCard);
  hideDraggedCard(pendingDragStart.taskCard);
  positionDragPreview(point);
  clearPendingDragStart();
}

/** Opens the task overlay unless the click should be suppressed. */
export function handleTaskCardClick(ev, taskId) {
  if (shouldSuppressTaskClick()) {
    ev?.preventDefault();
    ev?.stopPropagation();
    return;
  }

  window.openOverlay?.(taskId);
}

/** Ends the current drag interaction and resets drag state. */
export function endDragging() {
  clearPendingDragStart();
  cleanupDragPreview();
  cleanupDraggedCard();
  resetDragMotion();
  resetPendingDropTarget();
  draggedId = null;
}

/** Moves the currently dragged task into the target category. */
export async function moveTo(category) {
  if (!draggedId) return;
  const moveState = prepareMove(category);
  const result = await moveTask(draggedId, category, BOARD_COLUMNS_REF, moveState.targetIndex);
  handleMoveResult(result, moveState);
}

/** Returns whether clicks should be ignored during drag state. */
function shouldSuppressTaskClick() {
  return draggedId !== null || pendingDragStart !== null || Date.now() < suppressTaskClickUntil;
}

/** Clears any active drag preview and hidden-card state. */
function resetActiveDragState() {
  cleanupDragPreview();
  cleanupDraggedCard();
}

/** Syncs the drag anchor with the current pointer position. */
function syncDragAnchor(taskCard, ev) {
  dragAnchorX = taskCard.offsetWidth / 2;
  dragAnchorY = 0;
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;
  dragTilt = 0;
}

/** Creates the floating drag preview element. */
function createDragPreview(taskCard) {
  activeDragPreview = buildDragPreview(taskCard);
  document.body.appendChild(activeDragPreview);
}

/** Builds the DOM clone used as the drag preview. */
function buildDragPreview(taskCard) {
  const preview = taskCard.cloneNode(true);
  preview.classList.add("task-drag-preview");
  Object.assign(preview.style, getDragPreviewStyles(taskCard));
  return preview;
}

/** Returns the inline style object for the drag preview. */
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

/** Hides the original task card while dragging. */
function hideDraggedCard(taskCard) {
  activeDraggedCard = taskCard;
  activeDraggedCard.classList.add("task-dragging");
  activeDraggedCard.style.setProperty("visibility", "hidden", "important");
}

/** Removes the active drag preview element. */
function cleanupDragPreview() {
  activeDragPreview?.remove();
  activeDragPreview = null;
}

/** Restores the hidden dragged card to its normal state. */
function cleanupDraggedCard() {
  if (!activeDraggedCard) return;
  activeDraggedCard.classList.remove("task-dragging");
  activeDraggedCard.style.removeProperty("visibility");
  activeDraggedCard = null;
}

/** Resets the stored drag motion values. */
function resetDragMotion() {
  lastPointerX = null;
  lastPointerY = null;
  dragTilt = 0;
}

/** Prepares optimistic UI updates before persisting a move. */
function prepareMove(category) {
  const targetIndex = resolveDropIndex(category);
  clearDropZoneHighlights();
  const optimisticMove = applyOptimisticMove(draggedId, category, targetIndex);
  renderMoveColumns(optimisticMove);
  cleanupDragPreview();
  cleanupDraggedCard();
  return { optimisticMove, targetIndex };
}

/** Handles the result of a persisted drag-and-drop move. */
function handleMoveResult(result, moveState) {
  if (!result) return handleFailedMove(moveState.optimisticMove);
  renderColumns(getUpdatedPaths(result));
  finalizeMove();
}

/** Rolls back the optimistic move after a persistence failure. */
function handleFailedMove(optimisticMove) {
  rollbackOptimisticMove(optimisticMove);
  renderMoveColumns(optimisticMove);
  finalizeMove();
}

/** Re-renders the columns touched by an optimistic move. */
function renderMoveColumns(moveData) {
  if (!moveData) return;
  renderColumns(getUpdatedPaths(moveData));
}

/** Updates the rendered columns for a set of board paths. */
function renderColumns(paths) {
  updateColumns(paths, BOARD_COLUMNS_REF);
}

/** Returns the unique column paths affected by a move. */
function getUpdatedPaths(moveData) {
  return [...new Set([moveData.previousPath, moveData.newPath])];
}

/** Finalizes a completed move and clears pending drop state. */
function finalizeMove() {
  resetPendingDropTarget();
  draggedId = null;
}

/** Applies the optimistic task move within the local columns. */
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

/** Restores task positions after an optimistic move fails. */
function rollbackOptimisticMove(optimisticMove) {
  if (!optimisticMove) return;
  const previousColumn = findColumn(optimisticMove.previousPath);
  const nextColumn = findColumn(optimisticMove.newPath);
  if (!previousColumn || !nextColumn) return;
  nextColumn.tasks = nextColumn.tasks.filter((task) => task.id !== optimisticMove.task.id);
  previousColumn.tasks.splice(optimisticMove.previousIndex, 0, optimisticMove.task);
}

/** Finds the board column that contains the given task. */
function findTaskColumn(taskId) {
  return BOARD_COLUMNS_REF?.find((column) => hasTask(column, taskId));
}

/** Returns whether a column currently contains the given task. */
function hasTask(column, taskId) {
  return Array.isArray(column.tasks) && column.tasks.some((task) => task.id == taskId);
}

/** Finds a board column by its path. */
function findColumn(path) {
  return BOARD_COLUMNS_REF?.find((column) => column.path === path);
}

/** Returns the index of a task inside a board column. */
function getTaskIndex(column, taskId) {
  return column.tasks.findIndex((task) => task.id == taskId);
}

/** Updates the pending drop target from the current pointer position. */
function updatePendingDropTargetByPoint(point) {
  const columnId = getDropZoneId(point);
  if (!columnId) return;
  const nextDropIndex = getDropIndexForColumn(columnId, point.clientY);
  syncDropZoneHighlight(columnId);
  pendingDropPath = columnId;
  pendingDropIndex = nextDropIndex;
  updateDropIndicator(columnId, pendingDropIndex);
}

/** Returns the drop-zone id for a pointer position or element. */
function getDropZoneId(pointOrDropZone) {
  if (typeof pointOrDropZone?.clientX === "number" && typeof pointOrDropZone?.clientY === "number") {
    const dropZone = getDropZoneFromPoint(pointOrDropZone.clientX, pointOrDropZone.clientY);
    return dropZone?.id || null;
  }

  return pointOrDropZone?.querySelector(".drag_area")?.id || null;
}

/** Returns the insertion index for a column at the pointer position. */
function getDropIndexForColumn(columnId, pointerY) {
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return 0;
  const nextTaskIndex = taskCards.findIndex((taskCard) => isPointerAboveTaskMidpoint(taskCard, pointerY));
  return nextTaskIndex === -1 ? taskCards.length : nextTaskIndex;
}

/** Returns the visible task cards inside a column. */
function getColumnTaskCards(columnId) {
  const container = document.getElementById(columnId);
  return Array.from(container?.querySelectorAll(".task:not(.task-dragging)") || []);
}

/** Returns whether the pointer is above the midpoint of a task card. */
function isPointerAboveTaskMidpoint(taskCard, pointerY) {
  const bounds = taskCard.getBoundingClientRect();
  return pointerY < bounds.top + bounds.height / 2;
}

/** Resolves the drop index for the target category. */
function resolveDropIndex(category) {
  if (pendingDropPath === category && Number.isInteger(pendingDropIndex)) return pendingDropIndex;
  return getColumnTaskCount(category);
}

/** Returns the current task count for a board column. */
function getColumnTaskCount(category) {
  const targetColumn = findColumn(category);
  return Array.isArray(targetColumn?.tasks) ? targetColumn.tasks.length : 0;
}

/** Normalizes a target drop index for a task array. */
function getNormalizedDropIndex(tasks, targetIndex) {
  if (!Number.isInteger(targetIndex)) return tasks.length;
  return Math.max(0, Math.min(targetIndex, tasks.length));
}

/** Clears the pending drop target and all drag highlights. */
function resetPendingDropTarget() {
  clearDropIndicators();
  clearDropZoneHighlights();
  pendingDropPath = null;
  pendingDropIndex = null;
}

/** Updates the visible drop indicator within a column. */
function updateDropIndicator(columnId, targetIndex) {
  clearDropIndicators();
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return;
  taskCards[targetIndex - 1]?.classList.add("task-drop-after");
  taskCards[targetIndex]?.classList.add("task-drop-before");
}

/** Removes all task drop indicator classes. */
function clearDropIndicators() {
  const markedCards = document.querySelectorAll(".task-drop-before, .task-drop-after");
  markedCards.forEach((taskCard) => taskCard.classList.remove("task-drop-before", "task-drop-after"));
}

/** Positions the drag preview under the current pointer. */
function positionDragPreview(ev) {
  if (!activeDragPreview || !hasPointerCoordinates(ev)) return;
  const previewState = getPreviewState(ev);
  activeDragPreview.style.transform = buildPreviewTransform(previewState);
  activeDragPreview.style.boxShadow = buildPreviewShadow(previewState.tilt);
}

/** Returns whether the event includes pointer coordinates. */
function hasPointerCoordinates(ev) {
  return typeof ev?.clientX === "number" && typeof ev?.clientY === "number";
}

/** Builds the current preview position and tilt state. */
function getPreviewState(ev) {
  const tilt = updateDragTilt(ev.clientX);
  const x = Math.round(ev.clientX - dragAnchorX);
  const y = Math.round(ev.clientY - dragAnchorY - 10);
  lastPointerX = ev.clientX;
  lastPointerY = ev.clientY;
  return { x, y, tilt: Math.round(tilt * 10) / 10 };
}

/** Updates the drag tilt based on horizontal pointer movement. */
function updateDragTilt(clientX) {
  const deltaX = lastPointerX === null ? 0 : clientX - lastPointerX;
  const targetTilt = Math.max(-14, Math.min(14, deltaX * 0.7));
  dragTilt += (targetTilt - dragTilt) * 0.42;
  return dragTilt;
}

/** Returns the CSS transform used for the drag preview. */
function buildPreviewTransform(previewState) {
  return `translate3d(${previewState.x}px, ${previewState.y}px, 0) rotate(${previewState.tilt}deg) scale(1.06)`;
}

/** Returns the box-shadow used for the drag preview. */
function buildPreviewShadow(tilt) {
  return `0 26px 44px rgba(0, 0, 0, 0.24), ${tilt * 1.8}px 16px 24px rgba(0, 0, 0, 0.18)`;
}

/** Handles pointer movement for pending and active drags. */
function handlePointerMove(ev) {
  const point = getEventPoint(ev);
  if (!point) return;

  if (!draggedId && shouldCancelPendingTouchDrag(point)) {
    clearPendingDragStart();
    return;
  }

  if (!draggedId && pendingDragStart && shouldStartDragging(point)) {
    beginDragging(point);
  }

  if (!draggedId) return;
  if (ev.cancelable) ev.preventDefault();
  positionDragPreview(point);
  updatePendingDropTargetByPoint(point);
}

/** Handles pointer release for pending and active drags. */
function handlePointerEnd(ev) {
  if (pendingDragStart && !draggedId) {
    clearPendingDragStart();
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

/** Cancels the active drag interaction. */
function handlePointerCancel() {
  endDragging();
}

/** Returns whether the pending interaction should start dragging. */
function shouldStartDragging(point) {
  if (!pendingDragStart) return false;
  const deltaX = point.clientX - pendingDragStart.startX;
  const deltaY = point.clientY - pendingDragStart.startY;
  if (pendingDragStart.inputType === "touch" && !pendingDragStart.longPressReady) return false;
  return Math.hypot(deltaX, deltaY) >= DRAG_START_DISTANCE;
}

/** Returns whether a pending touch drag should be canceled as scrolling. */
function shouldCancelPendingTouchDrag(point) {
  if (!pendingDragStart || pendingDragStart.inputType !== "touch" || pendingDragStart.longPressReady) {
    return false;
  }

  const deltaX = point.clientX - pendingDragStart.startX;
  const deltaY = point.clientY - pendingDragStart.startY;
  return Math.hypot(deltaX, deltaY) >= TOUCH_SCROLL_CANCEL_DISTANCE;
}

/** Extracts normalized pointer coordinates from mouse or touch events. */
function getEventPoint(ev) {
  if (typeof ev?.clientX === "number" && typeof ev?.clientY === "number") {
    return { clientX: ev.clientX, clientY: ev.clientY };
  }

  const touch = ev?.touches?.[0] || ev?.changedTouches?.[0];
  if (!touch) return null;
  return { clientX: touch.clientX, clientY: touch.clientY };
}

/** Returns the input type for a pointer event. */
function getEventInputType(ev) {
  if (ev?.type?.startsWith("touch")) return "touch";
  if (ev?.type?.startsWith("mouse")) return "mouse";
  return ev?.type || "unknown";
}

/** Returns whether an event is allowed to start dragging. */
function isValidDragStartEvent(ev) {
  if (ev?.type === "mousedown") {
    return ev.button === 0;
  }

  return ev?.type === "touchstart";
}

/** Returns the drop zone element at the given screen coordinates. */
function getDropZoneFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint === "function") {
    return document.elementsFromPoint(clientX, clientY).find((element) => element.classList?.contains("drag_area")) || null;
  }

  return document.elementFromPoint(clientX, clientY)?.closest?.(".drag_area") || null;
}

/** Applies the active highlight to the current drop zone. */
function syncDropZoneHighlight(columnId) {
  if (pendingDropPath === columnId) return;
  clearDropZoneHighlights();
  document.getElementById(columnId)?.classList.add("drag-area-highlight");
}

/** Clears all active drop-zone highlights. */
function clearDropZoneHighlights() {
  document.querySelectorAll(".drag-area-highlight").forEach((dropZone) => {
    dropZone.classList.remove("drag-area-highlight");
  });
}
