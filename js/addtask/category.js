import { setDropdownState, toggleDropdown } from "./dropdowns.js";

const DEFAULT_CATEGORY_LABEL = "Select task category";
const CATEGORIES = ["Technical Task", "User Story"];

export function renderCategoryOptions(context) {
  const menu = context.elements.categoryMenu;
  if (!menu) return;

  menu.innerHTML = CATEGORIES
    .map((category) => `<button type="button" class="category_option" data-category-value="${category}">${category}</button>`)
    .join("");
}

export function setCategory(context, categoryValue) {
  if (!categoryValue) {
    resetCategorySelection(context);
    return;
  }
  context.state.selectedCategory = categoryValue;
  if (context.elements.category) context.elements.category.value = categoryValue;
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = categoryValue;
}

export function selectCategory(context, categoryValue) {
  setCategory(context, categoryValue);
  closeCategoryDropdown(context);
}

export function resetCategorySelection(context) {
  context.state.selectedCategory = "";
  if (context.elements.category) context.elements.category.value = "";
  if (context.elements.categoryLabel) context.elements.categoryLabel.textContent = DEFAULT_CATEGORY_LABEL;
}

export function validateCategorySelection(context) {
  if (context.state.selectedCategory) return true;
  context.elements.categoryToggle?.focus();
  return false;
}

export function toggleCategoryDropdown(context) {
  toggleDropdown(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown);
}

export function closeCategoryDropdown(context) {
  setDropdownState(context.elements.categoryToggle, context.elements.categoryMenu, context.elements.categoryDropdown, false);
}