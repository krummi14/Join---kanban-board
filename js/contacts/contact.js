import { getData, putNewData, putEditData, deleteData } from "../shared/firebase.js";
import { createList } from "../shared/list.js";
import { getContactsListHeaderTemplate, getContactsListContentTemplate, getContactsInformationTemplate, getContactDialogTemplate, getContactDialogEditandDeleteMobileTemplate } from "../template/contacts_template.js";

/** Initializes the contacts page data and UI. */
async function initContacts() {
    const data = await getData("/contacts");
    createList(data);
    renderContacts();
    userInitials();
}

/** Validates a contact name field. */
function validateName(name, contactsIndex) {
    const regex = /^[A-Za-z]+ [A-Za-z]+$/;
    if (!regex.test(name)) {
        showError(`name_error_${contactsIndex}`, "Please enter first & last name, letters only.");
        return false;
    }
    showError(`name_error_${contactsIndex}`, "");
    return true;
}

/** Validates a contact phone field. */
function validatePhone(phone, contactsIndex) {
    const regex = /^\+\d{2}\s\d{6,}$/;
    if (!regex.test(phone)) {
        showError(`phone_error_${contactsIndex}`, "Please enter a valid phone number (f.e. +49 184551984)");
        return false;
    }
    showError(`phone_error_${contactsIndex}`, "");
    return true;
}

/** Validates a contact email field. */
function validateEmail(email, contactsIndex) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        showError(`email_error_${contactsIndex}`, "Please enter a valid email address");
        return false;
    }
    showError(`email_error_${contactsIndex}`, "");
    return true;
}

/** Validates the full contact form for the current dialog. */
function validateForm(contactsIndex) {
    let name = document.getElementById(`contact_dialog_input_name_${contactsIndex}`).value.trim();
    let email = document.getElementById(`contact_dialog_input_email_${contactsIndex}`).value.trim();
    let phone = document.getElementById(`contact_dialog_input_phone_${contactsIndex}`).value.trim();
    const validName = validateName(name, contactsIndex);
    const validEmail = validateEmail(email, contactsIndex);
    const validPhone = validatePhone(phone, contactsIndex);
    return validName && validEmail && validPhone;
}

/** Saves changes to an existing contact when the form is valid. */
function saveContact(editOrAddNewContact, contactsIndex) {
    if (!validateForm(contactsIndex)) return;
    editContact(editOrAddNewContact, contactsIndex);
}

/** Saves a newly created contact when the form is valid. */
function saveNewContact(editOrAddNewContact, contactsIndex) {
    if (!validateForm(contactsIndex)) return;
    addNewContact(editOrAddNewContact, contactsIndex);
}

/** Creates a new contact and refreshes the contacts view. */
async function addNewContact(editOrAddNewContact, contactsIndex) {
    activeContact = null;
    let newContactId = await putNewData("/contacts/", contactsIndex);
    renderContacts();
    closeContactDialog(contactsIndex);
    let newContactsIndex = contactsList.findIndex(contact => contact.id == newContactId);
    openContactInformation(newContactsIndex);
    openContactWasCreatedOrEditedSuccesfull(editOrAddNewContact);
}

/** Deletes a contact and updates the open contact state. */
async function deleteContact(openDialog, openContactResponsive, contactsIndex) {
    let deleteIndex = (contactsList[contactsIndex].id) - 1;
    await deleteData("/contacts/" + deleteIndex);
    contactsList = contactsList.filter(contact => contact.id !== deleteIndex + 1);
    renderContacts();
    closeContactInformation(contactsIndex);
    if (openDialog) {
        closeContactDialog(contactsIndex);
    }
    if (openContactResponsive) {
        closeContactInformationResponsive();
    }
}

/** Updates an existing contact and refreshes the current detail view. */
async function editContact(editOrAddNewContact, contactsIndex) {
    activeContact = null;
    let currentContactId = await putEditData("/contacts/", contactsIndex);
    renderContacts();
    let newContactsIndex = contactsList.findIndex(contact => contact.id == currentContactId);
    closeContactDialog(contactsIndex);
    openContactInformation(newContactsIndex);
    openContactWasCreatedOrEditedSuccesfull(editOrAddNewContact);
}

