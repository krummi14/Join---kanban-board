import { deleteData, getData, putUserData } from "./firebase.js";
import { normalizeCategory } from "./assets.js";
import { generateSingleAvatar, generateExtraAvatar, getNoAssigneesCardTemplate } from "./template/board_template.js";

let tasks = [];

export function getTasks() {
  return tasks;
}

export function setTasks(newTasks) {
  tasks = newTasks;
}

// 📥 LOAD
export async function loadTasks(BOARD_COLUMNS) {
  console.log("🔥 LOAD TASKS CALLED");
  console.log("BOARD_COLUMNS:", BOARD_COLUMNS);

  const columnData = await Promise.all(
    BOARD_COLUMNS.map((column) => getData(column.path))
  );

  console.log("📦 columnData:", columnData);

  tasks = BOARD_COLUMNS.flatMap((column, index) => {
    const data = columnData[index];

    console.log("COLUMN:", column.path);
    console.log("DATA:", data);

    if (!data) {
      console.warn("⚠️ EMPTY COLUMN:", column.path);
      return [];
    }

    return Object.entries(data).map(([id, task]) => ({
      id,
      ...prepareTask(task),
      status: column.path,
      sourcePath: column.path,
      priorityIcon: getPriorityIcon(task.priority),

  // ✅ DAS IST DER FIX:
  avatarHTML: generateAvatarHTML(task.assignees),
    }));
  });

  return tasks;
}



function generateAvatarHTML(assignees) {
  if (!assignees || assignees.length === 0) {
    return getNoAssigneesCardTemplate();
  }

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

// 📊 FILTER
export function getTasksForColumn(category, BOARD_COLUMNS) {
  const column = BOARD_COLUMNS.find(
    (c) => normalizeCategory(c.path) === normalizeCategory(category)
  );
  if (!column) return [];

  return tasks.filter(
    (task) =>
      normalizeCategory(task.sourcePath || task.status) ===
      normalizeCategory(column.path)
  );
}

// 🔄 MOVE
export async function moveTask(taskId, targetCategory, BOARD_COLUMNS) {
  const task = tasks.find((t) => t.id == taskId);
  const targetColumn = BOARD_COLUMNS.find((c) => c.path === targetCategory);

  if (!task || !targetColumn) return null;

  const previousPath = task.sourcePath || task.status;

  task.status = targetColumn.path;
  task.sourcePath = targetColumn.path;

  try {
    const updatedTask = getTaskForStorage(task, targetColumn.path);

    await putUserData(`${targetColumn.path}/${task.id}`, updatedTask);
    await deleteData(`${previousPath}/${task.id}`);

    return { previousPath, newPath: targetColumn.path };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 🗑️ DELETE

export async function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const path = task.sourcePath || task.status;

  await deleteData(`${path}/${task.id}`);
  tasks = tasks.filter((t) => t.id !== taskId);
}
 



// 🔁 SUBTASK
export async function toggleSubtask(taskId, index) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.subtasks[index].done = !task.subtasks[index].done;

  const taskPath = task.sourcePath || task.status;

  await putUserData(
    `${taskPath}/${task.id}`,
    getTaskForStorage(task, taskPath)
  );
}
 

export async function updateTask(taskId, updatedData) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const path = task.sourcePath || task.status;

  const cleanTask = getTaskForStorage(
    { ...task, ...updatedData },
    path
  );

  await putUserData(`${path}/${taskId}`, cleanTask);

  // lokal aktualisieren
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      ...updatedData
    };
  }
}

// 🧠 HELPERS
function prepareTask(task) {
  return {
    ...task,
    doneSubtasks: task.subtasks?.filter((st) => st.done).length || 0,
    totalSubtasks: task.subtasks?.length || 0,
    progress: task.subtasks?.length
      ? (task.subtasks.filter((st) => st.done).length /
          task.subtasks.length) *
        100
      : 0,
    priorityIcon: getPriorityIcon(task.priority),
  };
}

function getTaskForStorage(task, status) {
  const {
    doneSubtasks,
    totalSubtasks,
    progress,
    priorityIcon,
    sourcePath,
    ...taskData
  } = task;

  return {
    ...taskData,
    status,
  };
}

function getPriorityIcon(priority) {
  if (priority === "urgent") return "../assets/img/urgent_icon.svg";
  if (priority === "medium") return "../assets/img/medium_icon.svg";
  if (priority === "low") return "../assets/img/low_icon.svg";
  return "";
}