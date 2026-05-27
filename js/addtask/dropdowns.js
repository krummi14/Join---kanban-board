/**
 * Toggles a dropdown between its open and closed states.
 * 
 * Determines the next dropdown state from the current menu classes
 * and forwards the update to the shared dropdown state helper.
 * 
 * @param {HTMLElement|null} toggle - Toggle element controlling the dropdown.
 * @param {HTMLElement|null} menu - Dropdown menu element.
 * @param {HTMLElement|null} wrapper - Wrapper element for styling state.
 */
export function toggleDropdown(toggle, menu, wrapper) {
  if (!toggle || !menu) return;
  setDropdownState(toggle, menu, wrapper, !menu.classList.contains("open"));
}

/**
 * Applies the requested open state to a dropdown.
 * 
 * Synchronizes the CSS classes and accessibility state for the menu,
 * wrapper, and toggle element according to the requested state.
 * 
 * @param {HTMLElement|null} toggle - Toggle element controlling the dropdown.
 * @param {HTMLElement|null} menu - Dropdown menu element.
 * @param {HTMLElement|null} wrapper - Wrapper element for styling state.
 * @param {boolean} isOpen - Whether the dropdown should be open.
 */
export function setDropdownState(toggle, menu, wrapper, isOpen) {
  if (!toggle || !menu) return;
  menu.classList.toggle("open", isOpen);
  menu.classList.toggle("d_none", !isOpen);
  wrapper?.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

/**
 * Closes a dropdown when a click happens outside its wrapper.
 * 
 * Ignores clicks inside the wrapper and otherwise calls the provided
 * close callback to collapse the related dropdown UI.
 * 
 * @param {Event} event - Click event to evaluate.
 * @param {HTMLElement|null} wrapper - Wrapper element for the dropdown.
 * @param {Function} close - Callback that closes the dropdown.
 */
export function closeOutside(event, wrapper, close) {
  if (!wrapper || wrapper.contains(event.target)) return;
  close();
}