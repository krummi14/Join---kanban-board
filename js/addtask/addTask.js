import { createAddTaskForm } from "./addTaskForm.js";

let addTaskFormController = null;
let taskAddedFeedbackTimer = null;

const TASK_ADDED_FLY_IN_MS = 400;
const TASK_ADDED_HOLD_MS = 1500;
const TASK_ADDED_TOTAL_MS = TASK_ADDED_FLY_IN_MS + TASK_ADDED_HOLD_MS;

/**
 * Initializes the Add Task form controller.
 * 
 * Sets up the task form, updates the user badge,
 * and initializes the form controller instance.
 * Destroys any previous controller before re-initializing.
 * 
 * @returns {Promise<Object|null>} The created form controller or null if form is missing.
 */
export async function initAddTask() {
  const taskForm = document.getElementById("taskForm");
  if (!taskForm) return null;
  updateUserBadge();
  addTaskFormController?.destroy();
  addTaskFormController = createAddTaskForm(taskForm, getCreateTaskStatus(), {
    onCreate: handleTaskCreated,
  });
  return addTaskFormController;
}

/**
 * Reads the current target status for the new task.
 * 
 * Returns the selected status from the dropdown or defaults to "to_do".
 * 
 * @returns {string} The task status value.
 */
function getCreateTaskStatus() {
  return document.getElementById("createTask")?.value || "to_do";
}

/**
 * Handles actions after a task has been successfully created.
 * 
 * Resets the form, shows success feedback animation,
 * and redirects the user to the board page.
 */
function updateUserBadge() {
  const userName = localStorage.getItem("userName");
  const userBadge = document.getElementById("user");
  if (!userBadge || !userName || userName === "Guest") return;
  if (typeof getInitials !== "function") return;
  userBadge.textContent = getInitials(userName);
}

/**
 * Handles actions after a task has been successfully created.
 * 
 * Resets the form, shows success feedback animation,
 * and redirects the user to the board page.
 */
async function handleTaskCreated() {
  document.getElementById("taskForm")?.reset();
  await showTaskAddedFeedback();
  window.location.href = "./board.html";
}

/**
 * Starts the success feedback animation after task creation.
 * 
 * Displays the feedback element and returns a promise that
 * resolves after the animation has finished.
 * 
 * @returns {Promise<void>}
 */
function showTaskAddedFeedback() {
  const feedback = document.getElementById("taskAddedFeedback");
  if (!feedback) return Promise.resolve();
  restartTaskAddedFeedback(feedback);
  clearTaskAddedFeedbackTimer();
  return waitForTaskAddedFeedbackToFinish(feedback);
}

/**
 * Restarts the success feedback animation.
 * 
 * Forces a reflow to restart CSS animation and applies
 * the visible state class.
 * 
 * @param {HTMLElement} feedback - The feedback element.
 */
function restartTaskAddedFeedback(feedback) {
  feedback.classList.remove("task_added_feedback_visible");
  void feedback.offsetWidth;
  feedback.classList.add("task_added_feedback_visible");
}

/**
 * Clears any active feedback timeout.
 */
function clearTaskAddedFeedbackTimer() {
  if (!taskAddedFeedbackTimer) return;
  window.clearTimeout(taskAddedFeedbackTimer);
}

/**
 * Waits until the task added feedback animation has finished.
 * 
 * Returns a promise that resolves after the total animation duration.
 * 
 * @param {HTMLElement} feedback - The feedback element.
 * @returns {Promise<void>}
 */
function waitForTaskAddedFeedbackToFinish(feedback) {
  return new Promise((resolve) => {
    taskAddedFeedbackTimer = window.setTimeout(() => finishTaskAddedFeedback(feedback, resolve), TASK_ADDED_TOTAL_MS);
  });
}

/**
 * Finalizes the feedback animation and resolves the promise.
 * 
 * Hides the feedback element and signals completion.
 * 
 * @param {HTMLElement} feedback - The feedback element.
 * @param {Function} resolve - Promise resolve function.
 */
function finishTaskAddedFeedback(feedback, resolve) {
  feedback.classList.remove("task_added_feedback_visible");
  resolve();
}

Object.assign(window, { initAddTask });