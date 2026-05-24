import { closeOutside } from "./dropdowns.js";

const INVALID_DATE_HINT = "Imagine you have zero cookies and want to share them with zero friends.";
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Initializes the due-date picker state and event bindings. */
export function initializeDueDatePicker(context) {
  const input = context.elements.dueDate;
  if (!input) return;

  context.state.dueDateMin = getTodayDateString();
  context.state.dueDateView = getMonthStart(getStoredDueDate(context) || new Date());
  registerDueDateInputEvents(context);
  syncDueDateValue(context, input.value || "");
}

/** Closes the due-date picker. */
export function closeDueDatePicker(context) {
  setDueDatePickerState(context, false);
}

/** Closes the due-date picker when clicking outside of it. */
export function closeDueDatePickerOnOutsideClick(context, event) {
  closeOutside(event, context.elements.dueDatePicker, () => closeDueDatePicker(context));
}

/** Handles click interactions inside the due-date picker. */
export function handleDueDateClick(context, target) {
  if (handleDueDateNavClick(context, target)) return true;
  if (handleDueDateDayClick(context, target)) return true;
  return handleDueDateToggleClick(context, target);
}

/** Handles keyboard interactions for the due-date picker toggle. */
export function handleDueDateKeydown(context, event) {
  const toggle = getScopedDueDateMatch(context, event.target, "[data-due-date-toggle]");
  if (!toggle) return false;
  if (handleDueDateToggleKey(context, event)) return true;
  return handleDueDateEscapeKey(context, event);
}

/** Resets the due-date picker to its empty state. */
export function resetDueDatePicker(context) {
  syncDueDateValue(context, "");
  closeDueDatePicker(context);
}

/** Sets the stored due-date value for the form. */
export function setDueDateValue(context, value) {
  syncDueDateValue(context, value || "");
}

/** Returns the ISO due-date value stored on the input. */
export function getDueDateStorageValue(context) {
  return context.elements.dueDate?.dataset.isoValue || "";
}

/** Toggles the due-date picker open state. */
function toggleDueDatePicker(context) {
  const isOpen = context.elements.dueDateMenu?.classList.contains("open");
  setDueDatePickerState(context, !isOpen);
}

/** Applies the open state to the due-date picker elements. */
function setDueDatePickerState(context, isOpen) {
  const { dueDateMenu, dueDate } = context.elements;
  if (!dueDateMenu || !dueDate) return;
  dueDateMenu.classList.toggle("open", isOpen);
  dueDateMenu.classList.toggle("d_none", !isOpen);
  context.elements.dueDatePicker?.classList.toggle("open", isOpen);
  dueDate.setAttribute("aria-expanded", String(isOpen));
}

/** Changes the currently visible calendar month. */
function changeVisibleMonth(context, offset) {
  const currentView = context.state.dueDateView || getMonthStart(new Date());
  context.state.dueDateView = new Date(currentView.getFullYear(), currentView.getMonth() + offset, 1);
  renderDueDatePicker(context);
}

/** Selects a due date and closes the picker. */
function selectDueDate(context, value) {
  syncDueDateValue(context, value);
  closeDueDatePicker(context);
}

/** Synchronizes the stored and displayed due-date values. */
function syncDueDateValue(context, value) {
  const input = context.elements.dueDate;
  if (!input) return;

  clearDueDateValidation(input);
  input.dataset.isoValue = value;
  input.value = formatDisplayDate(value);
  const selectedDate = parseISODate(value);
  context.state.dueDateView = getMonthStart(selectedDate || new Date());
  renderDueDatePicker(context);
}

/** Renders the visible due-date picker month and day grid. */
function renderDueDatePicker(context) {
  const { dueDateMonthLabel, dueDateDays } = context.elements;
  const viewDate = context.state.dueDateView || getMonthStart(new Date());
  if (dueDateMonthLabel) {
    dueDateMonthLabel.textContent = formatMonthYear(viewDate);
  }
  if (dueDateDays) {
    dueDateDays.innerHTML = buildDayGridMarkup(context, viewDate);
  }
}

/** Builds the day-grid markup for the visible due-date month. */
function buildDayGridMarkup(context, viewDate) {
  const monthData = getDueDateMonthData(context, viewDate);
  const cells = [];
  addLeadingEmptyCells(cells, monthData.leadingEmptyDays);
  addDueDateDayCells(cells, monthData);
  return cells.join("");
}

