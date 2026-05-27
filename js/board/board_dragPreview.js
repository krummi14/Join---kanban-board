const TASK_CLICK_SUPPRESSION_MS = 250;
const DRAG_START_DISTANCE = 6;
const TOUCH_LONG_PRESS_MS = 320;
const TOUCH_SCROLL_CANCEL_DISTANCE = 10;

/**
 * Creates the mutable drag state used across board drag interactions.
 * 
 * @returns {Object} Fresh drag state object.
 */
export function createDragState() {
  return {
    draggedId: null,
    boardColumns: null,
    activeDragPreview: null,
    activeDraggedCard: null,
    dragAnchorX: 0,
    dragAnchorY: 0,
    dragTrackingInitialized: false,
    lastPointerX: null,
    lastPointerY: null,
    dragTilt: 0,
    pendingDropPath: null,
    pendingDropIndex: null,
    suppressTaskClickUntil: 0,
    pendingDragStart: null,
    pendingTouchLongPressId: null,
  };
}

/**
 * Starts tracking a pending drag interaction for the current pointer event.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {MouseEvent|TouchEvent} ev - Initial drag-start event.
 * @param {string} id - Dragged task id.
 * @param {Object} point - Pointer coordinates.
 */
export function startPendingDrag(state, ev, id, point) {
  state.pendingDragStart = createPendingDragStart(ev, id, point);
  if (state.pendingDragStart?.inputType !== "touch") return;
  setPendingTouchState(state);
  armTouchLongPress(state);
}

/**
 * Clears any pending drag-start state and touch feedback.
 * 
 * @param {Object} state - Mutable board drag state.
 */
export function clearPendingDragStart(state) {
  clearTouchFeedbackState(state);
  clearPendingTouchLongPress(state);
  state.pendingDragStart = null;
}

/**
 * Promotes the pending drag interaction into an active drag.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Object} point - Pointer coordinates.
 */
export function beginDragging(state, point) {
  if (!state.pendingDragStart?.taskCard) {
    clearPendingDragStart(state);
    return;
  }

  state.draggedId = state.pendingDragStart.id;
  state.suppressTaskClickUntil = Date.now() + TASK_CLICK_SUPPRESSION_MS;
  cleanupDragArtifacts(state);
  syncDragAnchor(state, state.pendingDragStart.taskCard, point);
  createDragPreview(state, state.pendingDragStart.taskCard);
  hideDraggedCard(state, state.pendingDragStart.taskCard);
  positionDragPreview(state, point);
  clearPendingDragStart(state);
}

/**
 * Returns whether the current click should be ignored during drag handling.
 * 
 * @param {Object} state - Mutable board drag state.
 * @returns {boolean} True when click handling should be suppressed.
 */
export function shouldSuppressTaskClick(state) {
  return state.draggedId !== null || state.pendingDragStart !== null || Date.now() < state.suppressTaskClickUntil;
}

/**
 * Clears preview, hidden-card, and motion state after a drag update.
 * 
 * @param {Object} state - Mutable board drag state.
 */
export function cleanupDragArtifacts(state) {
  cleanupDragPreview(state);
  cleanupDraggedCard(state);
  resetDragMotion(state);
}

/** Returns whether the pending gesture has moved far enough to start dragging. */
export function shouldStartDragging(state, point) {
  if (!state.pendingDragStart) return false;
  const deltaX = point.clientX - state.pendingDragStart.startX;
  const deltaY = point.clientY - state.pendingDragStart.startY;
  if (state.pendingDragStart.inputType === "touch" && !state.pendingDragStart.longPressReady) return false;
  return Math.hypot(deltaX, deltaY) >= DRAG_START_DISTANCE;
}

/** Returns whether a pending touch interaction should be canceled as scrolling. */
export function shouldCancelPendingTouchDrag(state, point) {
  if (!state.pendingDragStart || state.pendingDragStart.inputType !== "touch" || state.pendingDragStart.longPressReady) {
    return false;
  }

  const deltaX = point.clientX - state.pendingDragStart.startX;
  const deltaY = point.clientY - state.pendingDragStart.startY;
  return Math.hypot(deltaX, deltaY) >= TOUCH_SCROLL_CANCEL_DISTANCE;
}

/**
 * Positions the floating preview under the current pointer location.
 * 
 * @param {Object} state - Mutable board drag state.
 * @param {Object} ev - Pointer coordinates.
 */
export function positionDragPreview(state, ev) {
  if (!state.activeDragPreview || !hasPointerCoordinates(ev)) return;
  const previewState = getPreviewState(state, ev);
  state.activeDragPreview.style.transform = buildPreviewTransform(previewState);
  state.activeDragPreview.style.boxShadow = buildPreviewShadow(previewState.tilt);
}

/**
 * Extracts normalized pointer coordinates from mouse or touch events.
 * 
 * @param {MouseEvent|TouchEvent} ev - Pointer event.
 * @returns {Object|null} Normalized coordinates or null.
 */
export function getEventPoint(ev) {
  if (typeof ev?.clientX === "number" && typeof ev?.clientY === "number") {
    return { clientX: ev.clientX, clientY: ev.clientY };
  }

  const touch = ev?.touches?.[0] || ev?.changedTouches?.[0];
  if (!touch) return null;
  return { clientX: touch.clientX, clientY: touch.clientY };
}

/**
 * Returns whether the event is allowed to start a drag interaction.
 * 
 * @param {MouseEvent|TouchEvent} ev - Potential drag-start event.
 * @returns {boolean} True when the event can start dragging.
 */
