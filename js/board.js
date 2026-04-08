import { getData } from "./firebase.js";

let tasks = [];
let currentDraggedElement;


function initBoard() {
    userInitials();
    loadTasks(); // 🔥 lädt Tasks aus Firebase! statt updateHTML
}

async function loadTasks() {
    const data = await getData("tasks");

    if (!data) {
        tasks = [];
        updateHTML();
        return;
    }

    tasks = Object.entries(data).map(([id, task]) => ({
      id,
    ...task,
    initials: getAssigneesInitials(task),
    priorityIcon: getPriorityIcon(task.priority)
    }));

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


//Assignees Initials
function getAssigneesInitials(task) {
    if (!task.assignees) return "";

    return task.assignees
        .map(a => getContactInitials(a.name))
        .join(" ");
}

// Initialen berechnen
function getContactInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ⚡ Priority anzeigen
function getPriorityIcon(priority) {
    if (priority === "urgent") return "///";
    if (priority === "medium") return "/";
    if (priority === "low") return "/";
    return "";
}

// übergibt dem currentDraggedlement die Id des bewegten Elements
function startDragging(id) {
    currentDraggedElement = id;
}

// erlaubt dem Div Container das Element abzuwerfen
function allowDrop(ev) {
    ev.preventDefault();
}

function moveTo(category) {
    const task = tasks.find(t => t.id == currentDraggedElement);

    if (task) {
        task.category = category;
    }

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


window.initBoard = initBoard;
window.startDragging = startDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;
window.highlight = highlight;
window.removeHighlight = removeHighlight;