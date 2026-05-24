/** Toggles a dropdown between its open and closed states. */
export function toggleDropdown(toggle, menu, wrapper) {
  if (!toggle || !menu) return;
  setDropdownState(toggle, menu, wrapper, !menu.classList.contains("open"));
}

/** Applies the requested open state to a dropdown. */
export function setDropdownState(toggle, menu, wrapper, isOpen) {
  if (!toggle || !menu) return;
  menu.classList.toggle("open", isOpen);
  menu.classList.toggle("d_none", !isOpen);
  wrapper?.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

/** Closes a dropdown when a click happens outside its wrapper. */
export function closeOutside(event, wrapper, close) {
  if (!wrapper || wrapper.contains(event.target)) return;
  close();
}