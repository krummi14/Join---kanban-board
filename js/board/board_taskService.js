import { deleteData, getData, putUserData } from "../shared/firebase.js";
import { normalizeCategory } from "../shared/assets.js";
import { generateSingleAvatar, generateExtraAvatar, getNoAssigneesCardTemplate } from "../template/board_template.js";

let tasks = [];
const TASKS_ROOT_PATH = "tasks";
const BOARD_CACHE_OPTIONS = {
  preferCache: true,
  refreshInBackground: true,
  maxAgeMs: 15000,
};

/** Returns the in-memory task collection. */
export function getTasks() {
  return tasks;
}

/** Replaces the in-memory task collection. */
export function setTasks(newTasks) {
  tasks = newTasks;
}

/** Loads tasks from the unified or legacy board sources. */
export async function loadTasks(BOARD_COLUMNS) {
  const tasksRootData = await getData(TASKS_ROOT_PATH, BOARD_CACHE_OPTIONS);
  const unifiedTasks = mapUnifiedTasks(tasksRootData, BOARD_COLUMNS);
  if (unifiedTasks.length > 0) {
    tasks = unifiedTasks;
    return tasks;
  }

  const columnData = await loadLegacyTaskSources(BOARD_COLUMNS);
  tasks = mapLegacyTasks(BOARD_COLUMNS, columnData);
  return tasks;
}

/** Synchronizes one updated task into the local task cache. */
export function syncTaskLocally(taskId, updatedData) {
  syncLocalTaskUpdate(taskId, updatedData);
}

/** Builds the avatar markup shown on a board card. */
function generateAvatarHTML(assignees) {
  if (!assignees?.length) return getNoAssigneesCardTemplate();
  const visibleAssignees = assignees.slice(0, 3);
  const extraAssigneeCount = assignees.length - visibleAssignees.length;
  return buildAvatarMarkup(visibleAssignees, extraAssigneeCount);
}

/** Returns the tasks that belong to a specific board column. */
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

/** Moves a task to another board column and persists the change. */
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

/** Deletes a task from storage and the local cache. */
export async function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  const path = getStoragePath(task);
  await deleteData(path);
  tasks = tasks.filter((t) => t.id !== taskId);
}

/** Toggles the done state of a task subtask. */
export async function toggleSubtask(taskId, index) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.subtasks[index].done = !task.subtasks[index].done;
  syncDerivedTaskFields(task);
  await putUserData(getStoragePath(task), getTaskForStorage(task, task.status));
}

/** Updates a task in storage and synchronizes the local cache. */
export async function updateTask(taskId, updatedData) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;
  const path = getStoragePath(task);
  const cleanTask = getTaskForStorage({ ...task, ...updatedData }, task.status);
  await putUserData(path, cleanTask);
  syncLocalTaskUpdate(taskId, updatedData);
}

/** Adds derived UI fields to a task record. */
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

/** Removes UI-only fields before persisting a task. */
function getTaskForStorage(task, status) {
  const { doneSubtasks, totalSubtasks, progress, priorityIcon, sourcePath, ...taskData } = task;
  return {
    ...taskData,
    status,
  };
}

/** Returns tasks sorted by their persisted order value. */
export function sortTasksByOrder(taskList = []) {
  return [...taskList].sort(compareTaskOrder);
}

/** Returns the icon path for a task priority. */
function getPriorityIcon(priority) {
  if (priority === "urgent") return "../assets/icon/btn_urgent_off.svg";
  if (priority === "medium") return "../assets/icon/btn_medium_off.svg";
  if (priority === "low") return "../assets/icon/btn_low_off.svg";
  return "";
}

/** Maps tasks from the unified root task source. */
function mapUnifiedTasks(data, BOARD_COLUMNS) {
  if (!isPlainObject(data)) return [];
  return Object.entries(data)
    .filter(([, task]) => isPlainTask(task))
    .map(([id, task]) => createUnifiedTask(id, task, BOARD_COLUMNS));
}

  /** Maps tasks from one legacy column source. */
