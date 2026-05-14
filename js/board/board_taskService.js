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

export async function loadTasks(BOARD_COLUMNS) {
  const { tasksRootData, columnData } = await loadTaskSources(BOARD_COLUMNS);
  const unifiedTasks = mapUnifiedTasks(tasksRootData, BOARD_COLUMNS);
  const legacyTasks = mapLegacyTasks(BOARD_COLUMNS, columnData);
  tasks = mergeTaskCollections(unifiedTasks, legacyTasks);
  return tasks;
}

function generateAvatarHTML(assignees) {
  if (!assignees?.length) return getNoAssigneesCardTemplate();
  const visibleAssignees = assignees.slice(0, 3);
  const extraAssigneeCount = assignees.length - visibleAssignees.length;
  return buildAvatarMarkup(visibleAssignees, extraAssigneeCount);
}

export function getTasksForColumn(category, BOARD_COLUMNS) {
  const column = BOARD_COLUMNS.find(
    (c) => normalizeCategory(c.path) === normalizeCategory(category)
  );
  if (!column) return [];
  if (Array.isArray(column.tasks)) return sortTasksByOrder(column.tasks);

  return sortTasksByOrder(
    tasks.filter(
      (task) => normalizeStatusValue(task.status) === normalizeStatusValue(column.path)
    )
  );
}

export async function moveTask(taskId, targetCategory, BOARD_COLUMNS, targetIndex = null) {
  const moveContext = getMoveContext(taskId, targetCategory, BOARD_COLUMNS);
  if (!moveContext) return null;
  try {
    await persistMovedTask(moveContext);
    syncColumnTasksAfterMove(moveContext, BOARD_COLUMNS, targetIndex);
    persistTaskOrder(moveContext.previousPath, moveContext.nextPath, BOARD_COLUMNS).catch(logTaskServiceError);
    return { previousPath: moveContext.previousPath, newPath: moveContext.nextPath };
  } catch (error) {
    logTaskServiceError(error);
    return null;
  }
}

export async function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  const path = getStoragePath(task);
  await deleteData(path);
  tasks = tasks.filter((t) => t.id !== taskId);
}

export async function toggleSubtask(taskId, index) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.subtasks[index].done = !task.subtasks[index].done;
  await putUserData(getStoragePath(task), getTaskForStorage(task, task.status));
}

export async function updateTask(taskId, updatedData) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;
  const path = getStoragePath(task);
  const cleanTask = getTaskForStorage({ ...task, ...updatedData }, task.status);
  await putUserData(path, cleanTask);
  syncLocalTaskUpdate(taskId, updatedData);
}

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
  const { doneSubtasks, totalSubtasks, progress, priorityIcon, sourcePath, ...taskData } = task;
  return {
    ...taskData,
    status,
  };
}

export function sortTasksByOrder(taskList = []) {
  return [...taskList].sort(compareTaskOrder);
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
    .filter(([, task]) => isPlainTask(task))
    .map(([id, task]) => createUnifiedTask(id, task, BOARD_COLUMNS));
}

