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
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][
    name.length % 6
  ];
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
      ${createOverlayActionButton("deleteTask", task.id, "/assets/icon/subtask_del.svg")}<span>Delete</span>
      <hr>
      ${createOverlayActionButton("editTask", task.id, "/assets/icon/subtask_edit.svg")}<span>Edit</span>
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

      <div class="avatar"
           style="background:${getColorFromName(a.name)}">
        ${getContactInitials(a.name)}
      </div>

      <span>${a.name} ${isYou ? "(you)" : ""}</span>

    </div>
  `;
}



export function createEditTaskTemplate() {
  return `
  <div class="edit_overlay">

    <!-- CLOSE -->
    <div class="close_button">
      <div class="close_icon_wrapper close_icon_margin">
        <img src="../assets/img/close.svg"
             class="close_icon"
             onclick="closeOverlay()">
      </div>
    </div>

    <div class="scroll-area">

      <form id="taskForm" class="edit_form">

        <!-- TITLE -->
        <div class="edit_title">
          <label>Title<span class="red_star">*</span></label>
          <input id="title" type="text" required class="input_style">
        </div>

        <!-- DESCRIPTION -->
        <div class="edit_description">
          <label>Description</label>
          <textarea id="description" class="input_style"></textarea>
        </div>

        <!-- DUE DATE -->
<div
  class="edit_duedate due_date due_date_picker"
  data-due-date-picker
>
  <label for="dueDate">
    Due Date<span class="red_star">*</span>
  </label>

  <div class="due_date_picker_field">

    <!-- INPUT -->
    <input
      type="text"
      id="dueDate"
      name="dueDate"
      class="due_date_input input_style"
      placeholder="dd/mm/yyyy"
      inputmode="numeric"
      autocomplete="off"
      required
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-controls="dueDateMenu"
    >

    <!-- CALENDAR BUTTON -->
    <button
      type="button"
      class="due_date_icon"
      data-due-date-toggle="true"
      aria-label="Open due date calendar"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="3.5"
          y="5.5"
          width="17"
          height="15"
          rx="2.5"
          stroke="currentColor"
          stroke-width="1.5"
        />

        <path
          d="M7 3.5V7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />

        <path
          d="M17 3.5V7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />

        <path
          d="M3.5 9H20.5"
          stroke="currentColor"
          stroke-width="1.5"
        />

        <path
          d="M8 13H8.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />

        <path
          d="M12 13H12.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />

        <path
          d="M16 13H16.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <!-- DATE PICKER MENU -->
    <section
      id="dueDateMenu"
      class="due_date_menu d_none"
      aria-label="Due date calendar"
    >

      <!-- HEADER -->
      <div class="due_date_menu_header">

        <button
          type="button"
          class="due_date_nav_button"
          data-due-date-nav="-1"
        >
          &#8249;
        </button>

        <span
          id="dueDateMonthLabel"
          class="due_date_month_label"
        ></span>

        <button
          type="button"
          class="due_date_nav_button"
          data-due-date-nav="1"
        >
          &#8250;
        </button>

      </div>

      <!-- WEEKDAYS -->
      <div class="due_date_weekdays">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      <!-- DAYS -->
      <div
        id="dueDateDays"
        class="due_date_days"
      ></div>

    </section>

  </div>
</div>

        <!-- PRIORITY -->
        <div class="edit_priority">
          <p class="bold_font">Priority</p>

          <div class="priority_buttons">
            <button type="button" id="prio_urgent" data-priority="urgent">
              Urgent
            </button>

            <button type="button" id="prio_medium" data-priority="medium">
              Medium
            </button>

            <button type="button" id="prio_low" data-priority="low">
              Low
            </button>
          </div>
        </div>

        <!-- ASSIGNEES -->
        <div class="edit_assigned_to">
          <label>Assigned to</label>

          <div class="assignee_dropdown">

            <button
              type="button"
              id="assigneeToggle"
              class="assignee_toggle"
              onclick="toggleAssigneeDropdown(event)">
              Select contacts
            </button>

            <div
              id="assigneeDropdownMenu"
              class="assignee_menu d_none"
              onclick="event.stopPropagation()">
            </div>

          </div>

          <!-- SELECTED AVATARS -->
          <div id="selectedContacts" class="avatar_row"></div>
        </div>

<!-- SUBTASKS -->
<section class="subtask">
  <label for="subtask">Subtasks</label>

  <section class="subtask_input_wrapper">

    <input
      type="text"
      id="subtask"
      name="subtask"
      placeholder="Add new subtask">

    <div class="subtask_action_buttons">

      <button
        type="button"
        id="clearSubtaskButton"
        class="subtask_action_button"
        aria-label="Clear subtask input">

        <img
          src="../assets/icon/subtask_close.svg"
          alt="Clear subtask input">

      </button>

      <button
        type="button"
        id="addSubtaskButton"
        class="subtask_action_button"
        aria-label="Add subtask">

        <img
          src="../assets/icon/subtask_check.svg"
          alt="Add subtask">

      </button>

    </div>

  </section>

  <section
    id="subtaskList"
    class="subtask_list">
  </section>

</section>

        <!-- ACTION -->
        <div class="edit_actions">
          <button type="submit">
            Ok ✓
          </button>
        </div>

      </form>

    </div>
  </div>
  `;
}

