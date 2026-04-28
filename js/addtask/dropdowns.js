export function toggleDropdown(toggle, menu, wrapper) {
  if (!toggle || !menu) return;
  setDropdownState(toggle, menu, wrapper, !menu.classList.contains("open"));
}

export function setDropdownState(toggle, menu, wrapper, isOpen) {
  if (!toggle || !menu) return;
  menu.classList.toggle("open", isOpen);
  menu.classList.toggle("d_none", !isOpen);
  wrapper?.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

export function closeOutside(event, wrapper, close) {
  if (!wrapper || wrapper.contains(event.target)) return;
  close();
}