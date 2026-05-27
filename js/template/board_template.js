/**
 * Re-exports the board card template helpers used across the board UI.
 */
export {
  generateTaskHTML,
  generateCardMoveActions,
  generateSingleAvatar,
  generateExtraAvatar,
  getNoAssigneesCardTemplate,
} from "./board_card_template.js";

/**
 * Re-exports the board overlay template helpers used by the detail dialog.
 */
export {
  generateTaskOverlay,
  generateAssignee,
  generateSubtask,
  getNoSubtasksTemplate,
  getNoAssigneesTemplate,
  getAssigneeTemplate,
} from "./board_overlay_template.js";

/**
 * Re-exports the add-task dialog template helper used by the board page.
 */
export { getDialogAddTaskTemplate } from "./board_dialog_template.js";

/**
 * Re-exports the edit-task template helper used inside the board overlay.
 */
export { createEditTaskTemplate } from "./board_edit_template.js";
