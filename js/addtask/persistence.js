import { putUserData } from "../shared/firebase.js";
import { normalizeStatus } from "../shared/assets.js";
import { getAssignedContacts } from "./assignees.js";
import { getDueDateStorageValue } from "./dueDate.js";

const TASKS_STORAGE_PATH = "tasks";

/** Handles form submission and persists the current task data. */
export async function handleTaskSubmit(context, event) {
  event.preventDefault();
  const form = context.taskForm;
  const editId = form.dataset.editId;
  try {
    await persistTaskSubmission(context, editId);
  } catch (error) {
    console.error("SAVE FAILED", error);
  }
}

/** Chooses whether to create a new task or update an existing one. */
async function persistTaskSubmission(context, editId) {
  if (editId) return updateExistingTask(context, editId);
  return saveTask(context);
}

/** Updates an existing task in storage. */
export async function updateExistingTask(context, taskId) {
  const updatedTask = buildTaskPayload(context);
  updatedTask.id = taskId;
  await putUserData(`${context.createTaskPath}/${taskId}`, updatedTask);
  if (context.options?.onSave) {
    await context.options.onSave(taskId, updatedTask);
  }
}

/** Saves a new task in storage. */
export async function saveTask(context) {
  const task = buildTaskPayload(context);
  await putUserData(`${TASKS_STORAGE_PATH}/${task.id}`, task);
  if (context.options?.onCreate) {
    await context.options.onCreate(task.id);
  }
  return task;
}

/** Builds the task payload from the current form state. */
export function buildTaskPayload(context) {
  return {
    id: context.taskForm.dataset.editId || Date.now().toString(),
    title: context.elements.title?.value.trim() || "",
    description: context.elements.description?.value.trim() || "",
    dueDate: getDueDateStorageValue(context),
    status: resolveTaskStatus(context),
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority,
    assignees: getAssignedContacts(context),
    subtasks: createSubtaskPayload(context.state.subtasks),
  };
}

/** Resolves the task status that should be persisted. */
function resolveTaskStatus(context) {
  if (context.taskForm.dataset.editId) {
    return context.taskForm.dataset.status || normalizeStatus(context.createTaskPath);
  }

  return normalizeStatus(context.createTaskPath);
}

/** Normalizes subtasks into the persisted task payload format. */
function createSubtaskPayload(subtasks) {
  return subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
}