function mapLegacyColumnTasks(column, data) {
  if (!isPlainObject(data)) return [];
  return Object.entries(data)
    .filter(([, task]) => isPlainTask(task))
    .map(([id, task]) => createLegacyTask(id, task, column.path));
}

  /** Resolves a task status to a configured board column path. */
function resolveColumnPath(status, BOARD_COLUMNS) {
  const normalizedStatus = normalizeStatusValue(status);
  const match = BOARD_COLUMNS.find(
    (column) => normalizeStatusValue(column.path) === normalizedStatus
  );
  return match?.path || BOARD_COLUMNS[0]?.path || "to_do";
}

/** Normalizes a task status string for comparisons. */
function normalizeStatusValue(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\s+/g, " ");
}

  /** Returns the storage path for a task record. */
function getStoragePath(task) {
  if (task.sourcePath === TASKS_ROOT_PATH) {
    return `${TASKS_ROOT_PATH}/${task.id}`;
  }
  return `${task.sourcePath || task.status}/${task.id}`;
}

/** Synchronizes the affected board columns after a move. */
function syncColumnTasksAfterMove(moveContext, BOARD_COLUMNS, targetIndex) {
  const previousColumn = findBoardColumn(BOARD_COLUMNS, moveContext.previousPath);
  const nextColumn = findBoardColumn(BOARD_COLUMNS, moveContext.nextPath);
  if (!nextColumn) return;
  syncPreviousColumnTasks(previousColumn, moveContext);
  syncNextColumnTasks(nextColumn, moveContext.task, targetIndex);
}

/** Persists the task order for the affected columns. */
async function persistTaskOrder(previousPath, nextPath, BOARD_COLUMNS) {
  const affectedColumns = getAffectedColumns(BOARD_COLUMNS, previousPath, nextPath);
  const pendingWrites = affectedColumns.flatMap(createOrderWriteOperations);
  await Promise.all(pendingWrites);
}

/** Compares two tasks by order and id. */
function compareTaskOrder(leftTask, rightTask) {
  const leftOrder = Number.isFinite(leftTask?.order) ? leftTask.order : Number.POSITIVE_INFINITY;
  const rightOrder = Number.isFinite(rightTask?.order) ? rightTask.order : Number.POSITIVE_INFINITY;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return String(leftTask?.id ?? "").localeCompare(String(rightTask?.id ?? ""));
}

/** Normalizes an insertion index for a task list. */
function normalizeTaskIndex(targetIndex, taskCount) {
  if (!Number.isInteger(targetIndex)) {
    return taskCount;
  }

  return Math.max(0, Math.min(targetIndex, taskCount));
}

/** Returns whether a value is a plain object. */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Loads task data from all legacy board columns. */
function loadLegacyTaskSources(boardColumns) {
  return Promise.all(boardColumns.map((column) => getData(column.path, BOARD_CACHE_OPTIONS)));
}

/** Maps all legacy board column data into one task array. */
function mapLegacyTasks(boardColumns, columnData) {
  return boardColumns.flatMap((column, index) => mapLegacyColumnTasks(column, columnData[index]));
}

/** Builds the avatar markup for visible and overflow assignees. */
function buildAvatarMarkup(visibleAssignees, extraAssigneeCount) {
  const avatarMarkup = visibleAssignees.map(generateSingleAvatar).join("");
  if (extraAssigneeCount <= 0) return avatarMarkup;
  return `${avatarMarkup}${generateExtraAvatar(extraAssigneeCount)}`;
}

/** Builds the context needed to move a task. */
function getMoveContext(taskId, targetCategory, boardColumns) {
  const task = tasks.find((entry) => entry.id == taskId);
  const targetColumn = findBoardColumn(boardColumns, targetCategory);
  if (!task || !targetColumn) return null;
  return createMoveContext(task, targetColumn.path);
}

/** Creates the move context object for a task transfer. */
function createMoveContext(task, nextPath) {
  const previousPath = task.status;
  const storagePath = getStoragePath(task);
  const previousSourcePath = task.sourcePath;
  task.status = nextPath;
  return { task, nextPath, previousPath, storagePath, previousSourcePath };
}

