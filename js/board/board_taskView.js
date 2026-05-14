import { getTasksForColumn } from "./board_taskService.js";
import { generateTaskHTML } from "../template/board_template.js";

export function renderColumn(category, boardColumns) {
  const column = findColumn(boardColumns, category);
  if (!column) return;
  const container = getColumnContainer(column);
  if (!container) return;
  const tasks = getTasksForColumn(category, boardColumns);
  container.innerHTML = tasks.length ? buildTaskMarkup(tasks) : buildEmptyColumnMarkup(column);
}

export function prepareTask(task) {
  return {
    ...task,
    categoryClass: task.type === "Technical Task" ? "technical" : "user"
  };
}

export function updateColumns(categories, BOARD_COLUMNS) {
  categories.forEach((category) =>
    renderColumn(category, BOARD_COLUMNS)
  );
}

export function updateHTML(BOARD_COLUMNS) {
  updateColumns(
    BOARD_COLUMNS.map((column) => column.path),
    BOARD_COLUMNS
  );
}

function findColumn(boardColumns, category) {
  return boardColumns.find((column) => column.path === category);
}

function getColumnContainer(column) {
  return document.getElementById(column.containerId);
}

function buildEmptyColumnMarkup(column) {
  return `<p class="no_task_text">No tasks ${column.label}</p>`;
}

function buildTaskMarkup(tasks) {
  return tasks.map((task) => generateTaskHTML(prepareTask(task))).join("");
}
