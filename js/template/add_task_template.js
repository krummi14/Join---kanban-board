import {
  getContactColor,
  getContactInitials
} from "../addtask/contactUtils.js";


export function createSubtaskItem(st, index) {
  return `
    <section class="subtask_item">
      <span class="subtask_item_text">${st.title}</span>
      <div class="subtask_item_actions">
        ${createSubtaskActionButton("edit-subtask", index, "Edit subtask", "../assets/icon/subtask_edit.svg")}
        ${createSubtaskActionButton("remove-subtask", index, "Delete subtask", "../assets/icon/subtask_del.svg")}
      </div>
    </section>
  `;
}

export function createEditableSubtaskItem(st, index) {
  return `
    <section class="subtask_item editing">
      <div class="subtask_edit_input_wrapper">
        <input type="text" class="subtask_edit_input" data-edit-subtask-input="${index}" value="${escapeHtmlAttribute(st.title)}" aria-label="Edit subtask">
        <div class="subtask_item_actions">
          ${createSubtaskActionButton("cancel-subtask-edit", index, "Cancel subtask edit", "../assets/icon/subtask_del.svg")}
          ${createSubtaskActionButton("save-subtask-edit", index, "Save subtask edit", "../assets/icon/subtask_check.svg")}
        </div>
      </div>
    </section>
  `;
}

function createSubtaskActionButton(action, index, label, iconPath) {
  return `
    <button type="button" class="subtask_item_action_button" data-${action}="${index}" aria-label="${label}">
      <img src="${iconPath}" alt="${label}">
    </button>
  `;
}

function escapeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function createAssigneeOption(contact) {   //CHANGE 
  return `
    <label class="assignee_option" for="assignee_${contact.id}">
      ${createAssigneeOptionText(contact)}
      ${createAssigneeOptionCheckbox(contact.id)}
    </label>
  `;
}

function createAssigneeOptionText(contact) {
  return `
    <div class="assignee_option_text">
      <div class="avatar assignee_option_avatar" style="background:${getAssigneeColor(contact.name)}">
        ${getAssigneeInitials(contact.name)}
      </div>
      <div class="assignee_option_name">${contact.name}</div>
    </div>
  `;
}

function createAssigneeOptionCheckbox(contactId) {
  return `
    <span class="assignee_option_checkbox">
      <input type="checkbox" id="assignee_${contactId}" value="${contactId}" data-assignee-id="${contactId}">
      <img class="assignee_option_checkbox_icon assignee_option_checkbox_icon_unchecked" src="../assets/icon/assignee_unchecked.svg" alt="">
      <img class="assignee_option_checkbox_icon assignee_option_checkbox_icon_checked" src="../assets/icon/assignee_checked.svg" alt="">
    </span>
  `;
}
function getAssigneeInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAssigneeColor(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][String(name || "").length % 6];
}

export function createAddTaskFormTemplate(path) {
  return `
      <form id="taskForm">
        ${createAddTaskLeftForm()}
        <hr class="hr_add_task_none">
        ${createAddTaskRightForm(path)}
        ${createFormButtonsMobile(path)}
      </form>
  `;
}

function createAddTaskLeftForm() {
  return `
    <section class="left_form">
      ${createTitleSection()}
      ${createDescriptionSection()}
      ${createDueDateSection()}
      <p class="requiredNotice"><span>*</span>This field is required</p>
    </section>
  `;
}

function createTitleSection() {
  return `
    <section class="title">
      <label for="title">Title<span>*</span></label>
      <input type="text" id="title" name="title" placeholder="Enter a title" required>
    </section>
  `;
}

function createDescriptionSection() {
  return `
    <section class="description">
      <label for="description">Description</label>
      <textarea id="description" name="description" placeholder="Enter a description"></textarea>
    </section>
  `;
}

function createDueDateSection() {
  return `
    <section class="due_date due_date_picker" data-due-date-picker>
      <label for="dueDate">Due Date<span>*</span></label>
      <div class="due_date_picker_field">${createDueDateField()}${createDueDateMenu()}</div>
    </section>
  `;
}

function createDueDateField() {
  return `
    <input type="text" id="dueDate" name="dueDate" class="due_date_input" placeholder="dd/mm/yyyy" inputmode="numeric" autocomplete="off" required aria-haspopup="dialog" aria-expanded="false" aria-controls="dueDateMenu">
    <button type="button" class="due_date_icon" data-due-date-toggle="true" aria-label="Open due date calendar">${createDueDateIcon()}</button>
  `;
}

function createDueDateIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 3.5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M17 3.5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 9H20.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 13H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 13H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 13H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function createDueDateMenu() {
  return `
    <section id="dueDateMenu" class="due_date_menu d_none" aria-label="Due date calendar">
      ${createDueDateMenuHeader()}
      ${createDueDateWeekdays()}
      <div id="dueDateDays" class="due_date_days"></div>
    </section>
  `;
}

function createDueDateMenuHeader() {
  return `
    <div class="due_date_menu_header">
      <button type="button" class="due_date_nav_button" data-due-date-nav="-1" aria-label="Show previous month">&#8249;</button>
      <span id="dueDateMonthLabel" class="due_date_month_label"></span>
      <button type="button" class="due_date_nav_button" data-due-date-nav="1" aria-label="Show next month">&#8250;</button>
    </div>
  `;
}

