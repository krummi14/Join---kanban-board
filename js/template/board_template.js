// generate Template generateTodoHTML: dynamisches HTML wird in eine Template generiert!
// Div Container draggable="true" setzen, damit sie verschoben werden können
// Div Container die ondragstart Methode hinzufügen (wie onclick) hier: startDragging()
function generateTaskHTML(element) {
    return `<div draggable="true" ondragstart="startDragging(${element['id']})" class="todo">${element['title']}</div>`;
}