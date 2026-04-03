import { extractIDs } from "./list.js";

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

