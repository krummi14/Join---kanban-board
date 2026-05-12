import { getContactInitials } from "../addtask/addTaskForm.js";
// generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
export function generateTaskHTML(task) {
  return `
    <div class="task" onclick="openOverlay('${task.id}')" draggable="true" ondragstart="startDragging('${task.id}')">

      ${generateCategory(task)}
      ${generateTitle(task)}
      ${generateDescription(task)}

      <div class="task_bottom">

        <div class="task_left">
          ${generateProgress(task)}
          ${generateFooter(task)}
        </div>

        <div class="task_right">
   
        </div>

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

      ${generateOverlayHeader(task)}

      ${generateOverlayTitle(task)}
      ${generateOverlayDescription(task)}
      ${generateOverlayDueDate(task)}
      ${generateOverlayPriority(task)}
      ${generateOverlayAssignees(task)}
      ${generateSubtasksWrapper(generateSubtasksContent(task))}

      ${generateOverlayActions(task)} 

    </div>
  `;
}

function generateOverlayActions(task) {
  return `
    <div class="overlay_actions">

      <button onclick="editTask('${task.id}')">
        <img src="/assets/icon/subtask_edit.svg">
      </button>

      <button onclick="deleteTask('${task.id}')">
        <img src="/assets/icon/subtask_del.svg">
      </button>

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

      <div class="avatar"
           style="background:${getColorFromName(a.name)}">
        ${getContactInitials(a.name)}
      </div>

      <span>${a.name}</span>

    </div>
  `;
}


function generateSubtasksWrapper(content) {
  return `
    <div class="task_subtasks">
      <h3>Subtasks</h3>
      ${content}
    </div>
  `
}

//Form id="taskForm"
export function getDialogAddTaskTemplate(path) {
  return `
        <dialog onclick="closeAddNewTaskDialog()" id="addTask_dialog" class="addTask_dialog_content dialog_closed">
          <div class="addTask_dialog_direction" onclick="closeDialogOnBodyclick(event)">
            <section class="main_header main_addTask_dialog_header">
              <h1>Add Task</h1>
              <div class="contact_dialog_close_button_direction">
                <button class="close_button" onclick="closeAddNewTaskDialog()">X</button>
              </div>
            </section>
            <form  class="taskForm_dialog">
              <div class="taskForm_maxHeight">
                <div class="left_side_gap">
                  <section class="left_form">
                    <section class="title">
                      <label for="title">Title<span>*</span></label>
                      <input type="text" id="title" name="title" placeholder="Enter a title" required>
                    </section>
                    <section class="description">
                      <label for="description">Description</label>
                      <textarea id="description" name="description" placeholder="Enter a description"></textarea>
                    </section>
                    <section class="due_date due_date_picker" data-due-date-picker>
                      <label for="dueDate">Due Date<span>*</span></label>
                      <div class="due_date_picker_field">
                        <input type="text" id="dueDate" name="dueDate" class="due_date_input" placeholder="dd/mm/yyyy" inputmode="numeric" autocomplete="off" required aria-haspopup="dialog" aria-expanded="false" aria-controls="dueDateMenu">
                        <button type="button" class="due_date_icon" data-due-date-toggle="true" aria-label="Open due date calendar">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 3.5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M17 3.5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M3.5 9H20.5" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M8 13H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M12 13H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M16 13H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                        <section id="dueDateMenu" class="due_date_menu d_none" aria-label="Due date calendar">
                          <div class="due_date_menu_header">
                            <button type="button" class="due_date_nav_button" data-due-date-nav="-1" aria-label="Show previous month">&#8249;</button>
                            <span id="dueDateMonthLabel" class="due_date_month_label"></span>
                            <button type="button" class="due_date_nav_button" data-due-date-nav="1" aria-label="Show next month">&#8250;</button>
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
                          <div id="dueDateDays" class="due_date_days"></div>
                        </section>
                      </div>
                    </section>
                  </section>
                  <p class="requiredNotice"><span>*</span>This field is required</p>
                </div>
                <div class="hr_add_task"></div>
                <div class="rigth_side_gap">
                  <section class="right_form">
                    <section class="priority">
                      <label for="priority">Priority</label>
                      <section id="priority">
                        <button type="button" id="prio_urgent" data-priority="urgent">Urgent <img src="../assets/icon/btn_urgent_off.svg" alt="Button Urgent"></button>
                        <button type="button" id="prio_medium" data-priority="medium">Medium <img src="../assets/icon/btn_medium_off.svg" alt="Button Medium"></button>
                        <button type="button" id="prio_low" data-priority="low">Low <img src="../assets/icon/btn_low_off.svg" alt="Button Low"></button>
                      </section>
                    </section>
                    <section class="assignee">
                      <label for="assignee">Assignee</label>
                      <section class="assignee_dropdown">
                        <button type="button" id="assignee" class="assignee_toggle" data-assignee-toggle="true" aria-expanded="false" aria-controls="assigneeDropdownMenu">
                          <span id="assigneeLabel">Select contacts to assign</span>
                          <span class="assignee_arrow"><img src="../assets/icon/drop_down_arrow.svg" alt="Dropdown Arrow"></span>
                        </button>
                        <section id="assigneeDropdownMenu" class="assignee_menu"></section>
                        <section id="selectedContacts"></section>
                      </section>
                    </section>
                  <section class="category">
                    <label for="category">Category<span>*</span></label>
                    <section class="category_dropdown">
                      <input type="hidden" name="category" id="category" value="">
                      <button type="button" id="categoryToggle" class="category_toggle" data-category-toggle="true" aria-expanded="false" aria-controls="categoryDropdownMenu">
                        <span id="categoryLabel">Select task category</span>
                        <span class="category_arrow"><img src="../assets/icon/drop_down_arrow.svg" alt="Dropdown Arrow"></span>
                      </button>
                      <section id="categoryDropdownMenu" class="category_menu">
                        <button type="button" class="category_option" data-category-value="Technical Task">Technical Task</button>
                        <button type="button" class="category_option" data-category-value="User Story">User Story</button>
                      </section>
                    </section>
                  </section>
                  <section class="subtask">
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

                  <p class="requiredNotice_mobile"><span>*</span>This field is required</p>

                </section>
                <section class="form_buttons">
                  <button class="button_basic_characteristics clear_btn" type="reset">Clear &#x78;</button>
                  <button id="createTask" class="button_basic_characteristics create_btn" type="submit" value="${path}">Create Task &#x2713;</button>
                </section>
              </div>
            </div>
          </form>
        </div>
      </dialog>
      `
}



