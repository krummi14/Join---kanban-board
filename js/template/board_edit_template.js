export function createEditTaskTemplate() {
  return `
  <div class="edit_overlay">
    ${createEditCloseButton()}
    <div class="scroll-area">
      <form id="taskForm" class="edit_form">
        ${createEditFormSections()}
      </form>
    </div>
  </div>
  `;
}

function createEditCloseButton() {
  return `
    <div class="close_button">
      <div class="close_icon_wrapper close_icon_margin">
        <img src="assets/img/close.svg" class="close_icon" onclick="closeOverlay()">
      </div>
    </div>
  `;
}

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

function createEditTitleSection() {
  return `
    <div class="edit_title">
      <label>Title<span class="red_star">*</span></label>
      <input id="title" type="text" required class="input_style">
    </div>
  `;
}

function createEditDescriptionSection() {
  return `
    <div class="edit_description">
      <label>Description</label>
      <textarea id="description" class="input_style"></textarea>
    </div>
  `;
}

function createEditDueDateSection() {
  return `
    <div class="edit_duedate">
      <label>Due Date<span class="red_star">*</span></label>
      <input id="dueDate" type="date" required class="input_style">
    </div>
  `;
}

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

function createEditAssigneeSection() {
  return `
    <div class="edit_assigned_to">
      <label>Assigned to</label>
      <div class="assignee_dropdown">
        ${createAssigneeToggleButton()}
        ${createAssigneeDropdownMenu()}
      </div>
      <div id="selectedContacts" class="avatar_row"></div>
    </div>
  `;
}

function createAssigneeToggleButton() {
  return `
    <button type="button" id="assignee" data-assignee-toggle onclick="toggleAssigneeDropdown(event)">
      Select contacts
    </button>
  `;
}

function createAssigneeDropdownMenu() {
  return `
    <div id="assigneeDropdownMenu" class="dropdown_menu d_none" onclick="event.stopPropagation()">
    </div>
  `;
}

function createEditSubtaskSection() {
  return `
    <div class="edit_subtasks">
      <label>Subtasks</label>
      <div class="subtask_input_wrapper">
        <input id="subtask" type="text" placeholder="Add new subtask">
        <button type="button" id="addSubtaskButton">+</button>
      </div>
      <div id="subtaskList"></div>
    </div>
  `;
}

function createEditActionSection() {
  return `
    <div class="edit_actions">
      <button type="submit">Ok ✓</button>
    </div>
  `;
}
