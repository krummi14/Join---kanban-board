import { getContactInitials } from "../addtask/addTaskForm.js";

/**
 * Returns the complete overlay markup for a board task.
 * 
 * Wraps the composed task detail content in the outer overlay container.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Overlay markup.
 */
export function generateTaskOverlay(task) {
  return `
    <div class="task_overlay">
      ${buildTaskOverlayContent(task)}
    </div>
  `;
}

/**
 * Builds the inner content for the task detail overlay.
 * 
 * Combines the task metadata, assignees, subtasks, move actions,
 * and footer action buttons into one fragment.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Overlay body markup.
 */
function buildTaskOverlayContent(task) {
  return [
    generateOverlayHeader(task),
    generateOverlayTitle(task),
    generateOverlayDescription(task),
    generateOverlayDueDate(task),
    generateOverlayPriority(task),
    generateOverlayAssignees(task),
    generateSubtasksWrapper(generateSubtasksContent(task)),
    generateOverlayMoveActions(task),
    generateOverlayActions(task),
  ].join("");
}

/**
 * Builds the move-action area for the task overlay.
 * 
 * @param {Object} task - Normalized board task.
 * @returns {string} Move-action markup.
 */
function generateOverlayMoveActions(task) {
  const moveOptions = getMoveOptions(task.status);
  if (!moveOptions.length) return "";
  return `
    <div class="overlay_move_actions" aria-label="Move task">
      <p class="overlay_move_label">Move to</p>
      <div class="overlay_move_buttons">
        ${moveOptions.map((option) => generateMoveActionButton(task.id, option)).join("")}
      </div>
    </div>
  `;
}

/**
 * Returns the allowed board move targets for the current status.
 * 
 * @param {string} currentStatus - Current task status.
 * @returns {Array<Object>} Allowed move target descriptors.
 */
function getMoveOptions(currentStatus) {
  return getBoardMoveTargets().filter((target) => target.path !== currentStatus);
}

/**
 * Returns all supported board move targets.
 * 
 * @returns {Array<Object>} Static move target descriptors.
 */
function getBoardMoveTargets() {
  return [
    { path: "to_do", label: "To do" },
    { path: "in_progress", label: "In progress" },
    { path: "await_feedback", label: "Await feedback" },
    { path: "done", label: "Done" },
  ];
}

/**
 * Returns one move button for the task overlay.
 * 
 * @param {string} taskId - Task id to move.
 * @param {Object} option - Move target descriptor.
 * @returns {string} Move button markup.
 */
function generateMoveActionButton(taskId, option) {
  return `
    <button class="overlay_move_button" onclick="moveTaskFromOverlay('${taskId}', '${option.path}')">
      ${option.label}
    </button>
  `;
}

function generateOverlayActions(task) {
  return `
    <div class="overlay_actions">
      <div>
        <button onclick="deleteTask('${task.id}')">
          <img
            class="del_icon_task_overlay"
            src="../assets/img/del_img.svg"
            onmouseover="this.src='../assets/img/del_img_hover.svg'"
            onmouseout="this.src='../assets/img/del_img.svg'">
        </button>
      </div>
      <hr>
      <div>
        <button onclick="editTask('${task.id}')">
          <img
            class="edit_icon_task_overlay"
            src="../assets/img/edit_img.svg"
            onmouseover="this.src='../assets/img/edit_img_hover.svg'"
            onmouseout="this.src='../assets/img/edit_img.svg'">
        </button>
      </div>
    </div>
  `;
}

function generateOverlayHeader(task) {
  return `
    <div class="overlay_header">
      <span class="task_category">${task.type || "User Story"}</span>
      <button class="close_button" onclick="closeOverlay()">✕</button>
    </div>
  `;
}

function generateOverlayTitle(task) {
  return `<h2>${task.title}</h2>`;
}

function generateOverlayDescription(task) {
  return `
    <div class="task_description_card">
      ${task.description || ""}
    </div>
  `;
}

function generateOverlayDueDate(task) {
  return `
    <p>Due date: ${formatDate(task.dueDate)}</p>
  `;
}

function generateOverlayPriority(task) {
  return `
    <div class="task_priority_overlay">
      <span>Priority: ${task.priority}</span>
      <img src="${task.priorityIcon}" alt="priority icon">
    </div>
  `;
}

function generateOverlayAssignees(task) {
  return `
    <div class="task_assignees_overlay">
      <h3>Assigned To:</h3>
      ${generateAssigneesContent(task)}
    </div>
  `;
}

export function generateAssignee(a) {
  return `
    <div class="assignee_row">
      <div class="avatar" style="background:${getColorFromName(a.name)}">
        ${getContactInitials(a.name)}
      </div>
      <span class="assignee_row_name">${a.name}</span>
    </div>
  `;
}

function generateSubtasksWrapper(content) {
  return `
    <div class="task_subtasks">
      <h3>Subtasks</h3>
      ${content}
    </div>
  `;
}

export function generateSubtask(task, st, i) {
  return `
    <label class="subtask_item">
      ${buildSubtaskCheckbox(task.id, st.done, i)}
      <span class="custom_checkbox" aria-hidden="true">
        <img
          class="subtask_checkbox_icon subtask_checkbox_icon_unchecked"
          src="../assets/icon/subtask_unchecked.svg"
          alt="">
        <img
          class="subtask_checkbox_icon subtask_checkbox_icon_checked"
          src="../assets/icon/subtask_checked.svg"
          alt="">
      </span>
      <span class="subtask_text">${st.title}</span>
    </label>
  `;
}

function buildSubtaskCheckbox(taskId, isDone, index) {
  return `
    <input type="checkbox"
           ${isDone ? "checked" : ""}
           onchange="toggleSubtask('${taskId}', ${index})">
  `;
}

export function getNoSubtasksTemplate() {
  return `<p>No subtasks yet</p>`;
}

/**
 * Returns the assignee empty state shown in the overlay.
 * 
 * @returns {string} Empty-state markup.
 */
export function getNoAssigneesTemplate() {
  return `<p>No Users assigned</p>`;
}

/**
 * Returns the overlay row for one assignee.
 * 
 * Marks the current user when appropriate.
 * 
 * @param {Object} a - Assignee object.
 * @param {boolean} isYou - Whether the assignee matches the current user.
 * @returns {string} Assignee row markup.
 */
export function getAssigneeTemplate(a, isYou) {
  return `
    <div class="assignee_row">
      <div class="avatar" style="background:${getColorFromName(a.name)}">
        ${getContactInitials(a.name)}
      </div>
      <span>${a.name} ${isYou ? "(you)" : ""}</span>
    </div>
  `;
}

function getColorFromName(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][name.length % 6];
}
