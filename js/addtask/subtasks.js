import { createEditableSubtaskItem, createSubtaskItem } from "../template/add_task_template.js";

/** Adds a subtask when Enter is pressed in the input field. */
export function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtask(context);
}

/** Replaces the current subtasks with a normalized list. */
export function setSubtasks(context, subtasks = []) {
  context.state.subtasks = subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

/** Adds a new subtask from the current input value. */
export function addSubtask(context) {
  const input = context.elements.subtaskInput;
  const title = input?.value.trim();
  if (!title) return handleEmptySubtaskInput(context);
  ensureSubtaskArray(context);
  context.state.subtasks.push({ title, done: false });
  resetSubtaskInput(input);
  renderSubtasks(context);
  updateSubtaskButtonState(context);
}

/** Starts editing the subtask at the given index. */
export function startSubtaskEdit(context, index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= context.state.subtasks.length
  ) {
    return;
  }
  context.state.editingSubtaskIndex = index;
  renderSubtasks(context);
  focusSubtaskEditInput(context, index);
}

/** Saves the edited title for a subtask item. */
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

/** Cancels the current subtask editing session. */
export function cancelSubtaskEdit(context) {
  if (context.state.editingSubtaskIndex === null) return;
  clearSubtaskInteractionState(context);
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

/** Clears the subtask input and restores focus to it. */
export function clearSubtaskInput(context) {
  const input = context.elements.subtaskInput;
  if (!input) return;
  input.value = "";
  updateSubtaskButtonState(context);
  input.focus();
}

/** Renders the current subtask list markup. */
export function renderSubtasks(context) {

  if (!context.elements.subtaskList) {
    return;
  }

  context.elements.subtaskList.innerHTML =
    context.state.subtasks
      .map((subtask, index) => {

        const isEditing =
          context.state.editingSubtaskIndex === index;

        const item = {
          ...subtask,
          isEditing
        };

        return isEditing
          ? createEditableSubtaskItem(item, index)
          : createSubtaskItem(item, index);
      })
      .join("");
}

/** Removes a subtask and keeps the edit index in sync. */
export function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  syncEditingSubtaskIndex(context, index);
  renderSubtasks(context);
}

/** Updates the add and clear button states for the subtask input. */
export function updateSubtaskButtonState(context) {
  const { subtaskInput, addSubtaskButton, clearSubtaskButton, subtaskInputWrapper } = context.elements;
  if (!subtaskInput || !addSubtaskButton || !clearSubtaskButton || !subtaskInputWrapper) return;
  const hasInput = subtaskInput.value.trim().length > 0;
  addSubtaskButton.disabled = !hasInput;
  clearSubtaskButton.disabled = !hasInput;
  subtaskInputWrapper.classList.toggle("has-value", hasInput);
}

/** Focuses and selects the editable subtask input. */
function focusSubtaskEditInput(context, index) {
  const input = context.taskForm.querySelector(`[data-edit-subtask-input="${index}"]`);
  if (!input) return;
  input.focus();
  input.select();
}

/** Clears the active DOM interaction state for subtask editing. */
function clearSubtaskInteractionState(context) {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;
  if (!context.elements.subtaskList?.contains(activeElement)) return;
  activeElement.blur();
}

/** Refreshes the subtask controls when no title was entered. */
function handleEmptySubtaskInput(context) {
  updateSubtaskButtonState(context);
}

/** Ensures the subtask state field is an array. */
function ensureSubtaskArray(context) {
  if (Array.isArray(context.state.subtasks)) return;
  context.state.subtasks = [];
}

/** Clears the value of the subtask input element. */
function resetSubtaskInput(input) {
  if (!input) return;
  input.value = "";
}

/** Keeps the editing index aligned after a subtask removal. */
function syncEditingSubtaskIndex(context, index) {
  if (context.state.editingSubtaskIndex === index) return context.state.editingSubtaskIndex = null;
  if (context.state.editingSubtaskIndex === null) return;
  if (context.state.editingSubtaskIndex > index) context.state.editingSubtaskIndex -= 1;
}