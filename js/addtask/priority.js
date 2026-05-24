import { byId } from "./context.js";

const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_PRIORITY = "medium";

/** Applies the default priority to the current form. */
export function applyDefaultPriority(context) {
  setPriority(context, DEFAULT_PRIORITY);
}

/** Resets every priority button to its inactive state. */
export function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

/** Sets the selected priority and updates the button states. */
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

/** Resets a single priority button to its default markup. */
function resetPriorityButton(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

/** Creates the HTML markup for a priority button label. */
function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

/** Capitalizes the first character of a text value. */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}