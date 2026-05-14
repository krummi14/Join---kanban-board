import { closeOutside } from "./dropdowns.js";

const INVALID_DATE_HINT = "Imagine you have zero cookies and want to share them with zero friends.";
console.log("DEBUG INVALID_DATE_HINT:", INVALID_DATE_HINT);
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function initializeDueDatePicker(context) {
  const input = context.elements.dueDate;
  if (!input) return;

  context.state.dueDateMin = getTodayDateString();
  context.state.dueDateView = getMonthStart(getStoredDueDate(context) || new Date());
  registerDueDateInputEvents(context);
  syncDueDateValue(context, input.value || "");
}

export function closeDueDatePicker(context) {
  setDueDatePickerState(context, false);
}

export function closeDueDatePickerOnOutsideClick(context, event) {
  closeOutside(event, context.elements.dueDatePicker, () => closeDueDatePicker(context));
}

export function handleDueDateClick(context, target) {
  if (handleDueDateNavClick(context, target)) return true;
  if (handleDueDateDayClick(context, target)) return true;
  return handleDueDateToggleClick(context, target);
}

export function handleDueDateKeydown(context, event) {
  const toggle = getScopedDueDateMatch(context, event.target, "[data-due-date-toggle]");
  if (!toggle) return false;
  if (handleDueDateToggleKey(context, event)) return true;
  return handleDueDateEscapeKey(context, event);
}

export function resetDueDatePicker(context) {
  syncDueDateValue(context, "");
  closeDueDatePicker(context);
}

export function setDueDateValue(context, value) {
  syncDueDateValue(context, value || "");
}

export function getDueDateStorageValue(context) {
  return context.elements.dueDate?.dataset.isoValue || "";
}

function toggleDueDatePicker(context) {
  const isOpen = context.elements.dueDateMenu?.classList.contains("open");
  setDueDatePickerState(context, !isOpen);
}

function setDueDatePickerState(context, isOpen) {
  const { dueDateMenu, dueDate } = context.elements;
  if (!dueDateMenu || !dueDate) return;
  dueDateMenu.classList.toggle("open", isOpen);
  dueDateMenu.classList.toggle("d_none", !isOpen);
  context.elements.dueDatePicker?.classList.toggle("open", isOpen);
  dueDate.setAttribute("aria-expanded", String(isOpen));
}

function changeVisibleMonth(context, offset) {
  const currentView = context.state.dueDateView || getMonthStart(new Date());
  context.state.dueDateView = new Date(currentView.getFullYear(), currentView.getMonth() + offset, 1);
  renderDueDatePicker(context);
}

function selectDueDate(context, value) {
  syncDueDateValue(context, value);
  closeDueDatePicker(context);
}

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

function buildDayGridMarkup(context, viewDate) {
  const monthData = getDueDateMonthData(context, viewDate);
  const cells = [];
  addLeadingEmptyCells(cells, monthData.leadingEmptyDays);
  addDueDateDayCells(cells, monthData);
  return cells.join("");
}

