// generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
function generateTaskHTML(taskElement) {
    return `<div draggable="true" ondragstart="startDragging(${taskElement['id']})" class="task">
                <span class="task_category">Add Task_Category</span>
                <span class="task_titel">Add Task_Title</span>
                <span class="task_description"> Add Task_description blablalbablabla Hier kommt die Beschreibung!</span>
                <div class="direction_priority_and_contacts">
                    <div class="contact_initials">AS DE EF</div>
                    <div class="priority_sign">=</div>
                </div>

            </div>
            `;
}