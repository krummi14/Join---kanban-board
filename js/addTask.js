import { createAddTaskForm } from "./addTaskForm.js";

let addTaskFormController = null;

async function initAddTask() {
  const taskForm = document.getElementById("taskForm");
  if (!taskForm) return null;
  updateUserBadge();
  addTaskFormController?.destroy();
  addTaskFormController = createAddTaskForm(taskForm, getCreateTaskStatus());
  return addTaskFormController;
}

function getCreateTaskStatus() {
  return document.getElementById("createTask")?.value || "to_do";
}

function updateUserBadge() {
  const userName = localStorage.getItem("userName");
  const userBadge = document.getElementById("user");
  if (!userBadge || userName === "Guest") return;
  if (typeof getInitials !== "function") return;
  userBadge.textContent = getInitials(userName);
}

Object.assign(window, { initAddTask });
