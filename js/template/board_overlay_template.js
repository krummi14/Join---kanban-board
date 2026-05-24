import { getContactInitials } from "../addtask/addTaskForm.js";

export function generateTaskOverlay(task) {
  return `
    <div class="task_overlay">
      ${buildTaskOverlayContent(task)}
    </div>
  `;
}

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

function getMoveOptions(currentStatus) {
  return getBoardMoveTargets().filter((target) => target.path !== currentStatus);
}

function getBoardMoveTargets() {
  return [
    { path: "to_do", label: "To do" },
    { path: "in_progress", label: "In progress" },
    { path: "await_feedback", label: "Await feedback" },
    { path: "done", label: "Done" },
  ];
}

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

export function getNoAssigneesTemplate() {
  return `<p>No Users assigned</p>`;
}

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