/** Returns the initials for the contact at the given list index. */
export function filterInitialsOfName(contactsIndex) {
    if (contactsIndex == contactsList.length) {
        return;
    } else {
        let contactName = contactsList[contactsIndex].name;
        let initials = contactName.split(' ').map(initial => initial.charAt(0)).join('');
        return initials
    };
}

/** Renders the complete contacts list view. */
function renderContacts() {
    contentContactsListHeader.innerHTML = "";
    prenameInitialsList = [];
    intitialBackgroundcolors = [];
    contactsList.sort((a, b) => a.name.localeCompare(b.name));
    for (let contactsIndex = 0; contactsIndex < contactsList.length; contactsIndex++) {
        firstLetterOfPrenameIsEqual(contactsIndex);
        contactColor(contactsIndex);
    }
}

/** Creates a new contact section when the first letter changes. */
function firstLetterOfPrenameIsEqual(contactsIndex) {
    let firstLetterOfContact = contactsList[contactsIndex].name[0];
    if (!prenameInitialsList.includes(firstLetterOfContact)) {
        contentContactsListHeader.innerHTML += getContactsListHeaderTemplate(contactsIndex);
    }
    prenameInitialsList.push(firstLetterOfContact);
    pushContactIntoTableheader(contactsIndex);
}

/** Appends a contact row to its matching letter group. */
function pushContactIntoTableheader(contactsIndex) {
    let contentContactsList = document.getElementById(`new_row_${contactsList[contactsIndex].name[0]}`);
    contentContactsList.innerHTML += getContactsListContentTemplate(contactsIndex);
}

/** Assigns and stores a display color for a contact avatar. */
function contactColor(contactsIndex) {
    let contentInitialBackgroundColor = document.getElementById(`initial_bg_color_${contactsIndex}`);
    let randomColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    contentInitialBackgroundColor.style.backgroundColor = randomColor;
    intitialBackgroundcolors.push(randomColor);
}

/** Opens the selected contact information panel. */
function openContactInformation(contactsIndex) {
    if (isActiveContact(contactsIndex)) return closeCurrentContact(contactsIndex);
    closePreviousContact(contactsIndex);
    activateContactView(contactsIndex);
    createContentInformation(contactsIndex);
    createEditButtonResponsive(contactsIndex);
    activeContact = contactsIndex;
}

/** Closes the active contact information panel. */
function closeContactInformation(contactsIndex) {
    let contentContactWrapper = document.getElementById(`contact_wrapper_${contactsIndex}`);
    contentContactMain.style.overflow = "";
    contentContactWrapper.classList.remove('contact_wrapper_active');
    contentContactInformation.classList.add("contact_information_deactive");
    activeContact = null;
}

/** Renders the selected contact information content. */
function createContentInformation(contactsIndex) {
    contentContactInformation.innerHTML = getContactsInformationTemplate(contactsIndex);
    contactColorInContactInformation(contactsIndex)
}

/** Applies the stored avatar color in the contact information panel. */
function contactColorInContactInformation(contactsIndex) {
    let contentInitialBackgroundColorContactInformation = document.getElementById(`initial_bg_color_contact_information_${contactsIndex}`);
    let initialsColor = intitialBackgroundcolors[contactsIndex];
    contentInitialBackgroundColorContactInformation.style.backgroundColor = initialsColor;
}

/** Applies the correct avatar color state in the contact dialog. */
function contactColorInContactDialog(contactsIndex) {
    let contentInitialBackgroundColorContactDialog = document.getElementById(`initial_bg_color_contact_dialog_${contactsIndex}`);
    let contentInitialImageAddNewContact = document.getElementById(`initial_img_${(contactsIndex)}`);
    let contentInitialText = document.getElementById(`initial_text_${(contactsIndex)}`);
    let initialsColor = intitialBackgroundcolors[contactsIndex];
    if (initialsColor == undefined) {
        contentInitialBackgroundColorContactDialog.style.backgroundColor = "rgba(209, 209, 209, 1)";
        contentInitialImageAddNewContact.classList.remove("display_none_button_or_img");
        contentInitialText.style.display = "none";
    } else {
        contentInitialBackgroundColorContactDialog.style.backgroundColor = initialsColor;
    }
}

