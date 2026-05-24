import { getContactInitials } from "../addtask/addTaskForm.js";
/** Returns the markup for a board task card. */
export function generateTaskHTML(task) {
  return `
    <div class="task" onclick="handleTaskCardClick(event, '${task.id}')" onmousedown="startDragging(event, '${task.id}')" ontouchstart="startDragging(event, '${task.id}')">
      ${buildTaskCardContent(task)}
    </div>
  `;
}

/** Builds the inner markup for a task card. */
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

/** Returns the top section of a task card. */
function generateTaskTop(task) {
  return `
    <div class="task_top">
      ${generateCategory(task)}
      ${generateCardMoveActions(task)}
    </div>
  `;
}

/** Returns the move-action section for a task card. */
function generateCardMoveActions(task) {
  const actionButtons = [
    generateCardMoveButton(task.id, -1, "Previous column", "\u2BC5"),
    generateCardMoveButton(task.id, 1, "Next column", "\u2BC6"),
  ].filter(Boolean).join("");

  if (!actionButtons) return "";
  return `<div class="task_card_actions">${actionButtons}</div>`;
}

/** Returns the markup for one card move button. */
function generateCardMoveButton(taskId, direction, label, icon) {
  const targetPath = getAdjacentTaskPath(taskId, direction);
  if (!targetPath) return "";
  return `
    <button
      type="button"
      class="task_move_button"
      aria-label="${label}"
      onclick="moveTaskFromCard(event, '${taskId}', ${direction})"
      onmousedown="event.stopPropagation()"
      ontouchstart="event.stopPropagation()">
      ${icon}
    </button>
  `;
}

/** Resolves the adjacent board column path for a task. */
function getAdjacentTaskPath(taskId, direction) {
  const boardColumns = window.BOARD_COLUMNS || [];
  const task = window.BOARD_COLUMNS?.flatMap((column) => column.tasks || []).find((entry) => entry.id === taskId);
  if (!task) return null;
  const currentIndex = boardColumns.findIndex((column) => column.path === task.status);
  if (currentIndex === -1) return null;
  return boardColumns[currentIndex + direction]?.path || null;
}

/** Returns the bottom section of a task card. */
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

/** Returns the category badge markup for a task. */
function generateCategory(task) {
  return `
    <span class="task_category ${task.categoryClass}">
      ${task.type || "User Story"}
    </span>
  `;
}

/** Returns the title markup for a task. */
function generateTitle(task) {
  return `
    <span class="task_title">
      ${task.title}
    </span>
  `;
}

/** Returns the description markup for a task. */
function generateDescription(task) {
  return `
    <span class="task_description">
      ${task.description ? task.description : ""}
    </span>
  `;
}

/** Returns the subtask progress markup for a task. */
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

/** Returns the footer markup for a task card. */
function generateFooter(task) {
  return `
    <div class="task_footer">
        <div class="avatar_group">
            ${generateAvatars(task)}
        </div>

        <div class="priority_icon">
            <img src="${task.priorityIcon}" alt="priority icon" draggable="false">
        </div>
    </div>
  `;
}

/** Returns the avatar markup block for a task footer. */
function generateAvatars(task) {
  return `
    ${task.avatarHTML}
  `;
}

/** Returns the markup for a single assignee avatar. */
export function generateSingleAvatar(assignee) {
  return `
    <div class="avatar" style="background:${getColorFromName(assignee.name)}">
      ${getContactInitials(assignee.name)}
    </div>
  `;
}

/** Returns the overflow avatar markup for hidden assignees. */
export function generateExtraAvatar(rest) {
  return `
    <div class="avatar" style="background:#2a3647">
      +${rest}
    </div>
  `;
}

/** Returns a stable avatar color derived from a name. */
function getColorFromName(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][
    name.length % 6
  ];
}

/** Returns the empty-state markup for cards without assignees. */
export function getNoAssigneesCardTemplate() {
  return `<span class="no_assignees">No Users assigned</span>`;
}

