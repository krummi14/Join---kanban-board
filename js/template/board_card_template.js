import { getContactInitials } from "../addtask/addTaskForm.js";

export function generateTaskHTML(task) {
  return `
    <div class="task" onclick="handleTaskCardClick(event, '${task.id}')" onmousedown="startDragging(event, '${task.id}')" ontouchstart="startDragging(event, '${task.id}')">
      ${buildTaskCardContent(task)}
    </div>
  `;
}

function buildTaskCardContent(task) {
  return [
    generateTaskTop(task),
    `<div>
      ${generateTitle(task)}
      ${generateDescription(task)}
      </div>`,
    generateTaskBottom(task),
  ].join("");
}

function generateTaskTop(task) {
  return `
    <div class="task_top">
      ${generateCategory(task)}
      ${generateCardMoveActions(task)}
    </div>
  `;
}

export function generateCardMoveActions(task) {
  const actionButtons = [
    generateCardMoveButton(task, -1, "Previous column", "\u2BC5"),
    generateCardMoveButton(task, 1, "Next column", "\u2BC6"),
  ].filter(Boolean).join("");

  if (!actionButtons) return "";
  return `<div class="task_card_actions">${actionButtons}</div>`;
}

function generateCardMoveButton(task, direction, label, icon) {
  const targetPath = getAdjacentTaskPath(task.status, direction);
  if (!targetPath) return "";
  return `
    <button
      type="button"
      class="task_move_button"
      aria-label="${label}"
      onclick="moveTaskFromCard(event, '${task.id}', ${direction})"
      onmousedown="event.stopPropagation()"
      ontouchstart="event.stopPropagation()">
      ${icon}
    </button>
  `;
}

function getAdjacentTaskPath(status, direction) {
  const boardColumns = window.BOARD_COLUMNS || [];
  const currentIndex = boardColumns.findIndex((column) => normalizeBoardPath(column.path) === normalizeBoardPath(status));
  if (currentIndex === -1) return null;
  return boardColumns[currentIndex + direction]?.path || null;
}

function normalizeBoardPath(path) {
  return String(path || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\s+/g, " ");
}

function generateTaskBottom(task) {
  return `
    <div class="task_bottom">
      <div class="task_left">
        ${generateProgress(task)}
        ${generateFooter(task)}
      </div>
    </div>
  `;
}

function generateCategory(task) {
  return `
    <span class="task_category ${task.categoryClass}">
      ${task.type || "User Story"}
    </span>
  `;
}

function generateTitle(task) {
  return `
    <span class="task_title">
      ${task.title}
    </span>
  `;
}

function generateDescription(task) {
  return `
    <span class="task_description">
      ${task.description ? task.description : ""}
    </span>
  `;
}

function generateProgress(task) {
  if (!task.totalSubtasks) return "";
  return `
    <div class="task_progress_wrapper">
      <div class="progressbar">
        <div class="progressbar_fill" style="width:${task.progress}%"></div>
      </div>
      <p>${task.doneSubtasks}/${task.totalSubtasks} Subtasks</p>
    </div>
  `;
}

function generateFooter(task) {
  return `
    <div class="task_footer">
        <div class="avatar_group">
            ${task.avatarHTML}
        </div>

        <div class="priority_icon">
            <img src="${task.priorityIcon}" alt="priority icon" draggable="false">
        </div>
    </div>
  `;
}

export function generateSingleAvatar(assignee) {
  return `
    <div class="avatar" style="background:${getColorFromName(assignee.name)}">
      ${getContactInitials(assignee.name)}
    </div>
  `;
}

export function generateExtraAvatar(rest) {
  return `
    <div class="avatar" style="background:#2a3647">
      +${rest}
    </div>
  `;
}

export function getNoAssigneesCardTemplate() {
  return `<span class="no_assignees">No Users assigned</span>`;
}

function getColorFromName(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][name.length % 6];
}
