import { byId } from "./context.js";

const PRIORITIES = ["urgent", "medium", "low"];
const DEFAULT_PRIORITY = "medium";

export function applyDefaultPriority(context) {
  setPriority(context, DEFAULT_PRIORITY);
}

export function resetPriorityButtons(context) {
  PRIORITIES.forEach((priority) => resetPriorityButton(context, priority));
}

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

function resetPriorityButton(context, priority) {
  const button = byId(context.taskForm, `prio_${priority}`);
  if (!button) return;
  button.classList.remove("active");
  button.innerHTML = createPriorityMarkup(priority, "off");
}

function createPriorityMarkup(priority, state) {
  return `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_${state}.svg" alt="Button ${capitalize(priority)}">`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}