/** Persists the task move to storage. */
function persistMovedTask(moveContext) {
  const updatedTask = getTaskForStorage(moveContext.task, moveContext.nextPath);
  return persistTaskMove(moveContext, updatedTask);
}

/** Writes the moved task to all required storage locations. */
async function persistTaskMove(moveContext, updatedTask) {
  await putUserData(moveContext.storagePath, updatedTask);
  await syncLegacyTaskStorage(moveContext, updatedTask);
}

/** Synchronizes legacy storage paths after a task move. */
async function syncLegacyTaskStorage(moveContext, updatedTask) {
  if (moveContext.task.sourcePath === TASKS_ROOT_PATH) return;
  moveContext.task.sourcePath = moveContext.nextPath;
  if (moveContext.previousSourcePath === moveContext.nextPath) return;
  await deleteData(`${moveContext.previousSourcePath}/${moveContext.task.id}`);
  await putUserData(`${moveContext.nextPath}/${moveContext.task.id}`, updatedTask);
}

/** Logs a board task service error. */
function logTaskServiceError(error) {
  console.error(error);
}

/** Applies updated task data to the local task cache. */
function syncLocalTaskUpdate(taskId, updatedData) {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], ...updatedData };
  syncDerivedTaskFields(tasks[index]);
}

/** Recomputes the derived fields of a task in place. */
function syncDerivedTaskFields(task) {
  Object.assign(task, prepareTask(task));
}

/** Returns whether a value can be treated as a task record. */
function isPlainTask(task) {
  return isPlainObject(task);
}

/** Creates a normalized task record from unified task data. */
function createUnifiedTask(id, task, boardColumns) {
  const status = resolveColumnPath(task.status, boardColumns);
  return buildTaskRecord(id, task, status, TASKS_ROOT_PATH);
}

/** Creates a normalized task record from legacy task data. */
function createLegacyTask(id, task, path) {
  return buildTaskRecord(id, task, path, path);
}

/** Builds a normalized task record with UI fields included. */
function buildTaskRecord(id, task, status, sourcePath) {
  return { id, ...prepareTask(task), status, sourcePath, priorityIcon: getPriorityIcon(task.priority), avatarHTML: generateAvatarHTML(task.assignees) };
}

/** Finds a board column by its path. */
function findBoardColumn(boardColumns, path) {
  return boardColumns.find((column) => column.path === path);
}

/** Removes the moved task from its previous column when needed. */
function syncPreviousColumnTasks(previousColumn, moveContext) {
  if (!shouldSyncPreviousColumn(previousColumn, moveContext)) return;
  previousColumn.tasks = previousColumn.tasks.filter((task) => task.id !== moveContext.task.id);
}

/** Returns whether the previous column needs to be updated after a move. */
function shouldSyncPreviousColumn(previousColumn, moveContext) {
  return moveContext.previousPath !== moveContext.nextPath && Array.isArray(previousColumn?.tasks);
}

/** Inserts the moved task into its next column at the target index. */
function syncNextColumnTasks(nextColumn, task, targetIndex) {
  if (!Array.isArray(nextColumn.tasks)) return;
  const nextTasks = nextColumn.tasks.filter((columnTask) => columnTask.id !== task.id);
  const insertIndex = normalizeTaskIndex(targetIndex, nextTasks.length);
  nextTasks.splice(insertIndex, 0, task);
  nextColumn.tasks = nextTasks;
}

/** Returns the board columns affected by a task move. */
function getAffectedColumns(boardColumns, previousPath, nextPath) {
  return boardColumns.filter((column) => column.path === previousPath || column.path === nextPath);
}

/** Creates the order-write operations for a board column. */
function createOrderWriteOperations(column) {
  if (!Array.isArray(column.tasks)) return [];
  return column.tasks.flatMap(createTaskOrderWrite);
}

/** Creates the persistence write for one task order update. */
function createTaskOrderWrite(task, index) {
  if (task.order === index) return [];
  task.order = index;
  return [putUserData(getStoragePath(task), { order: index })];
}