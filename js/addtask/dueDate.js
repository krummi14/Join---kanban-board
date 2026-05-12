import { closeOutside } from "./dropdowns.js";

const INVALID_DATE_HINT = "Imagine you have zero cookies and want to share them with zero friends.";
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
  const navButton = getScopedDueDateMatch(context, target, "[data-due-date-nav]");
  if (navButton) {
    changeVisibleMonth(context, Number(navButton.dataset.dueDateNav));
    return true;
  }

  const dayButton = getScopedDueDateMatch(context, target, "[data-due-date-value]");
  if (dayButton) {
    if (dayButton.dataset.dueDateDisabled === "true") return true;
    selectDueDate(context, dayButton.dataset.dueDateValue);
    return true;
  }

  const toggle = getScopedDueDateMatch(context, target, "[data-due-date-toggle]");
  if (!toggle) return false;
  toggleDueDatePicker(context);
  return true;
}

export function handleDueDateKeydown(context, event) {
  const toggle = getScopedDueDateMatch(context, event.target, "[data-due-date-toggle]");
  if (!toggle) return false;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleDueDatePicker(context);
    return true;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeDueDatePicker(context);
    return true;
  }

  return false;
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
  const monthStart = getMonthStart(viewDate);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const leadingEmptyDays = (monthStart.getDay() + 6) % 7;
  const totalDays = monthEnd.getDate();
  const todayValue = context.state.dueDateMin;
  const selectedValue = context.elements.dueDate?.dataset.isoValue || "";
  const cells = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push('<span class="due_date_day due_date_day_empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const cellValue = formatISODate(cellDate);
    const isSelected = cellValue === selectedValue;
    const isPast = cellValue < todayValue && !isSelected;
    const isToday = cellValue === todayValue;
    const classes = ["due_date_day"];

    if (isPast) classes.push("due_date_day_disabled");
    if (isSelected) classes.push("due_date_day_selected");
    if (isToday) classes.push("due_date_day_today");

    cells.push(`
      <button
        type="button"
        class="${classes.join(" ")}"
        data-due-date-value="${cellValue}"
        data-due-date-disabled="${String(isPast)}"
        aria-disabled="${String(isPast)}"
        tabindex="${isPast ? "-1" : "0"}">
        <span class="due_date_day_number">${day}</span>
        ${isPast ? `<span class="due_date_day_hint">${INVALID_DATE_HINT}</span>` : ""}
      </button>
    `);
  }

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
  const normalizedValue = normalizeDisplayInput(input.value);
  if (input.value !== normalizedValue) {
    input.value = normalizedValue;
  }

  const isoValue = parseDisplayDate(normalizedValue);
  input.dataset.isoValue = isoValue || "";
  if (isoValue) {
    const parsed = parseISODate(isoValue);
    if (parsed) {
      context.state.dueDateView = getMonthStart(parsed);
      renderDueDatePicker(context);
    }
  }
}

function finalizeManualDueDateInput(context) {
  const input = context.elements.dueDate;
  if (!input) return;

  clearDueDateValidation(input);
  const isoValue = parseDisplayDate(input.value);
  if (!isoValue) {
    input.value = input.value.trim() ? "" : input.value;
    input.dataset.isoValue = "";
    renderDueDatePicker(context);
    return;
  }

  if (isoValue < context.state.dueDateMin) {
    input.dataset.isoValue = "";
    input.setCustomValidity(INVALID_DATE_HINT);
    input.reportValidity();
    renderDueDatePicker(context);
    return;
  }

  syncDueDateValue(context, isoValue);
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
