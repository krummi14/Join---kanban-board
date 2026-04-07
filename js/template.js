function createAssigneeOption(contact) {
    return `
    <label class="assignee_option" for="assignee_${contact.id}">
      <span class="assignee_option_text">
        <span class="assignee_option_name">${contact.name}</span>
      </span>
      <input type="checkbox" id="assignee_${contact.id}" value="${contact.id}" onchange="toggleAssigneeSelection('${contact.id}')">
    </label>
  `;
}

function createSubtaskItem(subtaskTitle, index) {
    return `
    <section class="subtask_item">
      <span class="subtask_item_text">${subtaskTitle}</span>
      <button type="button" class="subtask_remove_button" aria-label="Remove subtask ${subtaskTitle}" onclick="removeSubtask(${index})">×</button>
    </section>
  `;
}