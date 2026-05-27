import { setDropdownState, toggleDropdown } from "./dropdowns.js";

const DEFAULT_CATEGORY_LABEL = "Select task category";
const CATEGORIES = ["Technical Task", "User Story"];

/**
 * Renders the available task category options.
 * 
 * Fills the category dropdown menu with the predefined category values
 * so the user can choose one of the supported task types.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function renderCategoryOptions(context) {
  const menu = context.elements.categoryMenu;
  if (!menu) return;

  menu.innerHTML = CATEGORIES
    .map((category) => `<button type="button" class="category_option" data-category-value="${category}">${category}</button>`)
    .join("");
}

/**
 * Stores the selected category and updates the UI.
 * 
 * Persists the selected category value in the shared state and synchronizes
 * the hidden field and visible label with that selection.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} categoryValue - Category value to store.
 */
export function setCategory(context, categoryValue) {
  if (!categoryValue) {
    resetCategorySelection(context);
    return;
  }
  context.state.selectedCategory = categoryValue;
  if (context.elements.category) context.elements.category.value = categoryValue;
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = categoryValue;
}

/**
 * Selects a category and closes the dropdown.
 * 
 * Applies the chosen category value and immediately collapses
 * the category dropdown to finish the interaction.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @param {string} categoryValue - Selected category value.
 */
export function selectCategory(context, categoryValue) {
  setCategory(context, categoryValue);
  closeCategoryDropdown(context);
}

/**
 * Clears the current category selection.
 * 
 * Resets the category state, empties the hidden input,
 * and restores the default placeholder label.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function resetCategorySelection(context) {
  context.state.selectedCategory = "";
  if (context.elements.category) context.elements.category.value = "";
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
}

/**
 * Verifies that a category is currently selected.
 * 
 * Returns whether the form currently contains a selected category.
 * Focuses the category toggle when validation fails.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 * @returns {boolean} True when a category is selected.
 */
export function validateCategorySelection(context) {
  if (context.state.selectedCategory) return true;
  context.elements.categoryToggle?.focus();
  return false;
}

/**
 * Toggles the open state of the category dropdown.
 * 
 * Uses the shared dropdown helper to switch the category menu
 * between expanded and collapsed state.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function toggleCategoryDropdown(context) {
  toggleDropdown(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown);
}

/**
 * Closes the category dropdown.
 * 
 * Forces the category menu into the closed state regardless
 * of whether it was previously open.
 * 
 * @param {Object} context - Shared add-task context with state and elements.
 */
export function closeCategoryDropdown(context) {
  setDropdownState(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown, false);
}