import { createAddTaskForm } from "./addTaskForm.js";

let addTaskFormController = null;
let taskAddedFeedbackTimer = null;

const TASK_ADDED_FLY_IN_MS = 400;
const TASK_ADDED_HOLD_MS = 1500;
const TASK_ADDED_TOTAL_MS = TASK_ADDED_FLY_IN_MS + TASK_ADDED_HOLD_MS;

/** Initializes the Add Task form controller. */
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

/** Reads the current target status for the new task. */
function getCreateTaskStatus() {
  return document.getElementById("createTask")?.value || "to_do";
}

/** Updates the user badge with the current user's initials. */
function updateUserBadge() {
  const userName = localStorage.getItem("userName");
  const userBadge = document.getElementById("user");
  if (!userBadge || !userName || userName === "Guest") return;
  if (typeof getInitials !== "function") return;
  userBadge.textContent = getInitials(userName);
}

/** Resets the form, shows feedback, and redirects to the board. */
async function handleTaskCreated() {
  document.getElementById("taskForm")?.reset();
  await showTaskAddedFeedback();
  window.location.href = "./board.html";
}

/** Starts the success feedback after creating a task. */
function showTaskAddedFeedback() {
  const feedback = document.getElementById("taskAddedFeedback");
  if (!feedback) return Promise.resolve();
  restartTaskAddedFeedback(feedback);
  clearTaskAddedFeedbackTimer();
  return waitForTaskAddedFeedbackToFinish(feedback);
}

/** Restarts the feedback animation by reapplying the CSS class. */
function restartTaskAddedFeedback(feedback) {
  feedback.classList.remove("task_added_feedback_visible");
  void feedback.offsetWidth;
  feedback.classList.add("task_added_feedback_visible");
}

/** Stops an active feedback timer. */
function clearTaskAddedFeedbackTimer() {
  if (!taskAddedFeedbackTimer) return;
  window.clearTimeout(taskAddedFeedbackTimer);
}

/** Waits until the feedback display has fully finished. */
function waitForTaskAddedFeedbackToFinish(feedback) {
  return new Promise((resolve) => {
    taskAddedFeedbackTimer = window.setTimeout(() => finishTaskAddedFeedback(feedback, resolve), TASK_ADDED_TOTAL_MS);
  });
}

/** Hides the feedback and completes the finish callback. */
function finishTaskAddedFeedback(feedback, resolve) {
  feedback.classList.remove("task_added_feedback_visible");
  resolve();
}

Object.assign(window, { initAddTask });