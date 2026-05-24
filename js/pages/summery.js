/** Returns whether the summary page is currently in mobile mode. */
function isMobileMode() {
  return window.matchMedia("(max-width: 1115px)").matches;
}

/** Renders the greeting text and user badge. */
function renderGreeting() {
  updateGreetingText();
  updateGreetingUser();

  refUser.innerHTML = getInitials(userName);
}

/** Updates the greeting text element. */
function updateGreetingText() {
  const greetingText = document.getElementById("greeting_text");

  if (!greetingText) return;

  greetingText.textContent = `${getGreetingByTime()},`;
}

/** Updates the personalized greeting content. */
function updateGreetingUser() {
  const greetingText = document.getElementById("greeting_text");
  const userNameElement = document.getElementById("user_name");

  if (!greetingText || !userNameElement) return;

  if (hasPersonalGreeting()) {
    greetingText.textContent = `${getGreetingByTime()},`;
    userNameElement.textContent = userName;
    return;
  }

  greetingText.textContent = `${getGreetingByTime()}!`;
  userNameElement.textContent = "";
}

/** Returns the greeting text for the current time of day. */
function getGreetingByTime() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";

  return "Good Evening";
}

/** Synchronizes the greeting visibility with the current viewport. */
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

/** Initializes the summary page greeting and metrics. */
async function initSummery() {
  if (shouldSkipGreeting()) return renderSummaryWithoutGreeting();

  showGreeting();

  if (isMobileMode()) scheduleGreetingFadeOut();

  await renderSummaryMetrics();
}

/** Loads tasks and renders the summary metrics. */
async function renderSummaryMetrics() {
  try {
    const data = await loadSummaryTasks();
    const allTasks = normalizeTasks(data);
    const tasksByColumn = groupTasksByColumn(allTasks);

    updateBoardMetrics(allTasks, tasksByColumn);

    const urgentTasks = allTasks.filter(
      (task) => String(task.priority || "").toLowerCase() === "urgent"
    );

    updateMetricCount("urgent_count", urgentTasks.length, "Urgent");
    updateDeadline(urgentTasks);

  } catch (error) {
    console.error("Failed to load summary metrics.", error);
  }
}

/** Normalizes the loaded task collection into an array. */
function normalizeTasks(data) {
  return Object.values(data || {})
    .filter((task) => task && typeof task === "object");
}

/** Groups tasks by their normalized board column. */
function groupTasksByColumn(tasks) {
  const grouped = createEmptyTaskGroups();

  tasks.forEach((task) => pushTaskIntoGroup(grouped, task));

  return grouped;
}

/** Normalizes a task status into the internal status key format. */
function normalizeStatusKey(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\s+/g, "_");
}

  /** Updates a single metric counter element. */
function updateMetricCount(elementId, count, label) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.innerHTML = `${count}<br><span>${label}</span>`;
}

/** Updates the upcoming deadline section. */
function updateDeadline(tasks) {
  const deadlineElement = document.getElementById("deadline");

  if (!deadlineElement) return;

  const label = "Upcoming Deadline";
  const upcomingDate = getUpcomingDeadline(tasks);

  deadlineElement.innerHTML = upcomingDate
    ? buildDeadlineMarkup(upcomingDate, label)
    : buildNoDeadlineMarkup(label);
}

/** Parses a due-date value into a valid Date object. */
function parseDueDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a deadline date for display. */
function formatDeadline(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Returns whether the current user should see a personal greeting. */
function hasPersonalGreeting() {
  return userName && userName !== "Guest";
}

/** Returns whether the greeting screen should be skipped. */
function shouldSkipGreeting() {
  return localStorage.getItem("greetingShown") == "true"
    && isMobileMode();
}

/** Renders the summary view without showing the greeting screen. */
async function renderSummaryWithoutGreeting() {
  refSummeryUser.style.display = "none";

  userInitials();

  await renderSummaryMetrics();
}

/** Shows the greeting section. */
function showGreeting() {
  refSummeryUser.style.display = "flex";
  renderGreeting();
}

/** Schedules the greeting to fade out on mobile. */
function scheduleGreetingFadeOut() {
  setTimeout(() => {
    refSummeryUser.classList.add("fadeOut");

    setTimeout(hideGreetingAfterFade, 800);
  }, 1500);
}

/** Hides the greeting after the fade-out animation completes. */
function hideGreetingAfterFade() {
  refSummeryUser.style.display = "none";

  localStorage.setItem("greetingShown", "true");
}

/** Loads the task data used by the summary page. */
async function loadSummaryTasks() {
  const response = await fetch(`${BASE_URL}tasks.json`);

  return response.json();
}

/** Updates all board-related summary metric tiles. */
function updateBoardMetrics(allTasks, tasksByColumn) {
  updateMetricCount(
    "to_do_count",
    tasksByColumn.to_do.length,
    "To-do"
  );

  updateMetricCount(
    "done_count",
    tasksByColumn.done.length,
    "Done"
  );

  updateMetricCount(
    "board_count",
    allTasks.length,
    "Tasks in <br> Board"
  );

  updateMetricCount(
    "progress_count",
    tasksByColumn.in_progress.length,
    "Tasks in <br> Progress"
  );

  updateMetricCount(
    "feedback_count",
    tasksByColumn.await_feedback.length,
    "Awaiting <br> Feedback"
  );
}

/** Creates empty task groups for each board column. */
function createEmptyTaskGroups() {
  return {
    to_do: [],
    in_progress: [],
    await_feedback: [],
    done: [],
  };
}

/** Pushes a task into the matching normalized task group. */
function pushTaskIntoGroup(grouped, task) {
  const key = normalizeStatusKey(task.status);

  if (!grouped[key]) return;

  grouped[key].push(task);
}

/** Returns the earliest upcoming deadline from a task list. */
function getUpcomingDeadline(tasks) {
  return tasks
    .map((task) => parseDueDate(task.dueDate))
    .filter(Boolean)
    .sort((left, right) => left - right)[0];
}

  /** Builds the fallback markup when no deadline exists. */
function buildNoDeadlineMarkup(label) {
  return `No deadline<br><span>${label}</span>`;
}

/** Builds the markup for a formatted upcoming deadline. */
function buildDeadlineMarkup(date, label) {
  return `${formatDeadline(date)}<br><span>${label}</span>`;
}