function mapLegacyColumnTasks(column, data) {
  if (!isPlainObject(data)) return [];
  return Object.entries(data)
    .filter(([, task]) => isPlainTask(task))
    .map(([id, task]) => createLegacyTask(id, task, column.path));
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

function syncColumnTasksAfterMove(moveContext, BOARD_COLUMNS, targetIndex) {
  const previousColumn = findBoardColumn(BOARD_COLUMNS, moveContext.previousPath);
  const nextColumn = findBoardColumn(BOARD_COLUMNS, moveContext.nextPath);
  if (!nextColumn) return;
  syncPreviousColumnTasks(previousColumn, moveContext);
  syncNextColumnTasks(nextColumn, moveContext.task, targetIndex);
}

async function persistTaskOrder(previousPath, nextPath, BOARD_COLUMNS) {
  const affectedColumns = getAffectedColumns(BOARD_COLUMNS, previousPath, nextPath);
  const pendingWrites = affectedColumns.flatMap(createOrderWriteOperations);
  await Promise.all(pendingWrites);
}

function compareTaskOrder(leftTask, rightTask) {
  const leftOrder = Number.isFinite(leftTask?.order) ? leftTask.order : Number.POSITIVE_INFINITY;
  const rightOrder = Number.isFinite(rightTask?.order) ? rightTask.order : Number.POSITIVE_INFINITY;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return String(leftTask?.id ?? "").localeCompare(String(rightTask?.id ?? ""));
}

function normalizeTaskIndex(targetIndex, taskCount) {
  if (!Number.isInteger(targetIndex)) {
    return taskCount;
  }

  return Math.max(0, Math.min(targetIndex, taskCount));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function loadTaskSources(boardColumns) {
  return Promise.all([
    getData(TASKS_ROOT_PATH),
    ...boardColumns.map((column) => getData(column.path)),
  ]).then(([tasksRootData, ...columnData]) => ({ tasksRootData, columnData }));
}

function mapLegacyTasks(boardColumns, columnData) {
  return boardColumns.flatMap((column, index) => mapLegacyColumnTasks(column, columnData[index]));
}

function mergeTaskCollections(unifiedTasks, legacyTasks) {
  const unifiedIds = new Set(unifiedTasks.map((task) => task.id));
  return [...unifiedTasks, ...legacyTasks.filter((task) => !unifiedIds.has(task.id))];
}

function buildAvatarMarkup(visibleAssignees, extraAssigneeCount) {
  const avatarMarkup = visibleAssignees.map(generateSingleAvatar).join("");
  if (extraAssigneeCount <= 0) return avatarMarkup;
  return `${avatarMarkup}${generateExtraAvatar(extraAssigneeCount)}`;
}

function getMoveContext(taskId, targetCategory, boardColumns) {
  const task = tasks.find((entry) => entry.id == taskId);
  const targetColumn = findBoardColumn(boardColumns, targetCategory);
  if (!task || !targetColumn) return null;
  return createMoveContext(task, targetColumn.path);
}

function createMoveContext(task, nextPath) {
  const previousPath = task.status;
  const storagePath = getStoragePath(task);
  const previousSourcePath = task.sourcePath;
  task.status = nextPath;
  return { task, nextPath, previousPath, storagePath, previousSourcePath };
}

function persistMovedTask(moveContext) {
  const updatedTask = getTaskForStorage(moveContext.task, moveContext.nextPath);
  return persistTaskMove(moveContext, updatedTask);
}

async function persistTaskMove(moveContext, updatedTask) {
  await putUserData(moveContext.storagePath, updatedTask);
  await syncLegacyTaskStorage(moveContext, updatedTask);
}

async function syncLegacyTaskStorage(moveContext, updatedTask) {
  if (moveContext.task.sourcePath === TASKS_ROOT_PATH) return;
  moveContext.task.sourcePath = moveContext.nextPath;
  if (moveContext.previousSourcePath === moveContext.nextPath) return;
  await deleteData(`${moveContext.previousSourcePath}/${moveContext.task.id}`);
  await putUserData(`${moveContext.nextPath}/${moveContext.task.id}`, updatedTask);
}

function logTaskServiceError(error) {
  console.error(error);
}

function syncLocalTaskUpdate(taskId, updatedData) {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], ...updatedData };
}

function isPlainTask(task) {
  return isPlainObject(task);
}

function createUnifiedTask(id, task, boardColumns) {
  const status = resolveColumnPath(task.status, boardColumns);
  return buildTaskRecord(id, task, status, TASKS_ROOT_PATH);
}

function createLegacyTask(id, task, path) {
  return buildTaskRecord(id, task, path, path);
}

function buildTaskRecord(id, task, status, sourcePath) {
  return { id, ...prepareTask(task), status, sourcePath, priorityIcon: getPriorityIcon(task.priority), avatarHTML: generateAvatarHTML(task.assignees) };
}

function findBoardColumn(boardColumns, path) {
  return boardColumns.find((column) => column.path === path);
}

function syncPreviousColumnTasks(previousColumn, moveContext) {
  if (!shouldSyncPreviousColumn(previousColumn, moveContext)) return;
  previousColumn.tasks = previousColumn.tasks.filter((task) => task.id !== moveContext.task.id);
}

function shouldSyncPreviousColumn(previousColumn, moveContext) {
  return moveContext.previousPath !== moveContext.nextPath && Array.isArray(previousColumn?.tasks);
}

function syncNextColumnTasks(nextColumn, task, targetIndex) {
  if (!Array.isArray(nextColumn.tasks)) return;
  const nextTasks = nextColumn.tasks.filter((columnTask) => columnTask.id !== task.id);
  const insertIndex = normalizeTaskIndex(targetIndex, nextTasks.length);
  nextTasks.splice(insertIndex, 0, task);
  nextColumn.tasks = nextTasks;
}

function getAffectedColumns(boardColumns, previousPath, nextPath) {
  return boardColumns.filter((column) => column.path === previousPath || column.path === nextPath);
}

function createOrderWriteOperations(column) {
  if (!Array.isArray(column.tasks)) return [];
  return column.tasks.flatMap(createTaskOrderWrite);
}

function createTaskOrderWrite(task, index) {
  if (task.order === index) return [];
  task.order = index;
  return [putUserData(getStoragePath(task), { order: index })];
}