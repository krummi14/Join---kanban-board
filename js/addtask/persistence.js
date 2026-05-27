import { putUserData } from "../shared/firebase.js";
import { normalizeStatus } from "../shared/assets.js";
import { getAssignedContacts } from "./assignees.js";
import { getDueDateStorageValue } from "./dueDate.js";

const TASKS_STORAGE_PATH = "tasks";

/**
 * Handles form submission and persists the current task data.
 * 
 * Prevents the native form submit, determines the edit mode from the form,
 * and saves the current task while logging persistence failures.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {SubmitEvent} event - Submit event from the form.
 * @returns {Promise<void>}
 */
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

/**
 * Chooses whether to create a new task or update an existing one.
 * 
 * Uses the presence of an edit id to decide whether the current form
 * should update a stored task or create a new one.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} editId - Existing task id when editing.
 * @returns {Promise<Object|void>} The saved task for new tasks, otherwise void.
 */
async function persistTaskSubmission(context, editId) {
  if (editId) return updateExistingTask(context, editId);
  return saveTask(context);
}

/**
 * Updates an existing task in storage.
 * 
 * Builds the task payload, writes it back to the configured edit path,
 * and triggers the optional save callback afterward.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} taskId - Id of the task being updated.
 * @returns {Promise<void>}
 */
export async function updateExistingTask(context, taskId) {
  const updatedTask = buildTaskPayload(context);
  updatedTask.id = taskId;
  await putUserData(`${context.createTaskPath}/${taskId}`, updatedTask);
  if (context.options?.onSave) {
    await context.options.onSave(taskId, updatedTask);
  }
}

/**
 * Saves a new task in storage.
 * 
 * Builds a fresh task payload, stores it under the global tasks path,
 * and invokes the optional create callback after persistence.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Promise<Object>} The newly created task payload.
 */
export async function saveTask(context) {
  const task = buildTaskPayload(context);
  await putUserData(`${TASKS_STORAGE_PATH}/${task.id}`, task);
  if (context.options?.onCreate) {
    await context.options.onCreate(task.id);
  }
  return task;
}

/**
 * Builds the task payload from the current form state.
 * 
 * Collects the current field values, normalized due date, selected category,
 * priority, assignees, and subtasks into the persisted task format.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {Object} The normalized task payload.
 */
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

/**
 * Resolves the task status that should be persisted.
 * 
 * Prefers the existing form status when editing and otherwise derives
 * the status from the configured task creation path.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {string} The task status to persist.
 */
function resolveTaskStatus(context) {
  if (context.taskForm.dataset.editId) {
    return context.taskForm.dataset.status || normalizeStatus(context.createTaskPath);
  }

  return normalizeStatus(context.createTaskPath);
}

/**
 * Normalizes subtasks into the persisted task payload format.
 * 
 * Converts mixed subtask values into objects with stable title and done fields
 * for task persistence.
 * 
 * @param {Array<Object|string>} subtasks - Raw subtask state values.
 * @returns {Array<Object>} Normalized subtask payload objects.
 */
function createSubtaskPayload(subtasks) {
  return subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
}