function getScopedDueDateMatch(context, target, selector) {
  const element = target.closest(selector);
  return element && context.taskForm.contains(element) ? element : null;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getTodayDateString() {
  return formatISODate(new Date());
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDueDateWeekdayLabels() {
  return WEEKDAY_LABELS.slice();
}

function registerDueDateInputEvents(context) {
  const input = context.elements.dueDate;
  if (!input || input.dataset.manualDueDateBound === "true") return;

  input.dataset.manualDueDateBound = "true";
  input.addEventListener("input", () => handleManualDueDateInput(context));
  input.addEventListener("blur", () => finalizeManualDueDateInput(context));
}

function handleManualDueDateInput(context) {
  const input = context.elements.dueDate;
  if (!input) return;
  clearDueDateValidation(input);
  const normalizedValue = syncNormalizedDueDateInput(input);
  updateManualDueDateIsoValue(context, input, normalizedValue);
}

function finalizeManualDueDateInput(context) {
  const input = context.elements.dueDate;
  if (!input) return;
  clearDueDateValidation(input);
  const isoValue = parseDisplayDate(input.value);
  if (!isoValue) return resetInvalidManualDueDateInput(context, input);
  if (isPastDueDate(context, isoValue)) return reportPastDueDate(context, input);
  syncDueDateValue(context, isoValue);
}

function handleDueDateNavClick(context, target) {
  const navButton = getScopedDueDateMatch(context, target, "[data-due-date-nav]");
  if (!navButton) return false;
  changeVisibleMonth(context, Number(navButton.dataset.dueDateNav));
  return true;
}

function handleDueDateDayClick(context, target) {
  const dayButton = getScopedDueDateMatch(context, target, "[data-due-date-value]");
  if (!dayButton) return false;
  if (dayButton.dataset.dueDateDisabled !== "true") {
    selectDueDate(context, dayButton.dataset.dueDateValue);
  }
  return true;
}

function handleDueDateToggleClick(context, target) {
  const toggle = getScopedDueDateMatch(context, target, "[data-due-date-toggle]");
  if (!toggle) return false;
  toggleDueDatePicker(context);
  return true;
}

function handleDueDateToggleKey(context, event) {
  if (event.key !== "Enter" && event.key !== " ") return false;
  event.preventDefault();
  toggleDueDatePicker(context);
  return true;
}

function handleDueDateEscapeKey(context, event) {
  if (event.key !== "Escape") return false;
  event.preventDefault();
  closeDueDatePicker(context);
  return true;
}

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

function addLeadingEmptyCells(cells, leadingEmptyDays) {
  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push('<span class="due_date_day due_date_day_empty" aria-hidden="true"></span>');
  }
}

function addDueDateDayCells(cells, monthData) {
  for (let day = 1; day <= monthData.totalDays; day += 1) {
    cells.push(createDueDateDayCell(day, monthData));
  }
}

function createDueDateDayCell(day, monthData) {
  const cellState = getDueDateDayState(day, monthData);
  const dayHint = getDueDateDayHint(cellState.isPast);
  return `
      <button type="button" class="${cellState.classes.join(" ")}" data-due-date-value="${cellState.value}" data-due-date-disabled="${String(cellState.isPast)}" aria-disabled="${String(cellState.isPast)}" tabindex="${cellState.isPast ? "-1" : "0"}">
        <span class="due_date_day_number">${day}</span>${dayHint}
      </button>
    `;
}

function getDueDateDayHint(isPast) {
  if (!isPast) return "";
  return `<span class="due_date_day_hint">${INVALID_DATE_HINT}</span>`;
}

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

function getDueDateDayClasses(cellValue, monthData, isSelected, isPast) {
  const classes = ["due_date_day"];
  if (isPast) classes.push("due_date_day_disabled");
  if (isSelected) classes.push("due_date_day_selected");
  if (cellValue === monthData.todayValue) classes.push("due_date_day_today");
  return classes;
}

function syncNormalizedDueDateInput(input) {
  const normalizedValue = normalizeDisplayInput(input.value);
  if (input.value !== normalizedValue) input.value = normalizedValue;
  return normalizedValue;
}

function updateManualDueDateIsoValue(context, input, normalizedValue) {
  const isoValue = parseDisplayDate(normalizedValue);
  input.dataset.isoValue = isoValue || "";
  if (!isoValue) return;
  const parsed = parseISODate(isoValue);
  if (!parsed) return;
  context.state.dueDateView = getMonthStart(parsed);
  renderDueDatePicker(context);
}

function resetInvalidManualDueDateInput(context, input) {
  input.value = input.value.trim() ? "" : input.value;
  input.dataset.isoValue = "";
  renderDueDatePicker(context);
}

function isPastDueDate(context, isoValue) {
  return isoValue < context.state.dueDateMin;
}

function reportPastDueDate(context, input) {
  input.dataset.isoValue = "";
  input.setCustomValidity(INVALID_DATE_HINT);
  input.reportValidity();
  renderDueDatePicker(context);
}

function getStoredDueDate(context) {
  const isoValue = context.elements.dueDate?.dataset.isoValue || "";
  return parseISODate(isoValue);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

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

function normalizeDisplayInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  const first = digits.slice(0, 2);
  const second = digits.slice(2, 4);
  const third = digits.slice(4, 8);
  return [first, second, third].filter(Boolean).join("/");
}

function clearDueDateValidation(input) {
  input.setCustomValidity("");
}
