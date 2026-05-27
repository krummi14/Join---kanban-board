import { getContactInitials } from "../addtask/addTaskForm.js";

/**
 * Returns the complete board card markup for a task.
 * 
 * Wraps the rendered task content with the event handlers needed
 * for overlay opening and drag-and-drop interaction.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Board card HTML markup.
 */
export function generateTaskHTML(task) {
  return `
    <div class="task" onclick="handleTaskCardClick(event, '${task.id}')" onmousedown="startDragging(event, '${task.id}')" ontouchstart="startDragging(event, '${task.id}')">
      ${buildTaskCardContent(task)}
    </div>
  `;
}

/**
 * Builds the inner content of a board task card.
 * 
 * Combines the card header, text content, and footer area
 * into one HTML fragment.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Inner card markup.
 */
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

/**
 * Builds the top section of a board task card.
 * 
 * Includes the category badge and move controls that are shown
 * on narrow viewports.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Header markup.
 */
function generateTaskTop(task) {
  return `
    <div class="task_top">
      ${generateCategory(task)}
      ${generateCardMoveActions(task)}
    </div>
  `;
}

/**
 * Returns the move-action buttons for a board card.
 * 
 * Generates previous and next column buttons when the task
 * can be moved in that direction.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Move-action markup.
 */
export function generateCardMoveActions(task) {
  const actionButtons = [
    generateCardMoveButton(task, -1, "Previous column", "\u2BC5"),
    generateCardMoveButton(task, 1, "Next column", "\u2BC6"),
  ].filter(Boolean).join("");

  if (!actionButtons) return "";
  return `<div class="task_card_actions">${actionButtons}</div>`;
}

/**
 * Returns one card move button when a target column exists.
 * 
 * @param {Object} task - Normalized board task.
 * @param {number} direction - Relative column direction.
 * @param {string} label - Accessible label for the button.
 * @param {string} icon - Visible icon shown inside the button.
 * @returns {string} Move button markup or an empty string.
 */
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

/**
 * Returns the adjacent board path for a move direction.
 * 
 * Looks up the current status inside the configured board columns
 * and resolves the previous or next path.
 * 
 * @param {string} status - Current task status.
 * @param {number} direction - Relative column offset.
 * @returns {string|null} Adjacent column path.
 */
function getAdjacentTaskPath(status, direction) {
  const boardColumns = window.BOARD_COLUMNS || [];
  const currentIndex = boardColumns.findIndex((column) => normalizeBoardPath(column.path) === normalizeBoardPath(status));
  if (currentIndex === -1) return null;
  return boardColumns[currentIndex + direction]?.path || null;
}

/**
 * Normalizes a board path for reliable comparisons.
 * 
 * Converts separators and whitespace into a stable lowercase format.
 * 
 * @param {string} path - Raw board path.
 * @returns {string} Normalized board path.
 */
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

/**
 * Returns the compact overflow avatar for hidden assignees.
 * 
 * @param {number} rest - Number of hidden assignees.
 * @returns {string} Overflow avatar markup.
 */
export function generateExtraAvatar(rest) {
  return `
    <div class="avatar" style="background:#2a3647">
      +${rest}
    </div>
  `;
}

/**
 * Returns the fallback card text for tasks without assignees.
 * 
 * @returns {string} Empty-state markup.
 */
export function getNoAssigneesCardTemplate() {
  return `<span class="no_assignees">No Users assigned</span>`;
}

function getColorFromName(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][name.length % 6];
}
