import { extractIDs } from "./list.js";

/**
 * Collects the form values for a new contact payload.
 * 
 * Reads the current add-contact dialog inputs and builds the
 * normalized contact object used for persistence.
 * 
 * @param {number} contactsIndex - Dialog index used to resolve input ids.
 * @returns {Object} The new contact payload.
 */
export function insertNewContactData(contactsIndex) {
    let contactInputEmail = document.getElementById(`contact_dialog_input_email_${contactsIndex}`);
    let contactInputName = document.getElementById(`contact_dialog_input_name_${contactsIndex}`);
    let contactInputPhone = document.getElementById(`contact_dialog_input_phone_${contactsIndex}`);
    return {
        id: extractIDs(),
        name: contactInputName.value,
        email: contactInputEmail.value,
        phone: contactInputPhone.value
    };
}

/**
 * Collects the updated form values for an existing contact.
 * 
 * Reads the edit dialog inputs and rebuilds the current contact object
 * while preserving the existing contact id.
 * 
 * @param {number} contactsIndex - Contact index used to resolve inputs.
 * @returns {Object} The updated contact payload.
 */
export function editCurrentContactData(contactsIndex) {
    let contactInputEmail = document.getElementById(`contact_dialog_input_email_${contactsIndex}`);
    let contactInputName = document.getElementById(`contact_dialog_input_name_${contactsIndex}`);
    let contactInputPhone = document.getElementById(`contact_dialog_input_phone_${contactsIndex}`);
    return {
        id: contactsList[contactsIndex].id,
        name: contactInputName.value,
        email: contactInputEmail.value,
        phone: contactInputPhone.value
    };
}



/**
 * Normalizes a status string for comparisons.
 * 
 * Converts underscores and hyphens to spaces and lowercases
 * the value so status checks can be compared consistently.
 * 
 * @param {string} status - Raw status string.
 * @returns {string} Normalized status value.
 */
export function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();
}

/**
 * Normalizes a category string for comparisons.
 * 
 * Lowercases the input and collapses repeated whitespace so
 * category values can be compared in a stable format.
 * 
 * @param {string} category - Raw category string.
 * @returns {string} Normalized category value.
 */
export function normalizeCategory(category) {
  return String(category || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}