function createDueDateWeekdays() {
  return `<div class="due_date_weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>`;
}

function createAddTaskRightForm(path) {
  return `
    <section class="right_form">
      ${createPrioritySection()}
      ${createAssigneeSection()}
      ${createCategorySection()}
      ${createSubtaskSection()}
      ${createFormButtons(path)}
      <p class="requiredNotice_mobile"><span>*</span>This field is required</p>
    </section>
  `;
}

function createPrioritySection() {
  return `
    <section class="priority">
      <label for="priority">Priority</label>
      <section id="priority">${createPriorityButtons()}</section>
    </section>
  `;
}

function createPriorityButtons() {
  return [
    createPriorityButton("urgent", "Urgent", "btn_urgent_off.svg", "Button Urgent"),
    createPriorityButton("medium", "Medium", "btn_medium_off.svg", "Button Medium"),
    createPriorityButton("low", "Low", "btn_low_off.svg", "Button Low"),
  ].join("");
}

function createPriorityButton(priority, label, iconName, altText) {
  return `<button type="button" id="prio_${priority}" data-priority="${priority}">${label} <img src="../assets/icon/${iconName}" alt="${altText}"></button>`;
}

function createAssigneeSection() {
  return `
    <section class="assignee">
      <label for="assignee">Assignee</label>
      <section class="assignee_dropdown">${createAssigneeToggle()}<section id="assigneeDropdownMenu" class="assignee_menu"></section><section id="selectedContacts"></section></section>
    </section>
  `;
}

function createAssigneeToggle() {
  return `
    <button type="button" id="assignee" class="assignee_toggle" data-assignee-toggle="true" aria-expanded="false" aria-controls="assigneeDropdownMenu">
      <span id="assigneeLabel">Select contacts to assign</span>
      <span class="assignee_arrow"><img src="../assets/icon/drop_down_arrow.svg" alt="Dropdown Arrow"></span>
    </button>
  `;
}

function createCategorySection() {
  return `
    <section class="category">
      <label for="category">Category<span>*</span></label>
      <section class="category_dropdown">${createCategoryToggle()}${createCategoryMenu()}</section>
    </section>
  `;
}

function createCategoryToggle() {
  return `
    <input type="hidden" name="category" id="category" value="">
    <button type="button" id="categoryToggle" class="category_toggle" data-category-toggle="true" aria-expanded="false" aria-controls="categoryDropdownMenu">
      <span id="categoryLabel">Select task category</span>
      <span class="category_arrow"><img src="../assets/icon/drop_down_arrow.svg" alt="Dropdown Arrow"></span>
    </button>
  `;
}

function createCategoryMenu() {
  return `
    <section id="categoryDropdownMenu" class="category_menu">
      <button type="button" class="category_option" data-category-value="Technical Task">Technical Task</button>
      <button type="button" class="category_option" data-category-value="User Story">User Story</button>
    </section>
  `;
}

function createSubtaskSection() {
  return `
    <section class="subtask">
      <label for="subtask">Subtasks</label>
      <section class="subtask_input_wrapper">${createSubtaskInput()}${createSubtaskButtons()}</section>
      <section id="subtaskList" class="subtask_list"></section>
    </section>
  `;
}

function createSubtaskInput() {
  return `<input type="text" id="subtask" name="subtask" placeholder="Add new subtask">`;
}

function createSubtaskButtons() {
  return `
    <div class="subtask_action_buttons">
      <button type="button" id="clearSubtaskButton" class="subtask_action_button" aria-label="Clear subtask input"><img src="../assets/icon/subtask_close.svg" alt="Clear subtask input"></button>
      <button type="button" id="addSubtaskButton" class="subtask_action_button" aria-label="Add subtask"><img src="../assets/icon/subtask_check.svg" alt="Add subtask"></button>
    </div>
  `;
}

function createFormButtons(path) {
  return `
    <section class="form_buttons">
      <button class="button_basic_characteristics clear_btn" type="reset">Clear &#x78;</button>
      <button id="createTask" class="button_basic_characteristics create_btn" type="submit" value="${path}">Create Task &#x2713;</button>
    </section>
  `;
}

function createFormButtonsMobile(path) {
  return `
    <section class="form_buttons_mobile">
      <button class="button_basic_characteristics clear_btn" type="reset">Clear &#x78;</button>
      <button id="createTask" class="button_basic_characteristics create_btn" type="submit" value="${path}">Create Task &#x2713;</button>
    </section>
  `;
}

export function createSelectedAssigneeAvatar(
  contact
) {
  return `
    <div
      class="avatar selected_assignee_avatar"
      title="${contact.name}"
      style="background:${getContactColor(contact.name)}">

      ${getContactInitials(contact.name)}

    </div>
  `;
}

export function createAssigneeLoadError() {

  return `
    <div class="assignee_status">
      Can not load contacts.
    </div>
  `;
}

export function createAssigneeEmptyState() {

  return `
    <div class="assignee_status">
      No contacts available.
    </div>
  `;
}



function getCategoryOptionTemplate(category) {
  return `
    <div class="dropdown_item" data-category-value="${category}">
      ${category}
    </div>
  `;
}

window.getCategoryOptionTemplate = getCategoryOptionTemplate;

window.createAddTaskFormTemplate = createAddTaskFormTemplate;