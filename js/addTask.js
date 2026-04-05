// JavaScript for Add Task Page
async function initAddTask() {
  const userName = localStorage.getItem("userName");

  if (userName !== 'Guest') {
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }
}

// Function for priority buttons
// Priority Button Functions
function resetPriorityButtons() {
  const priorities = ["urgent", "medium", "low"];

  priorities.forEach((priority) => {
    const button = document.getElementById("prio_" + priority);
    button.classList.remove("active");
    button.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_off.svg" alt="Button ${capitalize(priority)}">`;
  });
}

// Set the priority and update button states
function setPriority(priority) {
  const currentButton = document.getElementById("prio_" + priority);
  const isAlreadyActive = currentButton.classList.contains("active");

  resetPriorityButtons();

  if (isAlreadyActive) {
    return;
  }

  currentButton.classList.add("active");
  currentButton.innerHTML = `${capitalize(priority)} <img src="../assets/icon/btn_${priority}_on.svg" alt="Button ${capitalize(priority)}">`;
}

// Utility function to capitalize the first letter of a string
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}