/**
 * Returns the initials for a contact name.
 * 
 * Splits the provided name into words and derives either the first
 * two letters or the first and last initials in uppercase form.
 * 
 * @param {string} name - Full contact name.
 * @returns {string} The derived initials.
 */
export function getContactInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a stable avatar color for a contact name.
 * 
 * Maps the contact name length to one of the predefined avatar colors
 * so the same name keeps the same visual color consistently.
 * 
 * @param {string} name - Full contact name.
 * @returns {string} A hex color value for the avatar.
 */
export function getContactColor(name) {
  return ["#ff7a00", "#9327ff", "#00c4cc", "#1fd7c1", "#ff5eb3", "#6e52ff"][String(name || "").length % 6];
}