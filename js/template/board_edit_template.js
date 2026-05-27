/**
 * Returns the markup for the edit-task overlay form.
 * 
 * Builds the board overlay used to edit an existing task
 * with the reusable add-task controls.
 * 
 * @returns {string} Edit overlay markup.
 */
export function createEditTaskTemplate() {
  return `
  <div class="edit_overlay">
    ${createEditCloseButton()}
    <div id="addTaskContainer" class="scroll-area add_task_container">
      <form id="taskForm" class="edit_form">
        ${createEditFormSections()}
      </form>
    </div>
  </div>
  `;
}

/**
 * Returns the close button markup for the edit overlay.
 * 
 * @returns {string} Close button markup.
 */
function createEditCloseButton() {
  return `
    <div class="close_button">
      <div class="close_icon_wrapper close_icon_margin">
        <img src="../assets/img/close.svg" class="close_icon" onclick="closeOverlay()">
      </div>
    </div>
  `;
}

/**
 * Returns the assembled edit-form sections markup.
 * 
 * @returns {string} Combined edit-form markup.
 */
function createEditFormSections() {
  return [
    createEditTitleSection(),
    createEditDescriptionSection(),
    createEditDueDateSection(),
    createEditPrioritySection(),
    createEditAssigneeSection(),
    createEditSubtaskSection(),
    createEditActionSection(),
  ].join("");
}

/** Returns the edit-task title section markup. */
function createEditTitleSection() {
  return `
    <div class="edit_title">
      <label>Title<span class="red_star">*</span></label>
      <input id="title" type="text" required class="input_style">
    </div>
  `;
}

/** Returns the edit-task description section markup. */
function createEditDescriptionSection() {
  return `
    <div class="edit_description">
      <label>Description</label>
      <textarea id="description" class="input_style"></textarea>
    </div>
  `;
}

/**
 * Returns the edit-task due-date picker section markup.
 * 
 * Reuses the same calendar structure as the add-task form.
 * 
 * @returns {string} Due-date section markup.
 */
function createEditDueDateSection() {
  return `
    <div
      class="edit_duedate due_date due_date_picker"
      data-due-date-picker>
      <label for="dueDate">
        Due Date<span class="red_star">*</span>
      </label>

      <div class="due_date_picker_field">
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
          aria-controls="dueDateMenu">

        <button
          type="button"
          class="due_date_icon"
          data-due-date-toggle="true"
          aria-label="Open due date calendar">
          <svg
            viewBox="0 0 24 24"
            fill="none">
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

        <section
          id="dueDateMenu"
          class="due_date_menu d_none"
          aria-label="Due date calendar">
          <div class="due_date_menu_header">
            <button
              type="button"
              class="due_date_nav_button"
              data-due-date-nav="-1">
              &#8249;
            </button>

            <span
              id="dueDateMonthLabel"
              class="due_date_month_label"></span>

            <button
              type="button"
              class="due_date_nav_button"
              data-due-date-nav="1">
              &#8250;
            </button>
          </div>

          <div class="due_date_weekdays">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div
            id="dueDateDays"
            class="due_date_days"></div>
        </section>
      </div>
    </div>
  `;
}

/** Returns the edit-task priority section markup. */
function createEditPrioritySection() {
  return `
    <div class="edit_priority">
      <p class="bold_font">Priority</p>
      <div class="priority_buttons">
        <button type="button" id="prio_urgent" data-priority="urgent">Urgent</button>
        <button type="button" id="prio_medium" data-priority="medium">Medium</button>
        <button type="button" id="prio_low" data-priority="low">Low</button>
      </div>
    </div>
  `;
}

/**
 * Returns the edit-task assignee section markup.
 * 
 * @returns {string} Assignee section markup.
 */
function createEditAssigneeSection() {
  return `
    <section class="edit_assigned_to">
      <label for="assignee">Assignee</label>
      <section class="assignee_dropdown">
        ${createAssigneeToggleButton()}
        ${createAssigneeDropdownMenu()}
        <section id="selectedContacts"></section>
      </section>
    </section>
  `;
}

/** Returns the assignee toggle button markup. */
function createAssigneeToggleButton() {
  return `
    <button
      type="button"
      id="assignee"
      class="assignee_toggle"
      data-assignee-toggle="true"
      aria-expanded="false"
      aria-controls="assigneeDropdownMenu">
      <span id="assigneeLabel">Select contacts to assign</span>
      <span class="assignee_arrow"><img src="../assets/icon/drop_down_arrow.svg" alt="Dropdown Arrow"></span>
    </button>
  `;
}

/** Returns the empty assignee dropdown menu markup. */
function createAssigneeDropdownMenu() {
  return `
    <section id="assigneeDropdownMenu" class="assignee_menu d_none"></section>
  `;
}

/**
 * Returns the edit-task subtask section markup.
 * 
 * @returns {string} Subtask section markup.
 */
function createEditSubtaskSection() {
  return `
    <section class="edit_subtasks subtask">
      <label for="subtask">Subtasks</label>
      <section class="subtask_input_wrapper">
        <input type="text" id="subtask" name="subtask" placeholder="Add new subtask">
        <div class="subtask_action_buttons">
          <button type="button" id="clearSubtaskButton" class="subtask_action_button" aria-label="Clear subtask input">
            <img src="../assets/icon/subtask_close.svg" alt="Clear subtask input">
          </button>
          <button type="button" id="addSubtaskButton" class="subtask_action_button" aria-label="Add subtask">
            <img src="../assets/icon/subtask_check.svg" alt="Add subtask">
          </button>
        </div>
      </section>
      <section id="subtaskList" class="subtask_list"></section>
    </section>
  `;
}

/** Returns the edit-task submit action section markup. */
function createEditActionSection() {
  return `
    <div class="edit_actions">
      <button type="submit">Ok ✓</button>
    </div>
  `;
}
