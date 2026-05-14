function isMobileMode() {
  return window.matchMedia("(max-width: 1115px)").matches;
}

function renderGreeting() {
  if (!hasPersonalGreeting()) return renderGuestGreeting();
  refSummeryUser.innerHTML = createPersonalGreetingMarkup();
  refUser.innerHTML = getInitials(userName);
}

function syncGreetingVisibility() {
  if (isMobileMode()) {
    refSummeryUser.style.display = "none";
    return;
  }

  refSummeryUser.classList.remove("fadeOut");
  refSummeryUser.style.display = "flex";
  renderGreeting();
}

mq.addEventListener("change", syncGreetingVisibility);

async function initSummery() {
  if (shouldSkipGreeting()) return renderSummaryWithoutGreeting();
  showGreeting();
  if (isMobileMode()) scheduleGreetingFadeOut();
  await renderSummaryMetrics();
}

async function renderSummaryMetrics() {
  try {
    const data = await loadSummaryTasks();
    const allTasks = normalizeTasks(data);
    const tasksByColumn = groupTasksByColumn(allTasks);
    updateBoardMetrics(allTasks, tasksByColumn);
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

function groupTasksByColumn(tasks) {
  const grouped = createEmptyTaskGroups();
  tasks.forEach((task) => pushTaskIntoGroup(grouped, task));
  return grouped;
}

function normalizeStatusKey(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\s+/g, "_");
}

function updateMetricCount(elementId, count, label) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.innerHTML = `${count}<br><span>${label}</span>`;
}

function updateDeadline(tasks) {
  const deadlineElement = document.getElementById("deadline");
  if (!deadlineElement) return;
  const label = "Upcoming Deadline";
  const upcomingDate = getUpcomingDeadline(tasks);
  deadlineElement.innerHTML = upcomingDate ? buildDeadlineMarkup(upcomingDate, label) : buildNoDeadlineMarkup(label);
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

function hasPersonalGreeting() {
  return userName && userName !== "Guest";
}

function createPersonalGreetingMarkup() {
  return `<h2 class="good_morning">Good Morning,<br><span class="user_name">${userName}</span></h2>`;
}

function renderGuestGreeting() {
  refSummeryUser.innerHTML = `<h2 class="good_morning">Good Morning!</h2>`;
}

function shouldSkipGreeting() {
  return localStorage.getItem("greetingShown") == "true" && isMobileMode();
}

async function renderSummaryWithoutGreeting() {
  refSummeryUser.style.display = "none";
  userInitials();
  await renderSummaryMetrics();
}

function showGreeting() {
  refSummeryUser.style.display = "flex";
  renderGreeting();
}

function scheduleGreetingFadeOut() {
  setTimeout(() => {
    refSummeryUser.classList.add("fadeOut");
    setTimeout(hideGreetingAfterFade, 800);
  }, 1500);
}

function hideGreetingAfterFade() {
  refSummeryUser.style.display = "none";
  localStorage.setItem("greetingShown", "true");
}

async function loadSummaryTasks() {
  const response = await fetch(`${BASE_URL}tasks.json`);
  return response.json();
}

function updateBoardMetrics(allTasks, tasksByColumn) {
  updateMetricCount("to_do_count", tasksByColumn.to_do.length, "To-do");
  updateMetricCount("done_count", tasksByColumn.done.length, "Done");
  updateMetricCount("board_count", allTasks.length, "Tasks in <br> Board");
  updateMetricCount("progress_count", tasksByColumn.in_progress.length, "Tasks in <br> Progress");
  updateMetricCount("feedback_count", tasksByColumn.await_feedback.length, "Awaiting <br> Feedback");
}

function createEmptyTaskGroups() {
  return { to_do: [], in_progress: [], await_feedback: [], done: [] };
}

function pushTaskIntoGroup(grouped, task) {
  const key = normalizeStatusKey(task.status);
  if (!grouped[key]) return;
  grouped[key].push(task);
}

function getUpcomingDeadline(tasks) {
  return tasks.map((task) => parseDueDate(task.dueDate)).filter(Boolean).sort((left, right) => left - right)[0];
}

function buildNoDeadlineMarkup(label) {
  return `No deadline<br><span>${label}</span>`;
}

function buildDeadlineMarkup(date, label) {
  return `${formatDeadline(date)}<br><span>${label}</span>`;
}