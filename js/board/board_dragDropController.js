import { moveTask } from "./board_taskService.js";
import {
  applyOptimisticMove,
  clearDropZoneHighlights,
  getUpdatedPaths,
  renderColumns,
  renderMoveColumns,
  resetPendingDropTarget,
  resolveDropIndex,
  rollbackOptimisticMove,
  updatePendingDropTargetByPoint,
} from "./board_dropTargets.js";
import {
  beginDragging,
  cleanupDragArtifacts,
  clearPendingDragStart,
  createDragState,
  getEventPoint,
  isValidDragStartEvent,
  positionDragPreview,
  shouldCancelPendingTouchDrag,
  shouldStartDragging,
  shouldSuppressTaskClick,
  startPendingDrag,
} from "./board_dragPreview.js";

const dragState = createDragState();

/**
 * Initializes the global drag-and-drop listeners for the board.
 * 
 * Stores the active board column state and registers the shared
 * pointer listeners exactly once.
 * 
 * @param {Array<Object>} boardColumns - Current board column state.
 */
export function initDragDrop(boardColumns) {
  dragState.boardColumns = boardColumns;
  if (dragState.dragTrackingInitialized) return;
  document.addEventListener("mousemove", handlePointerMove);
  document.addEventListener("mouseup", handlePointerEnd);
  document.addEventListener("touchmove", handlePointerMove, { passive: false });
  document.addEventListener("touchend", handlePointerEnd);
  document.addEventListener("touchcancel", handlePointerCancel);
  dragState.dragTrackingInitialized = true;
}

/**
 * Starts tracking a possible drag gesture for a task card.
 * 
 * @param {MouseEvent|TouchEvent} ev - Initial pointer event.
 * @param {string} id - Id of the touched task.
 */
export function startDragging(ev, id) {
  if (!isValidDragStartEvent(ev)) return;
  const point = getEventPoint(ev);
  if (!point) return;
  startPendingDrag(dragState, ev, id, point);
}

/**
 * Opens the task overlay unless the click should be suppressed.
 * 
 * @param {MouseEvent|TouchEvent} ev - Click event on the task card.
 * @param {string} taskId - Id of the clicked task.
 */
export function handleTaskCardClick(ev, taskId) {
  if (shouldSuppressTaskClick(dragState)) {
    ev?.preventDefault();
    ev?.stopPropagation();
    return;
  }

  window.openOverlay?.(taskId);
}

/**
 * Ends the current drag interaction and resets drag state.
 * 
 * Clears pending drag state, removes drag artifacts,
 * and resets the active drop target bookkeeping.
 */
export function endDragging() {
  clearPendingDragStart(dragState);
  cleanupDragArtifacts(dragState);
  resetPendingDropTarget(dragState);
  dragState.draggedId = null;
}

/**
 * Moves the currently dragged task into the target category.
 * 
 * Applies an optimistic move locally, persists the change,
 * and rolls it back when persistence fails.
 * 
 * @param {string} category - Target board column path.
 */
export async function moveTo(category) {
  if (!dragState.draggedId) return;
  const targetIndex = resolveDropIndex(dragState, category);
  clearDropZoneHighlights();
  const optimisticMove = applyOptimisticMove(dragState, dragState.draggedId, category, targetIndex);
  renderMoveColumns(dragState, optimisticMove);
  cleanupDragArtifacts(dragState);
  const result = await moveTask(dragState.draggedId, category, dragState.boardColumns, targetIndex);

  if (!result) {
    rollbackOptimisticMove(dragState, optimisticMove);
    renderMoveColumns(dragState, optimisticMove);
  } else {
    renderColumns(dragState, getUpdatedPaths(result));
  }

  resetPendingDropTarget(dragState);
  dragState.draggedId = null;
}

/** Handles pointer movement for pending and active drags. */
function handlePointerMove(ev) {
  const point = getEventPoint(ev);
  if (!point) return;

  if (!dragState.draggedId && shouldCancelPendingTouchDrag(dragState, point)) {
    clearPendingDragStart(dragState);
    return;
  }

  if (!dragState.draggedId && dragState.pendingDragStart && shouldStartDragging(dragState, point)) {
    beginDragging(dragState, point);
  }

  if (!dragState.draggedId) return;
  if (ev.cancelable) ev.preventDefault();
  positionDragPreview(dragState, point);
  updatePendingDropTargetByPoint(dragState, point);
}

/** Handles pointer release for pending and active drags. */
function handlePointerEnd(ev) {
  if (dragState.pendingDragStart && !dragState.draggedId) {
    clearPendingDragStart(dragState);
    return;
  }

  if (!dragState.draggedId) return;
  if (ev.cancelable) ev.preventDefault();
  if (!dragState.pendingDropPath) {
    endDragging();
    return;
  }

  void moveTo(dragState.pendingDropPath);
}

/** Cancels the current drag interaction. */
function handlePointerCancel() {
  endDragging();
}
