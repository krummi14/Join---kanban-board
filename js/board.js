import { getData, putUserData } from "./firebase.js";

let tasks = [];
let currentDraggedElement;

// 🚀 INIT
function initBoard() {
    userInitials();
    loadTasks();
}

// 📥 LOAD FROM FIREBASE
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

    // 🔥 WICHTIG: STATUS normalisieren
    status: normalizeCategory(task.status),

    initials: getAssigneesInitials(task),
    priorityIcon: getPriorityIcon(task.priority),
  }));

  console.log("TASKS FROM FIREBASE:", tasks);

  updateHTML();
}

// 🔧 CATEGORY NORMALIZER
function normalizeCategory(category) {
    return String(category || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " "); // entfernt doppelte Spaces
}

// 🔍 FILTER + RENDER
function filterAndCreateWorkflowarray(category, taskID) {
    console.log("CATEGORY:", `"${category}"`);

    let workflowArray = tasks.filter(t => 
          normalizeCategory(t.status) === normalizeCategory(category)
    );

    console.log("MATCHED:", workflowArray);

    const container = document.getElementById(taskID);
    container.innerHTML = '';

    if (workflowArray.length === 0) {
        container.innerHTML = `<p class="no_task_text">No tasks ${category}</p>`;
        return;
    }

    for (let task of workflowArray) {
        container.innerHTML += generateTaskHTML(task);
    }
}

// 🔄 UPDATE BOARD
function updateHTML() {
    filterAndCreateWorkflowarray('to do', 'to_do');
    filterAndCreateWorkflowarray('in progress', 'in_progress');
    filterAndCreateWorkflowarray('await feedback', 'await_feedback');
    filterAndCreateWorkflowarray('done', 'done');
}

// 👤 ASSIGNEES INITIALS
function getAssigneesInitials(task) {
    if (!task.assignees) return "";

    return task.assignees
        .map(a => getContactInitials(a.name))
        .join(" ");
}

// ✍️ INITIALS HELPER
function getContactInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ⚡ PRIORITY ICON
function getPriorityIcon(priority) {
    if (priority === "urgent") return "///";
    if (priority === "medium") return "/";
    if (priority === "low") return "/";
    return "";
}

// 🖱️ DRAG START
function startDragging(id) {
    currentDraggedElement = id;
}

// 🧱 ALLOW DROP
function allowDrop(ev) {
    ev.preventDefault();
}

// 🔄 MOVE + FIREBASE SYNC
async function moveTo(category) {
  const task = tasks.find(t => t.id == currentDraggedElement);

  if (task) {
    // 🔥 WICHTIG: status ändern
    task.status = category;

    await putUserData(`tasks/${task.id}`, task);
  }

  updateHTML();
}

// ✨ HIGHLIGHT
function highlight(id) {
    document.getElementById(id).classList.add('drag-area-highlight');
}

// ❌ REMOVE HIGHLIGHT
function removeHighlight(id) {
    document.getElementById(id).classList.remove('drag-area-highlight');
}

// 🌍 GLOBAL EXPORTS
window.initBoard = initBoard;
window.startDragging = startDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;
window.highlight = highlight;
window.removeHighlight = removeHighlight;