import { deleteData, getData, putUserData } from "./firebase.js";
import { normalizeCategory } from "./assets.js";


let tasks = [];
let currentDraggedElement;



const BOARD_COLUMNS = [
  { path: "to_do", label: "to do", containerId: "to_do" },
  { path: "in_progress", label: "in progress", containerId: "in_progress" },
  { path: "await_feedback", label: "await feedback", containerId: "await_feedback" },
  { path: "done", label: "done", containerId: "done" },
];

// 🚀 INIT
function initBoard() {
    if (typeof window.userInitials === "function") {
      window.userInitials();
    }

    loadTasks();
}

// 📥 LOAD FROM FIREBASE
async function loadTasks() {
  const columnData = await Promise.all(
    BOARD_COLUMNS.map((column) => getData(column.path))
  );

  tasks = BOARD_COLUMNS.flatMap((column, index) => {
    const data = columnData[index];

    if (!data) {
      return [];
    }

    return Object.entries(data).map(([id, task]) => ({
      id,
      ...prepareTask(task),
      status: column.path,
      sourcePath: column.path,
      priorityIcon: getPriorityIcon(task.priority),
    }));
  });

  updateHTML();
}

function getBoardColumn(category) {
  return BOARD_COLUMNS.find((column) => normalizeCategory(column.path) === normalizeCategory(category));
}

// 🔍 FILTER + RENDER
function filterAndCreateWorkflowarray(category) {
  const column = getBoardColumn(category);
  if (!column) return;

  let workflowArray = tasks.filter(t => 
      normalizeCategory(t.sourcePath || t.status) === normalizeCategory(column.path)
  );

  const container = document.getElementById(column.containerId);
    container.innerHTML = '';

    if (workflowArray.length === 0) {
    container.innerHTML = `<p class="no_task_text">No tasks ${column.label}</p>`;
        return;
    }

    for (let task of workflowArray) {
        container.innerHTML += generateTaskHTML(task);
    }
}

// 🔄 UPDATE BOARD
function updateHTML() {
  BOARD_COLUMNS.forEach((column) => filterAndCreateWorkflowarray(column.path));
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
  const targetColumn = getBoardColumn(category);

  if (!task || !targetColumn) {
    return;
  }

  if ((task.sourcePath || task.status) === targetColumn.path) {
    updateHTML();
    return;
  }

  const previousPath = task.sourcePath || task.status;
  const updatedTask = getTaskForStorage(task, targetColumn.path);

  await putUserData(`${targetColumn.path}/${task.id}`, updatedTask);
  await deleteData(`${previousPath}/${task.id}`);

  await loadTasks();
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

function getTaskForStorage(task, status) {
  const { doneSubtasks, totalSubtasks, progress, avatarHTML, priorityIcon, sourcePath, ...taskData } = task;
  return {
    ...taskData,
    status,
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

window.toggleSubtask = async function(taskId, index) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.subtasks[index].done = !task.subtasks[index].done;

  task.doneSubtasks = task.subtasks.filter(st => st.done).length;
  task.totalSubtasks = task.subtasks.length;

  task.progress = task.totalSubtasks
    ? (task.doneSubtasks / task.totalSubtasks) * 100
    : 0;

  const taskPath = task.sourcePath || task.status;

  await putUserData(`${taskPath}/${task.id}`, getTaskForStorage(task, taskPath));

  updateHTML();
};

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