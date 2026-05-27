/**
 * Returns the add-task dialog shell markup.
 * 
 * Builds the board dialog wrapper, header, container slot,
 * and transient success feedback element.
 * 
 * @returns {string} Dialog markup.
 */
export function getDialogAddTaskTemplate() {
  return `
      <dialog onclick="closeAddNewTaskDialog()" id="addTask_dialog" class="addTask_dialog_content dialog_closed">
        <div class="addTask_dialog_direction" onclick="closeDialogOnBodyclick(event)">
          ${buildAddTaskDialogHeader()}
          <section id="addTaskContainer" class="add_task_container"></section>
          ${buildTaskAddedFeedback()}
        </div>
      </dialog>
    `;
}

  /**
   * Builds the static header for the add-task dialog.
   * 
   * @returns {string} Dialog header markup.
   */
function buildAddTaskDialogHeader() {
  return `
    <section class="main_header main_addTask_dialog_header">
      <h1>Add Task</h1>
      <div class="contact_dialog_close_button_direction">
        <button class="close_button" onclick="closeAddNewTaskDialog()">X</button>
      </div>
    </section>
  `;
}

/**
 * Builds the success feedback element for task creation.
 * 
 * @returns {string} Feedback markup.
 */
function buildTaskAddedFeedback() {
  return `
    <section id="taskAddedFeedback" class="task_added_feedback" role="status" aria-live="polite">
      <img src="../assets/img/addedTo.svg" alt="Task added to board">
    </section>
  `;
}
