async function initSummery() {
  const userName = localStorage.getItem("userName");

  if (userName !== 'Guest') {
    const refSummeryUser = document.getElementById("good_morning");
    refSummeryUser.innerHTML = `<h2>Good Morning,<br><span class="user_name">${userName}!</span></h2>`;
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }

  await renderSummaryMetrics();
}

async function renderSummaryMetrics() {
  const columns = ["to_do", "done", "in_progress", "await_feedback"];

  try {
    const columnEntries = await Promise.all(
      columns.map(async (column) => {
        const response = await fetch(`${BASE_URL}${column}.json`);
        const data = await response.json();
        return [column, normalizeTasks(data)];
      })
    );

    const tasksByColumn = Object.fromEntries(columnEntries);
    const allTasks = columns.flatMap((column) => tasksByColumn[column]);

    updateMetricCount("to_do_count", tasksByColumn.to_do.length, "To-do");
    updateMetricCount("done_count", tasksByColumn.done.length, "Done");
    updateMetricCount("board_count", allTasks.length, "Tasks in <br> Board");
    updateMetricCount("progress_count", tasksByColumn.in_progress.length, "Tasks in <br> Progress");
    updateMetricCount("feedback_count", tasksByColumn.await_feedback.length, "Awaiting <br> Feedback");

    const urgentTasks = allTasks.filter((task) => String(task.priority || "").toLowerCase() === "urgent");
    updateMetricCount("urgent_count", urgentTasks.length, "Urgent");
    updateDeadline(urgentTasks);
  } catch (error) {
    console.error("Failed to load summary metrics.", error);
  }
}

function normalizeTasks(data) {
  return Object.values(data || {}).filter((task) => task && typeof task === "object");
}

function updateMetricCount(elementId, count, label) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.innerHTML = `${count}<br><span>${label}</span>`;
}

function updateDeadline(tasks) {
  const deadlineElement = document.getElementById("deadline");
  if (!deadlineElement) return;

  const upcomingDate = tasks
    .map((task) => parseDueDate(task.dueDate))
    .filter(Boolean)
    .sort((left, right) => left - right)[0];

  const label = "Upcoming Deadline";
  if (!upcomingDate) {
    deadlineElement.innerHTML = `No deadline<br><span>${label}</span>`;
    return;
  }

  deadlineElement.innerHTML = `${formatDeadline(upcomingDate)}<br><span>${label}</span>`;
}

function parseDueDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDeadline(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}