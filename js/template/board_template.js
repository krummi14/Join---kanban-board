import { getContactInitials } from "../addTaskForm.js";
// generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
export function generateTaskHTML(task) {
  return `
       <div class="task" onclick="openOverlay('${task.id}')" draggable="true" ondragstart="startDragging('${task.id}')">
        
        ${generateCategory(task)}
        ${generateTitle(task)}
        ${generateDescription(task)}
        ${generateProgress(task)}
        ${generateFooter(task)}

    </div>
  `;
}

function generateCategory(task) {
  return `
    <span class="task_category">
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
  return ["#ff7a00","#9327ff","#00c4cc","#1fd7c1","#ff5eb3","#6e52ff"][name.length % 6];
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
        <img src="assets/icon/edit.svg">
      </button>

      <button onclick="deleteTask('${task.id}')">
        <img src="assets/icon/delete.svg">
      </button>

    </div>
  `;
}

function generateOverlayHeader(task) {
  return `
    <div class="overlay_header">
      <span class="task_category">${task.type || "User Story"}</span>
      <button onclick="closeOverlay()">✕</button>
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
  `;
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

        <!-- CATEGORY (TOGGLE FIX) -->
        <div class="edit_category">
          <label>Category</label>

          <div class="category_dropdown">

            <button type="button"
                    id="categoryToggle"
                    data-category-toggle
                    onclick="toggleCategoryDropdown(event)">
              <span id="categoryLabel">Select task category</span>
            </button>

            <div id="categoryDropdownMenu"
                 class="dropdown_menu d_none"
                 onclick="event.stopPropagation()">
            </div>

          </div>

          <input type="hidden" id="category">
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