export function generateSubtask(task, st, i) {
  return `
    <label class="subtask_item">

      <input type="checkbox"
             ${st.done ? "checked" : ""}
             onchange="toggleSubtask('${task.id}', ${i})">

      <span>${st.title}</span>

    </label>
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


/*
export function createEditTaskTemplate() {
return ` <div class="edit_overlay">
  <div class="edit_header">
    <h2>Edit Task</h2>
    <button type="button" onclick="closeOverlay()">✕</button>
  </div>

  <form id="taskForm" class="edit_form">

    <!-- TITLE -->
    <label>Title*</label>
    <input id="title" type="text" required>

    <!-- DESCRIPTION -->
    <label>Description</label>
    <textarea id="description"></textarea>

    <!-- DUE DATE -->
    <label>Due Date*</label>
    <input id="dueDate" type="date" required>

    <!-- PRIORITY -->
    <label>Priority</label>
    <div class="priority_buttons">
      <button type="button" id="prio_urgent" data-priority="urgent">Urgent</button>
      <button type="button" id="prio_medium" data-priority="medium">Medium</button>
      <button type="button" id="prio_low" data-priority="low">Low</button>
    </div>

    <!-- ASSIGNEES -->
    <label>Assigned to</label>
    <div class="assignee_dropdown">
      <button type="button" id="assignee" data-assignee-toggle>Select contacts</button>
      <div id="assigneeDropdownMenu" class="dropdown_menu"></div>
    </div>

    <div id="selectedContacts"></div>

    <!-- CATEGORY -->
    <label>Category</label>
    <div class="category_dropdown">
      <button type="button" id="categoryToggle" data-category-toggle>
        <span id="categoryLabel">Select task category</span>
      </button>
      <div id="categoryDropdownMenu" class="dropdown_menu"></div>
    </div>

    <!-- hidden input für save -->
    <input type="hidden" id="category">

    <!-- SUBTASKS -->
    <label>Subtasks</label>
    <div class="subtask_input_wrapper">
      <input id="subtask" type="text" placeholder="Add new subtask">
      <button type="button" id="addSubtaskButton">+</button>
    </div>

    <div id="subtaskList"></div>

    <!-- ACTION -->
    <div class="edit_actions">
      <button type="submit">Ok ✓</button>
    </div>

  </form>
</div>


`;
}

*/

export function createEditTaskTemplate() {
  return `
  <div class="edit_overlay">

    <!-- CLOSE -->
    <div class="close_button">
      <div class="close_icon_wrapper close_icon_margin">
        <img src="assets/img/close.svg"
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
        <div class="edit_duedate">
          <label>Due Date<span class="red_star">*</span></label>
          <input id="dueDate" type="date" required class="input_style">
        </div>

        <!-- PRIORITY -->
        <div class="edit_priority">
          <p class="bold_font">Priority</p>
          <div class="priority_buttons">

            <button type="button" id="prio_urgent" data-priority="urgent">Urgent</button>
            <button type="button" id="prio_medium" data-priority="medium">Medium</button>
            <button type="button" id="prio_low" data-priority="low">Low</button>

          </div>
        </div>

        <!-- ASSIGNEES (TOGGLE FIX) -->
        <div class="edit_assigned_to">
          <label>Assigned to</label>

          <div class="assignee_dropdown">

            <button type="button"
                    id="assignee"
                    data-assignee-toggle
                    onclick="toggleAssigneeDropdown(event)">
              Select contacts
            </button>

            <div id="assigneeDropdownMenu"
                 class="dropdown_menu d_none"
                 onclick="event.stopPropagation()">
            </div>

          </div>

          <!-- Avatare wie Board -->
          <div id="selectedContacts" class="avatar_row"></div>
        </div>

     

        <!-- SUBTASKS (HOVER STYLE FIX) -->
        <div class="edit_subtasks">
          <label>Subtasks</label>

          <div class="subtask_input_wrapper">

            <input id="subtask"
                   type="text"
                   placeholder="Add new subtask">

            <button type="button" id="addSubtaskButton">+</button>

          </div>

          <div id="subtaskList"></div>
        </div>

        <!-- ACTION -->
        <div class="edit_actions">
          <button type="submit">Ok ✓</button>
        </div>

      </form>

    </div>
  </div>
  `;
}