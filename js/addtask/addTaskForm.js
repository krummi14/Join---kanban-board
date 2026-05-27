/**
 * Re-exports the Add Task form factory and category validator.
 * 
 * Keeps the previous public module surface intact while the actual
 * implementation lives in the refactored addtask entry module.
 */
export { createAddTaskForm, validateCategorySelection } from "./index.js";
/**
 * Re-exports the contact initials helper.
 * 
 * Preserves compatibility for callers that still import the helper
 * from the legacy addTaskForm module path.
 */
export { getContactInitials } from "./contactUtils.js";