/** Returns a selector match scoped to the current form. */
function getScopedDueDateMatch(context, target, selector) {
  const element = target.closest(selector);
  return element && context.taskForm.contains(element) ? element : null;
}

/** Formats a date as a month and year label. */
function formatMonthYear(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Returns the first day of the date's month. */
function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns today's date as an ISO string. */
function getTodayDateString() {
  return formatISODate(new Date());
}

/** Formats a date object as an ISO date string. */
function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses an ISO date string into a Date object. */
function parseISODate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Returns the weekday labels used by the due-date picker. */
export function getDueDateWeekdayLabels() {
  return WEEKDAY_LABELS.slice();
}

/** Registers the manual input listeners for the due-date field. */
function registerDueDateInputEvents(context) {
  const input = context.elements.dueDate;
  if (!input || input.dataset.manualDueDateBound === "true") return;

  input.dataset.manualDueDateBound = "true";
  input.addEventListener("input", () => handleManualDueDateInput(context));
  input.addEventListener("blur", () => finalizeManualDueDateInput(context));
}

/** Handles manual typing inside the due-date input. */
function handleManualDueDateInput(context) {
  const input = context.elements.dueDate;
  if (!input) return;
  clearDueDateValidation(input);
  const normalizedValue = syncNormalizedDueDateInput(input);
  updateManualDueDateIsoValue(context, input, normalizedValue);
}

/** Validates and finalizes a manually entered due date. */
function finalizeManualDueDateInput(context) {
  const input = context.elements.dueDate;
  if (!input) return;
  clearDueDateValidation(input);
  const isoValue = parseDisplayDate(input.value);
  if (!isoValue) return resetInvalidManualDueDateInput(context, input);
  if (isPastDueDate(context, isoValue)) return reportPastDueDate(context, input);
  syncDueDateValue(context, isoValue);
}

/** Handles clicks on the due-date month navigation controls. */
function handleDueDateNavClick(context, target) {
  const navButton = getScopedDueDateMatch(context, target, "[data-due-date-nav]");
  if (!navButton) return false;
  changeVisibleMonth(context, Number(navButton.dataset.dueDateNav));
  return true;
}

/** Handles clicks on individual due-date day cells. */
function handleDueDateDayClick(context, target) {
  const dayButton = getScopedDueDateMatch(context, target, "[data-due-date-value]");
  if (!dayButton) return false;
  if (dayButton.dataset.dueDateDisabled !== "true") {
    selectDueDate(context, dayButton.dataset.dueDateValue);
  }
  return true;
}

/** Handles clicks on the due-date toggle control. */
function handleDueDateToggleClick(context, target) {
  const toggle = getScopedDueDateMatch(context, target, "[data-due-date-toggle]");
  if (!toggle) return false;
  toggleDueDatePicker(context);
  return true;
}

/** Handles keyboard toggling of the due-date picker. */
function handleDueDateToggleKey(context, event) {
  if (event.key !== "Enter" && event.key !== " ") return false;
  event.preventDefault();
  toggleDueDatePicker(context);
  return true;
}

/** Handles Escape key presses for the due-date picker. */
function handleDueDateEscapeKey(context, event) {
  if (event.key !== "Escape") return false;
  event.preventDefault();
  closeDueDatePicker(context);
  return true;
}

/** Builds the month metadata used to render the due-date grid. */
function getDueDateMonthData(context, viewDate) {
  const monthStart = getMonthStart(viewDate);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  return {
    monthStart,
    totalDays: monthEnd.getDate(),
    leadingEmptyDays: (monthStart.getDay() + 6) % 7,
    todayValue: context.state.dueDateMin,
    selectedValue: context.elements.dueDate?.dataset.isoValue || "",
  };
}

/** Adds the leading empty cells before the first weekday. */
function addLeadingEmptyCells(cells, leadingEmptyDays) {
  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push('<span class="due_date_day due_date_day_empty" aria-hidden="true"></span>');
  }
}

/** Adds the clickable day cells for the visible month. */
function addDueDateDayCells(cells, monthData) {
  for (let day = 1; day <= monthData.totalDays; day += 1) {
    cells.push(createDueDateDayCell(day, monthData));
  }
}

