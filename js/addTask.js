import { createAddTaskForm } from "./addTaskForm.js";

let addTaskFormController = null;

async function initAddTask() {
  const userName = localStorage.getItem("userName");
  const taskForm = document.getElementById("taskForm");
  const createTaskValue = document.getElementById("createTask").value;

  if (!taskForm) {
    return null;
  }

  if (userName !== "Guest" && typeof getInitials === "function") {
    const initials = getInitials(userName);
    const refUser = document.getElementById("user");
    if (refUser) {
      refUser.innerHTML = initials;
    }
  }

  if (addTaskFormController) {
    addTaskFormController.destroy();
  }

  addTaskFormController = createAddTaskForm(taskForm, createTaskValue);
  return addTaskFormController;
}

Object.assign(window, {
  initAddTask,
});
