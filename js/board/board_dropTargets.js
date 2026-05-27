import { updateColumns } from "./board_taskView.js";

/**
 * Updates the pending drop target from the current pointer position.
 * 
 * Resolves the hovered drop zone, computes the insertion index,
 * and updates both highlight and indicator state.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Object} point - Pointer coordinates.
 */
export function updatePendingDropTargetByPoint(state, point) {
  const columnId = getDropZoneId(state, point);
  if (!columnId) return;
  const nextDropIndex = getDropIndexForColumn(columnId, point.clientY);
  syncDropZoneHighlight(state, columnId);
  state.pendingDropPath = columnId;
  state.pendingDropIndex = nextDropIndex;
  updateDropIndicator(columnId, state.pendingDropIndex);
}

/**
 * Clears the pending drop target and all active drag markers.
 * 
 * @param {Object} state - Mutable board drag state.
 */
export function resetPendingDropTarget(state) {
  clearDropIndicators();
  clearDropZoneHighlights();
  state.pendingDropPath = null;
  state.pendingDropIndex = null;
}

/**
 * Resolves the effective drop index for a target board column.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {string} category - Target board column path.
 * @returns {number} Effective insertion index.
 */
export function resolveDropIndex(state, category) {
  if (state.pendingDropPath === category && Number.isInteger(state.pendingDropIndex)) return state.pendingDropIndex;
  return getColumnTaskCount(state, category);
}

/**
 * Applies an optimistic move in the local board data.
 * 
 * Removes the dragged task from its current column and inserts it into
 * the requested target column before the server write completes.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {string} taskId - Id of the dragged task.
 * @param {string} nextPath - Target board column path.
 * @param {number|null} targetIndex - Preferred insertion index.
 * @returns {Object|null} Move descriptor for later rendering or rollback.
 */
export function applyOptimisticMove(state, taskId, nextPath, targetIndex) {
  const previousColumn = findTaskColumn(state, taskId);
  const nextColumn = findColumn(state, nextPath);
  if (!previousColumn || !nextColumn) return null;
  const previousIndex = getTaskIndex(previousColumn, taskId);
  if (previousIndex === -1) return null;
  const [task] = previousColumn.tasks.splice(previousIndex, 1);
  const nextIndex = getNormalizedDropIndex(nextColumn.tasks, targetIndex);
  nextColumn.tasks.splice(nextIndex, 0, task);
  return { previousPath: previousColumn.path, newPath: nextColumn.path, previousIndex, nextIndex, task };
}

/**
 * Rolls back a previously applied optimistic move after persistence fails.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Object|null} optimisticMove - Move descriptor returned earlier.
 */
export function rollbackOptimisticMove(state, optimisticMove) {
  if (!optimisticMove) return;
  const previousColumn = findColumn(state, optimisticMove.previousPath);
  const nextColumn = findColumn(state, optimisticMove.newPath);
  if (!previousColumn || !nextColumn) return;
  nextColumn.tasks = nextColumn.tasks.filter((task) => task.id !== optimisticMove.task.id);
  previousColumn.tasks.splice(optimisticMove.previousIndex, 0, optimisticMove.task);
}

/**
 * Re-renders the columns affected by the provided move data.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Object|null} moveData - Move result or optimistic move descriptor.
 */
export function renderMoveColumns(state, moveData) {
  if (!moveData) return;
  renderColumns(state, getUpdatedPaths(moveData));
}

/**
 * Re-renders a specific set of board column paths.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Array<string>} paths - Column paths to re-render.
 */
export function renderColumns(state, paths) {
  updateColumns(paths, state.boardColumns);
}

/**
 * Returns the unique board column paths affected by a move result.
 * 
 * @param {Object} moveData - Move descriptor containing old and new paths.
 * @returns {Array<string>} Unique affected column paths.
 */
export function getUpdatedPaths(moveData) {
  return [...new Set([moveData.previousPath, moveData.newPath])];
}

