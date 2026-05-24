import { getTasksForColumn } from "./board_taskService.js";
import { generateTaskHTML } from "../template/board_card_template.js";

/** Renders one board column into its container. */
export function renderColumn(category, boardColumns) {
  const column = findColumn(boardColumns, category);
  if (!column) return;
  const container = getColumnContainer(column);
  if (!container) return;
  const tasks = getTasksForColumn(category, boardColumns);
  container.innerHTML = tasks.length ? buildTaskMarkup(tasks) : buildEmptyColumnMarkup(column);
}

/** Adds UI-only view fields to a task before rendering. */
export function prepareTask(task) {
  return {
    ...task,
    categoryClass: task.type === "Technical Task" ? "technical" : "user"
  };
}

/** Updates the given board columns in the DOM. */
export function updateColumns(categories, BOARD_COLUMNS) {
  categories.forEach((category) =>
    renderColumn(category, BOARD_COLUMNS)
  );
}

/** Updates all board columns in the DOM. */
export function updateHTML(BOARD_COLUMNS) {
  updateColumns(
    BOARD_COLUMNS.map((column) => column.path),
    BOARD_COLUMNS
  );
}

/** Finds a board column configuration by path. */
function findColumn(boardColumns, category) {
  return boardColumns.find((column) => column.path === category);
}

/** Returns the DOM container for a board column. */
function getColumnContainer(column) {
  return document.getElementById(column.containerId);
}

/** Returns the empty-state markup for a board column. */
function buildEmptyColumnMarkup(column) {
  return `<p class="no_task_text">No tasks ${column.label}</p>`;
}

/** Returns the full task-card markup for a column. */
function buildTaskMarkup(tasks) {
  return tasks.map((task) => generateTaskHTML(prepareTask(task))).join("");
}
