import { getContactInitials } from "../addtask/addTaskForm.js";
export function generateTaskHTML(task) {
  return `
    <div class="task" onclick="openOverlay('${task.id}')" draggable="true" ondragstart="startDragging(event, '${task.id}')" ondragend="endDragging()">
      ${buildTaskCardContent(task)}
    </div>
  `;
}

function buildTaskCardContent(task) {
  return [
    generateCategory(task),
    generateTitle(task),
    generateDescription(task),
    generateTaskBottom(task),
  ].join("");
}

function generateTaskBottom(task) {
  return `
    <div class="task_bottom">
      <div class="task_left">
        ${generateProgress(task)}
        ${generateFooter(task)}
      </div>
      <div class="task_right"></div>
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
            ${generateAvatars(task)}
        </div>

        <div class="priority_icon">
            <img src="${task.priorityIcon}" alt="priority icon">
        </div>
    </div>
  `;
}

function generateAvatars(task) {
  return `
    ${task.avatarHTML}
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

function getColorFromName(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][name.length % 6];
}

export function getNoAssigneesCardTemplate() {
  return `<span class="no_assignees">No Users assigned</span>`;
}

/*overlay*/

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
    generateOverlayActions(task),
  ].join("");
}

function generateOverlayActions(task) {
  return `
    <div class="overlay_actions">
      ${createOverlayActionButton("editTask", task.id, "/assets/icon/subtask_edit.svg")}
      ${createOverlayActionButton("deleteTask", task.id, "/assets/icon/subtask_del.svg")}
    </div>
  `;
}

function createOverlayActionButton(action, taskId, iconPath) {
  return `
    <button onclick="${action}('${taskId}')">
      <img src="${iconPath}">
    </button>
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

      <div class="avatar"
           style="background:${getColorFromName(a.name)}">
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

export function getDialogAddTaskTemplate() {
  return `
      <dialog onclick="closeAddNewTaskDialog()" id="addTask_dialog" class="addTask_dialog_content dialog_closed">
        <div class="addTask_dialog_direction" onclick="closeDialogOnBodyclick(event)">
          ${buildAddTaskDialogHeader()}
          <section id="addTaskContainer" class="add_task_container"></section>
          ${buildTaskAddedFeedback()}
        </div>
      </dialog>
    `;
}

function buildAddTaskDialogHeader() {
  return `
    <section class="main_header main_addTask_dialog_header">
      <h1>Add Task</h1>
      <div class="contact_dialog_close_button_direction">
        <button class="close_button" onclick="closeAddNewTaskDialog()">X</button>
      </div>
    </section>
  `;
}

function buildTaskAddedFeedback() {
  return `
    <section id="taskAddedFeedback" class="task_added_feedback" role="status" aria-live="polite">
      <img src="../assets/img/addedTo.svg" alt="Task added to board">
    </section>
  `;
}

export function generateSubtask(task, st, i) {
  return `
    <label class="subtask_item">

      ${buildSubtaskCheckbox(task.id, st.done, i)}
      <span class="custom_checkbox"></span>
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

      <div class="avatar"
           style="background:${getColorFromName(a.name)}">
        ${getContactInitials(a.name)}
      </div>

      <span>${a.name} ${isYou ? "(you)" : ""}</span>

    </div>
  `;
}