export function isValidDragStartEvent(ev) {
  if (ev?.type === "mousedown") {
    return ev.button === 0;
  }

  return ev?.type === "touchstart";
}

/** Creates the pending drag-start state from an initial pointer event. */
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

/** Arms the long-press timer used to enable touch dragging. */
function armTouchLongPress(state) {
  clearPendingTouchLongPress(state);
  state.pendingTouchLongPressId = window.setTimeout(() => enableTouchDragStart(state), TOUCH_LONG_PRESS_MS);
}

/** Marks the pending touch drag as ready after a long press. */
function enableTouchDragStart(state) {
  if (state.pendingDragStart?.inputType !== "touch") return;
  state.pendingDragStart.longPressReady = true;
  state.suppressTaskClickUntil = Date.now() + TASK_CLICK_SUPPRESSION_MS;
  setTouchDragReadyState(state);
}

/** Clears the pending long-press timer for touch dragging. */
function clearPendingTouchLongPress(state) {
  if (state.pendingTouchLongPressId === null) return;
  window.clearTimeout(state.pendingTouchLongPressId);
  state.pendingTouchLongPressId = null;
}

/** Applies the pressed visual state to a touched task card. */
function setPendingTouchState(state) {
  state.pendingDragStart?.taskCard?.classList.add("task-touch-pressing");
}

/** Applies the ready-to-drag visual state to a touched task card. */
function setTouchDragReadyState(state) {
  state.pendingDragStart?.taskCard?.classList.remove("task-touch-pressing");
  state.pendingDragStart?.taskCard?.classList.add("task-touch-drag-ready");
}

/** Clears all touch feedback classes from the pending task card. */
function clearTouchFeedbackState(state) {
  state.pendingDragStart?.taskCard?.classList.remove("task-touch-pressing", "task-touch-drag-ready");
}

/** Syncs the preview anchor and motion state from the dragged card. */
function syncDragAnchor(state, taskCard, ev) {
  state.dragAnchorX = taskCard.offsetWidth / 2;
  state.dragAnchorY = 0;
  state.lastPointerX = ev.clientX;
  state.lastPointerY = ev.clientY;
  state.dragTilt = 0;
}

/** Creates and appends the floating drag preview element. */
function createDragPreview(state, taskCard) {
  state.activeDragPreview = buildDragPreview(taskCard);
  document.body.appendChild(state.activeDragPreview);
}

/** Builds the DOM clone used as the drag preview. */
function buildDragPreview(taskCard) {
  const preview = taskCard.cloneNode(true);
  preview.classList.add("task-drag-preview");
  Object.assign(preview.style, getDragPreviewStyles(taskCard));
  return preview;
}

/** Returns the inline styles required for the drag preview. */
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

/** Hides the original task card while its preview is being dragged. */
function hideDraggedCard(state, taskCard) {
  state.activeDraggedCard = taskCard;
  state.activeDraggedCard.classList.add("task-dragging");
  state.activeDraggedCard.style.setProperty("visibility", "hidden", "important");
}

/** Removes the active floating drag preview from the DOM. */
function cleanupDragPreview(state) {
  state.activeDragPreview?.remove();
  state.activeDragPreview = null;
}

/** Restores the hidden source task card after dragging ends. */
function cleanupDraggedCard(state) {
  if (!state.activeDraggedCard) return;
  state.activeDraggedCard.classList.remove("task-dragging");
  state.activeDraggedCard.style.removeProperty("visibility");
  state.activeDraggedCard = null;
}

/** Resets the stored motion values for preview positioning and tilt. */
function resetDragMotion(state) {
  state.lastPointerX = null;
  state.lastPointerY = null;
  state.dragTilt = 0;
}

/** Returns whether the current event contains pointer coordinates. */
function hasPointerCoordinates(ev) {
  return typeof ev?.clientX === "number" && typeof ev?.clientY === "number";
}

/** Builds the current preview position and tilt state from the pointer. */
function getPreviewState(state, ev) {
  const tilt = updateDragTilt(state, ev.clientX);
  const x = Math.round(ev.clientX - state.dragAnchorX);
  const y = Math.round(ev.clientY - state.dragAnchorY - 10);
  state.lastPointerX = ev.clientX;
  state.lastPointerY = ev.clientY;
  return { x, y, tilt: Math.round(tilt * 10) / 10 };
}

/** Updates the preview tilt from the latest horizontal pointer delta. */
function updateDragTilt(state, clientX) {
  const deltaX = state.lastPointerX === null ? 0 : clientX - state.lastPointerX;
  const targetTilt = Math.max(-14, Math.min(14, deltaX * 0.7));
  state.dragTilt += (targetTilt - state.dragTilt) * 0.42;
  return state.dragTilt;
}

/** Returns the transform string used for the floating preview. */
function buildPreviewTransform(previewState) {
  return `translate3d(${previewState.x}px, ${previewState.y}px, 0) rotate(${previewState.tilt}deg) scale(1.06)`;
}

/** Returns the box shadow used for the floating preview. */
function buildPreviewShadow(tilt) {
  return `0 26px 44px rgba(0, 0, 0, 0.24), ${tilt * 1.8}px 16px 24px rgba(0, 0, 0, 0.18)`;
}

/** Returns the normalized input type for a pointer event. */
function getEventInputType(ev) {
  if (ev?.type?.startsWith("touch")) return "touch";
  if (ev?.type?.startsWith("mouse")) return "mouse";
  return ev?.type || "unknown";
}