/** Opens the edit-contact dialog for the selected contact. */
function openEditContactDialog(contactsIndex, event) {
    if (event) event.stopPropagation();
    contentDialogOfEditContact.innerHTML = getContactDialogTemplate(contactsIndex);
    let contentDialogContact = document.getElementById(`contact_dialog_${contactsIndex}`);
    contentDialogContact.showModal();
    contentDialogContact.classList.add("dialog_opend");
    contentDialogContact.classList.remove("dialog_closed");
    contactColorInContactDialog(contactsIndex);
    getCurrentContactData(contactsIndex);
}

/** Fills the contact dialog with the current contact data. */
function getCurrentContactData(contactsIndex) {
    let contactInputEmail = document.getElementById(`contact_dialog_input_email_${contactsIndex}`);
    let contactInputName = document.getElementById(`contact_dialog_input_name_${contactsIndex}`);
    let contactInputPhone = document.getElementById(`contact_dialog_input_phone_${contactsIndex}`);
    contactInputName.value = contactsList[contactsIndex].name;
    contactInputEmail.value = contactsList[contactsIndex].email;
    contactInputPhone.value = contactsList[contactsIndex].phone;
}

/** Closes the contact dialog with its exit animation. */
function closeContactDialog(contactsIndex) {
    let contentDialogContact = document.getElementById(`contact_dialog_${contactsIndex}`);
    contentDialogContact.classList.remove("dialog_opend");
    contentDialogContact.classList.add("dialog_closed");
    setTimeout(function () {
        contentDialogContact.close();
    }, 125);
}

/** Stops dialog body clicks from bubbling to the dialog backdrop. */
function closeDialogOnBodyclick(event) {
    event.stopPropagation()
}

/** Opens the dialog for creating a new contact. */
function openAddNewContactDialog(contactsIndex, event) {
    contactsIndex = contactsList.length;
    if (event) event.stopPropagation();
    contentDialogOfEditContact.innerHTML = getContactDialogTemplate(contactsIndex);
    let contentDialogContact = document.getElementById(`contact_dialog_${contactsIndex}`);
    contentDialogContact.showModal();
    contentDialogContact.classList.add("dialog_opend");
    contentDialogContact.classList.remove("dialog_closed");
    if (contactsIndex == contactsList.length) {
        createAddNewContactDialog(contactsIndex);
    }
    contactColorInContactDialog(contactsIndex);
}

/** Switches the contact dialog UI into create mode. */
function createAddNewContactDialog(contactsIndex) {
    let contentDialogContactHeader = document.getElementById('edit_or_addNew_headline');
    let contentDialogContactDescription = document.getElementById('addNew_description_text');
    let contentDialogContactButtonDelete = document.getElementById(`contact_dialog_button_delete_${contactsIndex}`);
    let contentDialogContactButtonSave = document.getElementById(`contact_dialog_button_save_${contactsIndex}`);
    let contentDialogContactButtonCancel = document.getElementById(`contact_dialog_button_cancel_${contactsIndex}`);
    let contentDialogContactButtonCreate = document.getElementById(`contact_dialog_button_create_${contactsIndex}`);
    styleAddNewContactDialog(contentDialogContactHeader, contentDialogContactDescription, contact_dialog_header_direction, contentDialogContactButtonDelete, contentDialogContactButtonSave, contentDialogContactButtonCancel, contentDialogContactButtonCreate);
}

/** Applies the visual state for the add-new-contact dialog. */
function styleAddNewContactDialog(headerText, descriptionText, directionOfHeaderAndDescription, deleteButton, saveButton, cancelButton, createButton) {
    headerText.innerText = "Add contact";
    descriptionText.style.display = "block";
    deleteButton.classList.add("display_none_button_or_img");
    saveButton.classList.add("display_none_button_or_img");
    cancelButton.classList.remove("display_none_button_or_img");
    createButton.classList.remove("display_none_button_or_img");
}