/** Creates the markup for a single due-date day cell. */
function createDueDateDayCell(day, monthData) {
  const cellState = getDueDateDayState(day, monthData);
  const dayHint = getDueDateDayHint(cellState.isPast);
  return `
      <button type="button" class="${cellState.classes.join(" ")}" data-due-date-value="${cellState.value}" data-due-date-disabled="${String(cellState.isPast)}" aria-disabled="${String(cellState.isPast)}" tabindex="${cellState.isPast ? "-1" : "0"}">
        <span class="due_date_day_number">${day}</span>${dayHint}
      </button>
    `;
}

/** Returns the hint markup for disabled past dates. */
function getDueDateDayHint(isPast) {
  if (!isPast) return "";
  return `<span class="due_date_day_hint">${INVALID_DATE_HINT}</span>`;
}

/** Computes the state object for a single due-date day. */
function getDueDateDayState(day, monthData) {
  const cellValue = formatISODate(new Date(monthData.monthStart.getFullYear(), monthData.monthStart.getMonth(), day));
  const isSelected = cellValue === monthData.selectedValue;
  const isPast = cellValue < monthData.todayValue && !isSelected;
  return {
    value: cellValue,
    isPast,
    classes: getDueDateDayClasses(cellValue, monthData, isSelected, isPast),
  };
}

/** Builds the CSS class list for a due-date day cell. */
function getDueDateDayClasses(cellValue, monthData, isSelected, isPast) {
  const classes = ["due_date_day"];
  if (isPast) classes.push("due_date_day_disabled");
  if (isSelected) classes.push("due_date_day_selected");
  if (cellValue === monthData.todayValue) classes.push("due_date_day_today");
  return classes;
}

/** Normalizes manual input into the expected display format. */
function syncNormalizedDueDateInput(input) {
  const normalizedValue = normalizeDisplayInput(input.value);
  if (input.value !== normalizedValue) input.value = normalizedValue;
  return normalizedValue;
}

/** Updates the stored ISO value from the manual date input. */
function updateManualDueDateIsoValue(context, input, normalizedValue) {
  const isoValue = parseDisplayDate(normalizedValue);
  input.dataset.isoValue = isoValue || "";
  if (!isoValue) return;
  const parsed = parseISODate(isoValue);
  if (!parsed) return;
  context.state.dueDateView = getMonthStart(parsed);
  renderDueDatePicker(context);
}

/** Clears an invalid manually entered due date. */
function resetInvalidManualDueDateInput(context, input) {
  input.value = input.value.trim() ? "" : input.value;
  input.dataset.isoValue = "";
  renderDueDatePicker(context);
}

/** Checks whether the selected due date is in the past. */
function isPastDueDate(context, isoValue) {
  return isoValue < context.state.dueDateMin;
}

/** Reports a validation error for a past due date. */
function reportPastDueDate(context, input) {
  input.dataset.isoValue = "";
  input.setCustomValidity(INVALID_DATE_HINT);
  input.reportValidity();
  renderDueDatePicker(context);
}

/** Returns the currently stored due date as a Date object. */
function getStoredDueDate(context) {
  const isoValue = context.elements.dueDate?.dataset.isoValue || "";
  return parseISODate(isoValue);
}

/** Formats an ISO date string for display in the input field. */
function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Parses a displayed date string into an ISO date string. */
function parseDisplayDate(value) {
  const normalized = normalizeDisplayInput(value);
  const [day, month, year] = normalized.split("/");
  if (!day || !month || !year || year.length !== 4) return "";
  const isoValue = `${year}-${month}-${day}`;
  const parsed = parseISODate(isoValue);
  if (!parsed) return "";
  if (formatISODate(parsed) !== isoValue) return "";
  return isoValue;
}

/** Normalizes raw text input into a date-like display string. */
function normalizeDisplayInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const first = digits.slice(0, 2);
  const second = digits.slice(2, 4);
  const third = digits.slice(4, 8);
  return [first, second, third].filter(Boolean).join("/");
}

/** Clears any active custom validation on the due-date input. */
function clearDueDateValidation(input) {
  input.setCustomValidity("");
}
