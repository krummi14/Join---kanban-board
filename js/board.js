// Beispiel tasks (sollten später aus der BaaS/ Firebase in das leere Array tasks geschrieben werden)
let tasks = [{
    'id': 0,
    'title': 'Putzen',
    'category': 'to do'
}, {
    'id': 1,
    'title': 'Kochen',
    'category': 'in progress'
}, {
    'id': 2,
    'title': 'Einkaufen',
    'category': 'in progress'
}, {
    'id': 3,
    'title': 'Schlafen',
    'category': 'await feedback'
}, {
    'id': 4,
    'title': 'Saugen',
    'category': 'done'
}];

// Variable für aktuelles Drag-Element
let currentDraggedElement;

function initBoard() {
    userInitials();
    updateHTML();
}

function filterAndCreateWorkflowarray(category, taskID) {
    // Filter das Array und sucht alle Tasks, die eine gleiche categrory haben 
    // und fügt sie in das workflowArray toDo hinzu
    let workflowArray = tasks.filter(t => t['category'] == category);
    // Div Container leeren und alle Elemente dem workflowArray
    document.getElementById(taskID).innerHTML = '';
    if (workflowArray.length == 0) {
        document.getElementById(taskID).innerHTML = '<p class="no_task_text"> No tasks ' + category + '</p>'
    } else {
        // Elemente zu workflowArray hinzufügen
        for (let index = 0; index < workflowArray.length; index++) {
            const taskElement = workflowArray[index];
            // generate Template generateTaskHTML: dynamisches HTML wird in eine Template generiert!
            document.getElementById(taskID).innerHTML += generateTaskHTML(taskElement);
        }
    }
}

function updateHTML() {
    filterAndCreateWorkflowarray('to do', 'to_do');
    filterAndCreateWorkflowarray('in progress', 'in_progress');
    filterAndCreateWorkflowarray('await feedback', 'await_feedback');
    filterAndCreateWorkflowarray('done', 'done');
}

// übergibt dem currentDraggedlement die Id des bewegten Elements
function startDragging(id) {
    currentDraggedElement = id;
}

// erlaubt dem Div Container das Element abzuwerfen
function allowDrop(ev) {
    ev.preventDefault();
}

// z.B. Task mit der id 1: Das Feld "category" ändert sich zu 'to do' oder 'in prograss'
function moveTo(category) {
    tasks[currentDraggedElement]['category'] = category;
    // damit dieser Verschiebe-Vorgang im HTML zu sehen ist: updateHTML() Methode hier aufruden
    updateHTML();
}

// Nice to have: Klasse hinzufügen wenn die Elemente über dem Div Container liegen
function highlight(id) {
    document.getElementById(id).classList.add('drag-area-highlight');
}
// Nice to have: Klasse removen wenn die Elemente den Div Container verlassen (gegen Funktion für highlight(id))
function removeHighlight(id) {
    document.getElementById(id).classList.remove('drag-area-highlight');
}