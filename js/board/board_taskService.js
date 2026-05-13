import { deleteData, getData, putUserData } from "../firebase.js";
import { normalizeCategory } from "../assets.js";
import { generateSingleAvatar, generateExtraAvatar, getNoAssigneesCardTemplate } from "../template/board_template.js";

let tasks = [];
const TASKS_ROOT_PATH = "tasks";

export function getTasks() {
  return tasks;
}

export function setTasks(newTasks) {
  tasks = newTasks;
}

// 📥 LOAD
export async function loadTasks(BOARD_COLUMNS) {
  const [tasksRootData, ...columnData] = await Promise.all([
    getData(TASKS_ROOT_PATH),
    ...BOARD_COLUMNS.map((column) => getData(column.path)),
  ]);

  const unifiedTasks = mapUnifiedTasks(tasksRootData, BOARD_COLUMNS);
  const legacyTasks = BOARD_COLUMNS.flatMap((column, index) =>
    mapLegacyColumnTasks(column, columnData[index])
  );

  const unifiedIds = new Set(unifiedTasks.map((task) => task.id));
  tasks = [...unifiedTasks, ...legacyTasks.filter((task) => !unifiedIds.has(task.id))];

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
  if (Array.isArray(column.tasks)) return column.tasks;

  return tasks.filter(
    (task) => normalizeStatusValue(task.status) === normalizeStatusValue(column.path)
  );
}

// Julian 📊 FILTER
//export function getTasksForColumn(category, BOARD_COLUMNS) {
//  const column = BOARD_COLUMNS.find(
//    (c) => normalizeCategory(c.path) === normalizeCategory(category)
//  );
//  if (!column) return [];
//
//  return tasks.filter(
//    (task) =>
//      normalizeCategory(task.sourcePath || task.status) ===
//      normalizeCategory(column.path)
//  );
//}

// 🔄 MOVE
export async function moveTask(taskId, targetCategory, BOARD_COLUMNS) {
  const task = tasks.find((t) => t.id == taskId);
  const targetColumn = BOARD_COLUMNS.find((c) => c.path === targetCategory);

  if (!task || !targetColumn) return null;

  const previousPath = task.status;
  const storagePath = getStoragePath(task);

  task.status = targetColumn.path;

  try {
    const updatedTask = getTaskForStorage(task, targetColumn.path);

    await putUserData(storagePath, updatedTask);

    if (task.sourcePath !== TASKS_ROOT_PATH) {
      task.sourcePath = targetColumn.path;
      await deleteData(`${previousPath}/${task.id}`);
      await putUserData(`${targetColumn.path}/${task.id}`, updatedTask);
    }

    syncColumnTasksAfterMove(task, previousPath, targetColumn.path, BOARD_COLUMNS);

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

  const path = getStoragePath(task);

  await deleteData(path);
  tasks = tasks.filter((t) => t.id !== taskId);
}



// 🔁 SUBTASK
export async function toggleSubtask(taskId, index) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.subtasks[index].done = !task.subtasks[index].done;

  await putUserData(
    getStoragePath(task),
    getTaskForStorage(task, task.status)
  );
}


export async function updateTask(taskId, updatedData) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const path = getStoragePath(task);

  const cleanTask = getTaskForStorage(
    { ...task, ...updatedData },
    task.status
  );

  await putUserData(path, cleanTask);

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
  if (priority === "urgent") return "../assets/icon/btn_urgent_off.svg";
  if (priority === "medium") return "../assets/icon/btn_medium_off.svg";
  if (priority === "low") return "../assets/icon/btn_low_off.svg";
  return "";
}

function mapUnifiedTasks(data, BOARD_COLUMNS) {
  if (!isPlainObject(data)) return [];

  return Object.entries(data)
    .filter(([, task]) => isPlainObject(task))
    .map(([id, task]) => {
      const status = resolveColumnPath(task.status, BOARD_COLUMNS);
      return {
        id,
        ...prepareTask(task),
        status,
        sourcePath: TASKS_ROOT_PATH,
        priorityIcon: getPriorityIcon(task.priority),
        avatarHTML: generateAvatarHTML(task.assignees),
      };
    });
}

function mapLegacyColumnTasks(column, data) {
  if (!isPlainObject(data)) return [];

  return Object.entries(data)
    .filter(([, task]) => isPlainObject(task))
    .map(([id, task]) => ({
      id,
      ...prepareTask(task),
      status: column.path,
      sourcePath: column.path,
      priorityIcon: getPriorityIcon(task.priority),
      avatarHTML: generateAvatarHTML(task.assignees),
    }));
}

function resolveColumnPath(status, BOARD_COLUMNS) {
  const normalizedStatus = normalizeStatusValue(status);
  const match = BOARD_COLUMNS.find(
    (column) => normalizeStatusValue(column.path) === normalizedStatus
  );
  return match?.path || BOARD_COLUMNS[0]?.path || "to_do";
}

function normalizeStatusValue(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getStoragePath(task) {
  if (task.sourcePath === TASKS_ROOT_PATH) {
    return `${TASKS_ROOT_PATH}/${task.id}`;
  }

  return `${task.sourcePath || task.status}/${task.id}`;
}

function syncColumnTasksAfterMove(task, previousPath, nextPath, BOARD_COLUMNS) {
  const previousColumn = BOARD_COLUMNS.find((column) => column.path === previousPath);
  const nextColumn = BOARD_COLUMNS.find((column) => column.path === nextPath);

  if (Array.isArray(previousColumn?.tasks)) {
    previousColumn.tasks = previousColumn.tasks.filter((columnTask) => columnTask.id !== task.id);
  }

  if (Array.isArray(nextColumn?.tasks)) {
    const existingIndex = nextColumn.tasks.findIndex((columnTask) => columnTask.id === task.id);
    if (existingIndex !== -1) {
      nextColumn.tasks[existingIndex] = task;
      return;
    }
    nextColumn.tasks.push(task);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}