/** Shows the success message for created or edited contacts. */
function openContactWasCreatedOrEditedSuccesfull(editOrAddNewContact) {
    if (editOrAddNewContact == 'addNewContact') {
        styleOfCreadedOrEditedSuccessfully();
    }
    if (editOrAddNewContact == 'editContact') {
        let contentContactEditedTextSuccessfully = document.getElementById("contact_etited_text");
        let contentContactCreatedTextSuccessfully = document.getElementById("contact_created_text");
        contentContactEditedTextSuccessfully.classList.remove("contact_etited_text_deactive");
        contentContactCreatedTextSuccessfully.classList.add("contact_etited_text_deactive");
        styleOfCreadedOrEditedSuccessfully();
    }
}

/** Animates the contact created or edited success banner. */
function styleOfCreadedOrEditedSuccessfully() {
    let contentContactCreatedSuccesfully = document.getElementById("contact_createdSuccesfully");
    contentContactCreatedSuccesfully.classList.remove("contact_createdSuccesfully_deactive");
    contentContactCreatedSuccesfully.classList.add("contact_createdSuccesfully_animation");
    setTimeout(function () {
        contentContactCreatedSuccesfully.classList.add("contact_createdSuccesfully_deactive_animation");
    }, 2000);
    setTimeout(function () {
        contentContactCreatedSuccesfully.classList.add("contact_createdSuccesfully_deactive");
    }, 4000);
}

/** Hides the contact information panel on responsive layouts. */
function closeContactInformationResponsive() {
    contentContact.classList.add('responsive_contactInformation_none');
}

/** Renders the responsive edit/delete action buttons. */
function createEditButtonResponsive(contactsIndex) {
    contentEditButton.innerHTML = getContactDialogEditandDeleteMobileTemplate(contactsIndex);
}

/** Toggles the responsive contact action menu. */
function addEditAndDeleteResponisve(event) {
    if (event) event.stopPropagation();
    let editAndDeleteMenu = document.getElementById('edit_and_delete_mobile_menu');
    if (menuStatus == 'on') return openResponsiveActionMenu(editAndDeleteMenu);
    if (!editAndDeleteMenu || menuStatus == 'off') closeResponsiveActionMenu(editAndDeleteMenu);
}

/** Returns whether the given contact is currently active. */
function isActiveContact(contactsIndex) {
    return activeContact == contactsIndex;
}

/** Closes the currently active contact when it is clicked again. */
function closeCurrentContact(contactsIndex) {
    closeContactInformation(contactsIndex);
}

/** Closes the previously active contact before opening another. */
function closePreviousContact(contactsIndex) {
    if (activeContact === null || activeContact === contactsIndex) return;
    closeContactInformation(activeContact);
}

/** Activates the visual contact detail state for the selected contact. */
function activateContactView(contactsIndex) {
    let contentContactWrapper = document.getElementById(`contact_wrapper_${contactsIndex}`);
    contentContactMain.style.overflow = "hidden";
    contentContactWrapper.classList.add('contact_wrapper_active');
    contentContactInformation.classList.remove("contact_information_deactive");
    contentContactInformation.classList.add("contact_information_animation");
    contentContact.classList.remove('responsive_contactInformation_none');
}

/** Opens the responsive contact action menu. */
function openResponsiveActionMenu(editAndDeleteMenu) {
    contentContact.style.overflow = "hidden";
    editAndDeleteMenu.classList.remove('close');
    editAndDeleteMenu.classList.add('open');
    menuStatus = 'off';
}

/** Closes the responsive contact action menu. */
function closeResponsiveActionMenu(editAndDeleteMenu) {
    editAndDeleteMenu.classList.add('close');
    menuStatus = 'on';
    setTimeout(() => {
        contentContact.style.overflow = "";
        editAndDeleteMenu.classList.remove('open');
    }, 125);
}

window.initContacts = initContacts;
window.openContactInformation = openContactInformation;
window.openAddNewContactDialog = openAddNewContactDialog;
window.openEditContactDialog = openEditContactDialog;
window.closeContactDialog = closeContactDialog;
window.closeDialogOnBodyclick = closeDialogOnBodyclick;
window.saveNewContact = saveNewContact;
window.saveContact = saveContact;
window.deleteContact = deleteContact;
window.closeContactInformationResponsive = closeContactInformationResponsive;
window.addEditAndDeleteResponisve = addEditAndDeleteResponisve;
window.createEditButtonResponsive = createEditButtonResponsive;