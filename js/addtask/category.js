import { setDropdownState, toggleDropdown } from "./dropdowns.js";

const DEFAULT_CATEGORY_LABEL = "Select task category";
const CATEGORIES = ["Technical Task", "User Story"];

/** Renders the available task category options. */
export function renderCategoryOptions(context) {
  const menu = context.elements.categoryMenu;
  if (!menu) return;

  menu.innerHTML = CATEGORIES
    .map((category) => `<button type="button" class="category_option" data-category-value="${category}">${category}</button>`)
    .join("");
}

  /** Stores the selected category and updates the UI. */
export function setCategory(context, categoryValue) {
  if (!categoryValue) {
    resetCategorySelection(context);
    return;
  }
  context.state.selectedCategory = categoryValue;
  if (context.elements.category) context.elements.category.value = categoryValue;
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = categoryValue;
}

/** Selects a category and closes the dropdown. */
export function selectCategory(context, categoryValue) {
  setCategory(context, categoryValue);
  closeCategoryDropdown(context);
}

/** Clears the current category selection. */
export function resetCategorySelection(context) {
  context.state.selectedCategory = "";
  if (context.elements.category) context.elements.category.value = "";
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
}

/** Verifies that a category is currently selected. */
export function validateCategorySelection(context) {
  if (context.state.selectedCategory) return true;
  context.elements.categoryToggle?.focus();
  return false;
}

/** Opens or closes the category dropdown. */
export function toggleCategoryDropdown(context) {
  toggleDropdown(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown);
}

/** Closes the category dropdown. */
export function closeCategoryDropdown(context) {
  setDropdownState(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown, false);
}