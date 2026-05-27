import { createEditableSubtaskItem, createSubtaskItem } from "../template/add_task_template.js";

/**
 * Adds a subtask when Enter is pressed in the input field.
 * 
 * Intercepts the Enter key in the subtask input and routes the interaction
 * through the shared subtask creation flow.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {KeyboardEvent} event - Keyboard event from the subtask input.
 */
export function handleSubtaskKeydown(context, event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtask(context);
}

/**
 * Replaces the current subtasks with a normalized list.
 * 
 * Converts the provided values into the internal subtask shape,
 * clears editing state, and rerenders the list.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {Array<Object|string>} [subtasks=[]] - New subtasks to apply.
 */
export function setSubtasks(context, subtasks = []) {
  context.state.subtasks = subtasks.map((subtask) => ({
    title: subtask.title || subtask,
    done: subtask.done ?? false,
  }));
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

/**
 * Adds a new subtask from the current input value.
 * 
 * Validates the current input, appends a new unchecked subtask,
 * clears the input, and updates the rendered list and button states.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
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

/**
 * Starts editing the subtask at the given index.
 * 
 * Validates the requested index, switches the row into editing mode,
 * rerenders the list, and focuses the edit input.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {number} index - Index of the subtask to edit.
 */
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

/**
 * Saves the edited title for a subtask item.
 * 
 * Reads the edited value from the active input, validates it,
 * updates the stored subtask title, and exits edit mode.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {number} index - Index of the subtask being edited.
 */
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

/**
 * Cancels the current subtask editing session.
 * 
 * Clears any active subtask interaction state and rerenders the list
 * without saving a pending edit.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function cancelSubtaskEdit(context) {
  if (context.state.editingSubtaskIndex === null) return;
  clearSubtaskInteractionState(context);
  context.state.editingSubtaskIndex = null;
  renderSubtasks(context);
}

/**
 * Clears the subtask input and restores focus to it.
 * 
 * Empties the visible subtask input, refreshes the button state,
 * and focuses the input for continued entry.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function clearSubtaskInput(context) {
  const input = context.elements.subtaskInput;
  if (!input) return;
  input.value = "";
  updateSubtaskButtonState(context);
  input.focus();
}

/**
 * Renders the current subtask list markup.
 * 
 * Rebuilds the visible subtask list based on the current state and chooses
 * normal or editable markup for the actively edited row.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
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

/**
 * Removes a subtask and keeps the edit index in sync.
 * 
 * Deletes the subtask at the given index, adjusts editing state,
 * and rerenders the remaining list.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {number} index - Index of the subtask to remove.
 */
export function removeSubtask(context, index) {
  context.state.subtasks.splice(index, 1);
  syncEditingSubtaskIndex(context, index);
  renderSubtasks(context);
}

/**
 * Updates the add and clear button states for the subtask input.
 * 
 * Enables or disables the action buttons based on whether the input
 * currently contains any non-whitespace text.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
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