function createSubtaskItem(st, index) {     
  return `
    <section class="subtask_item">
      <span class="subtask_item_text">${st.title}</span>
      <button type="button"
        class="subtask_remove_button"
        data-remove-subtask="${index}">
        ×
      </button>
    </section>
  `;
}
//Geändert ! 

function createAssigneeOption(contact) {
  return `
    <label class="assignee_option" for="assignee_${contact.id}">
      <div class="assignee_option_text">
        <div class="avatar assignee_option_avatar" style="background:${getAssigneeColor(contact.name)}">${getAssigneeInitials(contact.name)}</div>
        <div class="assignee_option_name">${contact.name}</div>
      </div>
      <span class="assignee_option_checkbox">
        <input type="checkbox" id="assignee_${contact.id}" value="${contact.id}" data-assignee-id="${contact.id}">
        <img class="assignee_option_checkbox_icon assignee_option_checkbox_icon_unchecked" src="../assets/icon/assignee_unchecked.svg" alt="">
        <img class="assignee_option_checkbox_icon assignee_option_checkbox_icon_checked" src="../assets/icon/assignee_checked.svg" alt="">
      </span>
    </label>
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

function createAddTaskFormTemplate(path) {
  return`
        <form id="taskForm">
        <section class="left_form">
          <section class="title">
            <label for="title">Title<span>*</span></label>
            <input type="text" id="title" name="title" placeholder="Enter a title" required>
          </section>

          <section class="description">
            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Enter a description"></textarea>
          </section>

          <section class="due_date">
            <label for="dueDate">Due Date<span>*</span></label>
            <input type="date" id="dueDate" name="dueDate" required>
          </section>
        </section>

        <hr>

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
              <button type="button" id="addSubtaskButton" class="subtask_add_button" aria-label="Add subtask">
                <img src="../assets/icon/done.svg" alt="Add subtask">
              </button>
            </section>
            <section id="subtaskList" class="subtask_list"></section>
          </section>

          <section class="form_buttons">
            <button class="button_basic_characteristics clear_btn" type="reset">Clear &#x78;</button>
            <button id="createTask" class="button_basic_characteristics create_btn" type="submit" value="${path}">Create Task &#x2713;</button>
          </section>
        </section>
      </form>
  `
};