/*overlay*/

/** Returns the markup for the task details overlay. */
export function generateTaskOverlay(task) {
  return `
    <div class="task_overlay">
      ${buildTaskOverlayContent(task)}
    </div>
  `;
}

/** Builds the inner markup for the task overlay. */
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

/** Returns the move-action section for the task overlay. */
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

/** Returns the available move targets for the current task status. */
function getMoveOptions(currentStatus) {
  return getBoardMoveTargets().filter((target) => target.path !== currentStatus);
}

/** Returns the board move targets used by the overlay. */
function getBoardMoveTargets() {
  return [
    { path: "to_do", label: "To do" },
    { path: "in_progress", label: "In progress" },
    { path: "await_feedback", label: "Await feedback" },
    { path: "done", label: "Done" },
  ];
}

/** Returns the markup for one overlay move button. */
function generateMoveActionButton(taskId, option) {
  return `
    <button class="overlay_move_button" onclick="moveTaskFromOverlay('${taskId}', '${option.path}')">
      ${option.label}
    </button>
  `;
}

/** Returns the overlay action buttons markup. */
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

/** Returns the overlay header markup. */
function generateOverlayHeader(task) {
  return `
    <div class="overlay_header">
      <span class="task_category">${task.type || "User Story"}</span>
      <button class="close_button" onclick="closeOverlay()">✕</button>
    </div>
  `;
}

/** Returns the overlay title markup. */
function generateOverlayTitle(task) {
  return `<h2>${task.title}</h2>`;
}

/** Returns the overlay description markup. */
function generateOverlayDescription(task) {
  return `
    <div class="task_description_card">
      ${task.description || ""}
    </div>
  `;
}

/** Returns the overlay due-date markup. */
function generateOverlayDueDate(task) {
  return `
    <p>Due date: ${formatDate(task.dueDate)}</p>
  `;
}

/** Returns the overlay priority markup. */
function generateOverlayPriority(task) {
  return `
    <div class="task_priority_overlay">
      <span>Priority: ${task.priority}</span>
      <img src="${task.priorityIcon}" alt="priority icon">
    </div>
  `;
}

/** Returns the overlay assignees section markup. */
function generateOverlayAssignees(task) {
  return `
    <div class="task_assignees_overlay">
      <h3>Assigned To:</h3>
      ${generateAssigneesContent(task)}
    </div>
  `;
}

/** Returns the markup for one overlay assignee row. */
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

/** Wraps the overlay subtask content in its section markup. */
function generateSubtasksWrapper(content) {
  return `
    <div class="task_subtasks">
      <h3>Subtasks</h3>
      ${content}
    </div>
  `;
}

/** Returns the add-task dialog markup used from the board. */
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

  /** Returns the header markup for the add-task dialog. */
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

/** Returns the success-feedback markup for the add-task dialog. */
function buildTaskAddedFeedback() {
  return `
    <section id="taskAddedFeedback" class="task_added_feedback" role="status" aria-live="polite">
      <img src="../assets/img/addedTo.svg" alt="Task added to board">
    </section>
  `;
}

/** Returns the markup for one overlay subtask item. */
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

/** Returns the checkbox markup for an overlay subtask. */
function buildSubtaskCheckbox(taskId, isDone, index) {
  return `
    <input type="checkbox"
           ${isDone ? "checked" : ""}
           onchange="toggleSubtask('${taskId}', ${index})">
  `;
}

/** Returns the empty-state markup for missing subtasks. */
export function getNoSubtasksTemplate() {
  return `<p>No subtasks yet</p>`;
}

/** Returns the empty-state markup for missing assignees. */
export function getNoAssigneesTemplate() {
  return `<p>No Users assigned</p>`;
}

/** Returns the overlay assignee markup with optional user marker. */
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



/** Returns the legacy edit-task overlay markup. */
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

