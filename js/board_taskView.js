import { getTasksForColumn } from "./board_taskService.js";
import { generateTaskHTML } from "./template/board_template.js";

export function renderColumn(category, BOARD_COLUMNS) {
  const column = BOARD_COLUMNS.find((c) => c.path === category);
  if (!column) return;

  const container = document.getElementById(column.containerId);
  if (!container) return;

  const tasks = getTasksForColumn(category, BOARD_COLUMNS);

  if (!tasks.length) {
    container.innerHTML = `<p class="no_task_text">No tasks ${column.label}</p>`;
    return;
  }

  container.innerHTML = tasks
    .map((task) => generateTaskHTML(task))
    .join("");
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