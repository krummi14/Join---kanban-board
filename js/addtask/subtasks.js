import { createEditableSubtaskItem, createSubtaskItem } from "../template/add_task_template.js";

export function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtask(context);
}

export function setSubtasks(context, subtasks = []) {
  context.state.subtasks = subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

export function addSubtask(context) {
  const input = context.elements.subtaskInput;
  const title = input?.value.trim();

  if (!title) {
    updateSubtaskButtonState(context);
    return;
  }
  if (!Array.isArray(context.state.subtasks)) context.state.subtasks = [];

  context.state.subtasks.push({ title, done: false });
  if (input) input.value = "";
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

export function startSubtaskEdit(context, index) {
  if (!Number.isInteger(index) || index < 0 || index >= context.state.subtasks.length) return;
  context.state.editingSubtaskIndex = index;
  renderSubtasks(context);
  focusSubtaskEditInput(context, index);
}

export function saveSubtaskEdit(context, index) {
  const input = context.taskForm.querySelector(`[data-edit-subtask-input="${index}"]`);
  const title = input?.value.trim();
  if (!title) {
    input?.focus();
    return;
  }
  if (!context.state.subtasks[index]) return;
  context.state.subtasks[index].title = title;
  clearSubtaskInteractionState(context);
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

export function cancelSubtaskEdit(context) {
  if (context.state.editingSubtaskIndex === null) return;
  clearSubtaskInteractionState(context);
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

export function clearSubtaskInput(context) {
  const input = context.elements.subtaskInput;
  if (!input) return;
  input.value = "";
  updateSubtaskButtonState(context);
  input.focus();
}

export function renderSubtasks(context) {
  if (!context.elements.subtaskList) return;
  context.elements.subtaskList.innerHTML = context.state.subtasks
    .map((subtask, index) => {
      const item = { ...subtask, isEditing: context.state.editingSubtaskIndex === index };
      return item.isEditing ? createEditableSubtaskItem(item, index) : createSubtaskItem(item, index);
    })
    .join("");
}

export function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  if (context.state.editingSubtaskIndex === index) context.state.editingSubtaskIndex = null;
  else if (context.state.editingSubtaskIndex !== null && context.state.editingSubtaskIndex > index) context.state.editingSubtaskIndex -= 1;
  renderSubtasks(context);
}

export function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, clearSubtaskButton, subtaskInputWrapper } = context.elements;
  if (!subtaskInput || !addSubtaskButton || !clearSubtaskButton || !subtaskInputWrapper) return;
  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  clearSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

function focusSubtaskEditInput(context, index) {
  const input = context.taskForm.querySelector(`[data-edit-subtask-input="${index}"]`);
  if (!input) return;
  input.focus();
  input.select();
}

function clearSubtaskInteractionState(context) {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;
  if (!context.elements.subtaskList?.contains(activeElement)) return;
  activeElement.blur();
}