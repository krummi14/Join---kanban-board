
// generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
function generateTaskHTML(task) {
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

function generateSingleAvatar(assignee) {
  return `
    <div class="avatar" style="background:${getColorFromName(assignee.name)}">
      ${getContactInitials(assignee.name)}
    </div>
  `;
}

function generateExtraAvatar(rest) {
  return `
    <div class="avatar" style="background:#2a3647">
      +${rest}
    </div>
  `;
}

function getColorFromName(name) {
  return ["#ff7a00","#9327ff","#00c4cc","#1fd7c1","#ff5eb3","#6e52ff"][name.length % 6];
}

function getNoAssigneesCardTemplate() {
  return `<span class="no_assignees">No Users assigned</span>`;
}

/*overlay*/ 

function generateTaskOverlay(task) {
  return `
    <div class="task_overlay">

      ${generateOverlayHeader(task)}

      ${generateOverlayTitle(task)}
      ${generateOverlayDescription(task)}
      ${generateOverlayDueDate(task)}
      ${generateOverlayPriority(task)}
      ${generateOverlayAssignees(task)}
      ${generateSubtasksWrapper(generateSubtasksContent(task))}

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

function generateAssignee(a) {
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



function generateSubtask(task, st, i) {
  return `
    <label class="subtask_item">

      <input type="checkbox"
             ${st.done ? "checked" : ""}
             onchange="toggleSubtask('${task.id}', ${i})">

      <span>${st.title}</span>

    </label>
  `;
}


function getNoSubtasksTemplate() {
  return `<p>No subtasks yet</p>`;
}


function getNoAssigneesTemplate() {
  return `<p>No Users assigned</p>`;
}


function getAssigneeTemplate(a, isYou) {
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

