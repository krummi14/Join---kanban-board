import { putUserData } from "../firebase.js";
import { normalizeStatus } from "../assets.js";
import { getAssignedContacts } from "./assignees.js";

export async function handleTaskSubmit(context, event) {
  event.preventDefault();

  const form = context.taskForm;
  const editId = form.dataset.editId;

  try {
    if (editId) {
      await updateExistingTask(context, editId);
      return;
    }
    await saveTask(context);
  } catch (error) {
    console.error("SAVE FAILED", error);
  }
}

export async function updateExistingTask(context, taskId) {
  const updatedTask = buildTaskPayload(context);
  updatedTask.id = taskId;
  await putUserData(`${context.createTaskPath}/${taskId}`, updatedTask);
  if (context.options?.onSave) {
    await context.options.onSave(taskId);
  }
}

export function saveTask(context) {
  const task = buildTaskPayload(context);
  return putUserData(`${context.createTaskPath}/${task.id}`, task);
}

export function buildTaskPayload(context) {
  return {
    id: context.taskForm.dataset.editId || Date.now().toString(),
    title: context.elements.title?.value.trim() || "",
    description: context.elements.description?.value.trim() || "",
    dueDate: context.elements.dueDate?.value || "",
    status: normalizeStatus(context.createTaskPath),
    type: context.state.selectedCategory,
    priority: context.state.selectedPriority,
    assignees: getAssignedContacts(context),
    subtasks: createSubtaskPayload(context.state.subtasks),
  };
}

function createSubtaskPayload(subtasks) {
  return subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
}