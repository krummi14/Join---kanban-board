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

  tasks = Object.entries(data).map(([id, task]) => {
    const prepared = prepareTask(task);
    console.log("PRIORITY DEBUG:", task.priority, prepared.priorityIcon); // 👈 HIER
    return {
      id,
      ...prepared,

      // Status normalisieren
      status: normalizeCategory(task.status),

      // Icons separat (falls du sie extra willst)
      priorityIcon: getPriorityIcon(task.priority),
    };
  });

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
  if (priority === "urgent") return "../assets/img/urgent_icon.svg";
  if (priority === "medium") return "../assets/img/medium_icon.svg";
  if (priority === "low") return "../assets/img/low_icon.svg";
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

function generateAvatarHTML(assignees) {
  let visible = assignees.slice(0, 3);
  let rest = assignees.length - 3;

  let html = "";

  for (let i = 0; i < visible.length; i++) {
    html += generateSingleAvatar(visible[i]);
  }

  if (rest > 0) {
    html += generateExtraAvatar(rest);
  }

  return html;
}

function prepareTask(task) {
  return {
    ...task,

    doneSubtasks: task.subtasks?.filter(st => st.done).length || 0,
    totalSubtasks: task.subtasks?.length || 0,

    progress: task.subtasks?.length
      ? (task.subtasks.filter(st => st.done).length / task.subtasks.length) * 100
      : 0,

    avatarHTML: generateAvatarHTML(task.assignees || []),
    priorityIcon: getPriorityIcon(task.priority)
    
  };
}

// overlay
function openOverlay(taskId) {
  const task = tasks.find(t => t.id === taskId);

  if (!task) return; // 🔥 wichtig

  const overlay = document.getElementById("overlay");

  overlay.innerHTML = generateTaskOverlay(task);
  overlay.classList.remove("hidden");
}

function closeOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}

function generateAssigneesContent(task) {
  let html = "";

  if (!task.assignees) return "";

  for (let i = 0; i < task.assignees.length; i++) {
    html += generateAssignee(task.assignees[i]);
  }

  return html;
}

function generateSubtasksContent(task) {
  let html = "";

  if (!task.subtasks) return "";

  for (let i = 0; i < task.subtasks.length; i++) {
    html += generateSubtask(task, task.subtasks[i], i);
  }

  return html;
}

function formatDate(dateString) {
  if (!dateString) return "";

  // falls schon richtig formatiert (15/02/2026)
  if (dateString.includes("/")) return dateString;

  const date = new Date(dateString);

  if (isNaN(date)) return dateString; // fallback

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// 🌍 GLOBAL EXPORTS
window.initBoard = initBoard;
window.startDragging = startDragging;
window.allowDrop = allowDrop;
window.moveTo = moveTo;
window.highlight = highlight;
window.removeHighlight = removeHighlight;
window.getContactInitials = getContactInitials;


window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;
window.generateAssigneesContent = generateAssigneesContent;
window.generateSubtasksContent = generateSubtasksContent;
window.formatDate = formatDate;