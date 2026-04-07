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