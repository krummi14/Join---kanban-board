import { getTasksForColumn } from "./board_taskService.js";
import { generateTaskHTML } from "../template/board_card_template.js";

/**
 * Renders one board column into its container.
 * 
 * Resolves the target column configuration, reads its tasks,
 * and injects either task cards or the empty-state message.
 * 
 * @param {string} category - Board column path.
 * @param {Array<Object>} boardColumns - Current board column state.
 */
export function renderColumn(category, boardColumns) {
  const column = findColumn(boardColumns, category);
  if (!column) return;
  const container = getColumnContainer(column);
  if (!container) return;
  const tasks = getTasksForColumn(category, boardColumns);
  container.innerHTML = tasks.length ? buildTaskMarkup(tasks) : buildEmptyColumnMarkup(column);
}

/**
 * Adds UI-only view fields to a task before rendering.
 * 
 * Enriches the raw task object with CSS-facing values used by the view.
 * 
 * @param {Object} task - Raw task object.
 * @returns {Object} View-ready task object.
 */
export function prepareTask(task) {
  return {
    ...task,
    categoryClass: task.type === "Technical Task" ? "technical" : "user"
  };
}

/**
 * Updates the given board columns in the DOM.
 * 
 * @param {Array<string>} categories - Column paths to re-render.
 * @param {Array<Object>} BOARD_COLUMNS - Current board column state.
 */
export function updateColumns(categories, BOARD_COLUMNS) {
  categories.forEach((category) =>
    renderColumn(category, BOARD_COLUMNS)
  );
}

/**
 * Updates all board columns in the DOM.
 * 
 * Re-renders every configured column using the current board state.
 * 
 * @param {Array<Object>} BOARD_COLUMNS - Current board column state.
 */
export function updateHTML(BOARD_COLUMNS) {
  updateColumns(
    BOARD_COLUMNS.map((column) => column.path),
    BOARD_COLUMNS
  );
}

/**
 * Finds a board column configuration by path.
 * 
 * @param {Array<Object>} boardColumns - Available board columns.
 * @param {string} category - Column path to resolve.
 * @returns {Object|undefined} Matching board column configuration.
 */
function findColumn(boardColumns, category) {
  return boardColumns.find((column) => column.path === category);
}

/**
 * Returns the DOM container for a board column.
 * 
 * @param {Object} column - Board column configuration.
 * @returns {HTMLElement|null} Matching column container element.
 */
function getColumnContainer(column) {
  return document.getElementById(column.containerId);
}

/**
 * Returns the empty-state markup for a board column.
 * 
 * @param {Object} column - Board column configuration.
 * @returns {string} Empty column markup.
 */
function buildEmptyColumnMarkup(column) {
  return `<p class="no_task_text">No tasks ${column.label}</p>`;
}

/**
 * Returns the full task-card markup for a column.
 * 
 * @param {Array<Object>} tasks - Tasks assigned to the column.
 * @returns {string} Concatenated task-card markup.
 */
function buildTaskMarkup(tasks) {
  return tasks.map((task) => generateTaskHTML(prepareTask(task))).join("");
}
