import { createAddTaskForm } from "./addTaskForm.js";

let addTaskFormController = null;
let taskAddedFeedbackTimer = null;

const TASK_ADDED_FLY_IN_MS = 400;
const TASK_ADDED_HOLD_MS = 1500;
const TASK_ADDED_TOTAL_MS = TASK_ADDED_FLY_IN_MS + TASK_ADDED_HOLD_MS;

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

function getCreateTaskStatus() {
  return document.getElementById("createTask")?.value || "to_do";
}

function updateUserBadge() {
  const userName = localStorage.getItem("userName");
  const userBadge = document.getElementById("user");
  if (!userBadge || !userName || userName === "Guest") return;
  if (typeof getInitials !== "function") return;
  userBadge.textContent = getInitials(userName);
}

async function handleTaskCreated() {
  document.getElementById("taskForm")?.reset();
  await showTaskAddedFeedback();
  window.location.href = "./board.html";
}

function showTaskAddedFeedback() {
  const feedback = document.getElementById("taskAddedFeedback");
  if (!feedback) return Promise.resolve();
  feedback.classList.remove("task_added_feedback_visible");
  void feedback.offsetWidth;
  feedback.classList.add("task_added_feedback_visible");

  if (taskAddedFeedbackTimer) {
    window.clearTimeout(taskAddedFeedbackTimer);
  }

  return new Promise((resolve) => {
    taskAddedFeedbackTimer = window.setTimeout(() => {
      feedback.classList.remove("task_added_feedback_visible");
      resolve();
    }, TASK_ADDED_TOTAL_MS);
  });
}

Object.assign(window, { initAddTask });