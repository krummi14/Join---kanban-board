import { byId } from "./context.js";

const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_PRIORITY = "medium";

/**
 * Applies the default priority to the current form.
 * 
 * Selects the predefined default priority button and updates
 * the shared state to match.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function applyDefaultPriority(context) {
  setPriority(context, DEFAULT_PRIORITY);
}

/**
 * Resets every priority button to its inactive state.
 * 
 * Iterates over all configured priorities and restores each button
 * to its non-active appearance.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

/**
 * Sets the selected priority and updates the button states.
 * 
 * Toggles the requested priority button, resets all others,
 * and stores the current selection in shared state.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} priority - Priority value to activate.
 */
export function setPriority(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  const isActive = button.classList.contains("active");
  resetPriorityButtons(context);
  if (isActive) {
    context.state.selectedPriority = "";
    return;
  }
  button.classList.add("active");
  button.innerHTML = createPriorityMarkup(priority, "on");
  context.state.selectedPriority = priority;
}

/**
 * Resets a single priority button to its default markup.
 * 
 * Removes the active styling from the button and restores
 * the inactive icon and label markup.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} priority - Priority value whose button should reset.
 */
function resetPriorityButton(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

/**
 * Creates the HTML markup for a priority button label.
 * 
 * Builds the text and icon markup for the given priority and state.
 * 
 * @param {string} priority - Priority value to render.
 * @param {string} state - Visual state suffix for the icon asset.
 * @returns {string} The button markup.
 */
function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

/**
 * Capitalizes the first character of a text value.
 * 
 * Converts the first character to uppercase and leaves the remainder unchanged.
 * 
 * @param {string} text - Text to capitalize.
 * @returns {string} The capitalized text.
 */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}