/**
 * Clears the active drop-zone highlight styling.
 * 
 * Removes the CSS class used to emphasize the current drop target.
 */
export function clearDropZoneHighlights() {
  document.querySelectorAll(".drag-area-highlight").forEach((dropZone) => {
    dropZone.classList.remove("drag-area-highlight");
  });
}

/** Returns the drop-zone id for a pointer position or drop-zone element. */
function getDropZoneId(state, pointOrDropZone) {
  if (typeof pointOrDropZone?.clientX === "number" && typeof pointOrDropZone?.clientY === "number") {
    const dropZone = getDropZoneFromPoint(pointOrDropZone.clientX, pointOrDropZone.clientY);
    return dropZone?.id || null;
  }

  return pointOrDropZone?.querySelector(".drag_area")?.id || null;
}

/** Returns the insertion index inside a column for the current pointer. */
function getDropIndexForColumn(columnId, pointerY) {
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return 0;
  const nextTaskIndex = taskCards.findIndex((taskCard) => isPointerAboveTaskMidpoint(taskCard, pointerY));
  return nextTaskIndex === -1 ? taskCards.length : nextTaskIndex;
}

/** Returns the visible task cards currently rendered in a board column. */
function getColumnTaskCards(columnId) {
  const container = document.getElementById(columnId);
  return Array.from(container?.querySelectorAll(".task:not(.task-dragging)") || []);
}

/** Returns whether the pointer sits above the midpoint of a task card. */
function isPointerAboveTaskMidpoint(taskCard, pointerY) {
  const bounds = taskCard.getBoundingClientRect();
  return pointerY < bounds.top + bounds.height / 2;
}

/** Returns the current task count for a board column. */
function getColumnTaskCount(state, category) {
  const targetColumn = findColumn(state, category);
  return Array.isArray(targetColumn?.tasks) ? targetColumn.tasks.length : 0;
}

/** Normalizes a requested drop index so it fits the target task array. */
function getNormalizedDropIndex(tasks, targetIndex) {
  if (!Number.isInteger(targetIndex)) return tasks.length;
  return Math.max(0, Math.min(targetIndex, tasks.length));
}

/** Updates the visible insertion markers inside the target column. */
function updateDropIndicator(columnId, targetIndex) {
  clearDropIndicators();
  const taskCards = getColumnTaskCards(columnId);
  if (!taskCards.length) return;
  taskCards[targetIndex - 1]?.classList.add("task-drop-after");
  taskCards[targetIndex]?.classList.add("task-drop-before");
}

/** Removes all task-level insertion marker classes. */
function clearDropIndicators() {
  const markedCards = document.querySelectorAll(".task-drop-before, .task-drop-after");
  markedCards.forEach((taskCard) => taskCard.classList.remove("task-drop-before", "task-drop-after"));
}

/** Finds the board column containing the requested task id. */
function findTaskColumn(state, taskId) {
  return state.boardColumns?.find((column) => hasTask(column, taskId));
}

/** Returns whether the given board column already contains the task. */
function hasTask(column, taskId) {
  return Array.isArray(column.tasks) && column.tasks.some((task) => task.id == taskId);
}

/** Finds a board column by its path identifier. */
function findColumn(state, path) {
  return state.boardColumns?.find((column) => column.path === path);
}

/** Returns the current index of a task inside a board column. */
function getTaskIndex(column, taskId) {
  return column.tasks.findIndex((task) => task.id == taskId);
}

/** Returns the drop-zone element at the given screen coordinates. */
function getDropZoneFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint === "function") {
    return document.elementsFromPoint(clientX, clientY).find((element) => element.classList?.contains("drag_area")) || null;
  }

  return document.elementFromPoint(clientX, clientY)?.closest?.(".drag_area") || null;
}

/** Applies the active highlight to the current drop zone. */
function syncDropZoneHighlight(state, columnId) {
  if (state.pendingDropPath === columnId) return;
  clearDropZoneHighlights();
  document.getElementById(columnId)?.classList.add("drag-area-highlight");
}
