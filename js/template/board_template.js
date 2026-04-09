
// generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
function generateTaskHTML(task) {
  return `
    <div draggable="true" ondragstart="startDragging('${task.id}')" class="task">
        
      <span class="task_category">${task.type}</span>

        <span class="task_titel">${task.title}</span>
        <span class="task_description">${task.description || ""}</span>

        <div class="direction_priority_and_contacts">
            <div class="contact_initials">${task.initials}</div>
            <div class="priority_sign">${task.priorityIcon}</div>
        </div>

    </div>
  `;
}