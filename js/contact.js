async function addNewContact(contactsIndex) {
    activeContact = null;
    let newContactId = await putNewData("/contacts/", contactsIndex);
    renderContacts();
    closeContactDialog(contactsIndex);
    let newContactsIndex = contactsList.findIndex(contact => contact.id == newContactId);
    openContactInformation(newContactsIndex);
    openContactWasCreatedSuccesfull();
}

async function deleteContact(contactsIndex) {
    let deleteIndex = (contactsList[contactsIndex].id) - 1;
    await deleteData("/contacts/" + deleteIndex);
    contactsList = contactsList.filter(contact => contact.id !== deleteIndex + 1);
    renderContacts();
    closeContactInformation(contactsIndex);
    closeContactDialog(contactsIndex);
}

async function editContact(contactsIndex) {
    activeContact = null;
    let currentContactId = await putEditData("/contacts/", contactsIndex);
    renderContacts();
    let newContactsIndex = contactsList.findIndex(contact => contact.id == currentContactId);
    closeContactDialog(contactsIndex);
    openContactInformation(newContactsIndex);
}

function filterInitialsOfName(contactsIndex) {
    if (contactsIndex == contactsList.length) {
        return;
    } else {
        let contactName = contactsList[contactsIndex].name;
        let initials = contactName.split(' ').map(initial => initial.charAt(0)).join('');
        return initials
    };
}

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

function firstLetterOfPrenameIsEqual(contactsIndex) {
    let firstLetterOfContact = contactsList[contactsIndex].name[0];
    if (!prenameInitialsList.includes(firstLetterOfContact)) {
        contentContactsListHeader.innerHTML += getContactsListHeaderTemplate(contactsIndex);
    }
    prenameInitialsList.push(firstLetterOfContact);
    pushContactIntoTableheader(contactsIndex);
}

function pushContactIntoTableheader(contactsIndex) {
    let contentContactsList = document.getElementById(`new_row_${contactsList[contactsIndex].name[0]}`);
    contentContactsList.innerHTML += getContactsListContentTemplate(contactsIndex);
}

function contactColor(contactsIndex) {
    let contentInitialBackgroundColor = document.getElementById(`initial_bg_color_${contactsIndex}`);
    let randomColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    contentInitialBackgroundColor.style.backgroundColor = randomColor;
    intitialBackgroundcolors.push(randomColor);
}

function openContactInformation(contactsIndex) {
    if (activeContact == contactsIndex) {
        closeContactInformation(contactsIndex);
        return;
    }
    if (activeContact !== null && activeContact !== contactsIndex) {
        closeContactInformation(activeContact);
    }
    let contentContactWrapper = document.getElementById(`contact_wrapper_${contactsIndex}`);
    contentContactWrapper.classList.add('contact_wrapper_active');
    contentContactInformation.classList.remove("contact_information_deactive");
    contentContactInformation.classList.add("contact_information_animation");
    createContentInformation(contactsIndex);
    activeContact = contactsIndex;
}

function closeContactInformation(contactsIndex) {
    let contentContactWrapper = document.getElementById(`contact_wrapper_${contactsIndex}`);
    contentContactWrapper.classList.remove('contact_wrapper_active');
    contentContactInformation.classList.add("contact_information_deactive");
    activeContact = null;
}

function createContentInformation(contactsIndex) {
    contentContactInformation.innerHTML = getContactsInformationTemplate(contactsIndex);
    contactColorInContactInformation(contactsIndex)
}

function contactColorInContactInformation(contactsIndex) {
    let contentInitialBackgroundColorContactInformation = document.getElementById(`initial_bg_color_contact_information_${contactsIndex}`);
    let initialsColor = intitialBackgroundcolors[contactsIndex];
    contentInitialBackgroundColorContactInformation.style.backgroundColor = initialsColor;
}

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

function getCurrentContactData(contactsIndex) {
    let contactInputEmail = document.getElementById(`contact_dialog_input_email_${contactsIndex}`);
    let contactInputName = document.getElementById(`contact_dialog_input_name_${contactsIndex}`);
    let contactInputPhone = document.getElementById(`contact_dialog_input_phone_${contactsIndex}`);
    contactInputName.value = contactsList[contactsIndex].name;
    contactInputEmail.value = contactsList[contactsIndex].email;
    contactInputPhone.value = contactsList[contactsIndex].phone;
}

function closeContactDialog(contactsIndex) {
    let contentDialogContact = document.getElementById(`contact_dialog_${contactsIndex}`);
    contentDialogContact.classList.remove("dialog_opend");
    contentDialogContact.classList.add("dialog_closed");
    setTimeout(function () {
        contentDialogContact.close();
    }, 125);
}

function closeDialogOnBodyclick(event) {
    event.stopPropagation()
}

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

function createAddNewContactDialog(contactsIndex) {
    let contentDialogContactHeader = document.getElementById('edit_or_addNew_headline');
    let contentDialogContactDescription = document.getElementById('addNew_description_text');
    let contentDialogContactButtonDelete = document.getElementById(`contact_dialog_button_delete_${contactsIndex}`);
    let contentDialogContactButtonSave = document.getElementById(`contact_dialog_button_save_${contactsIndex}`);
    let contentDialogContactButtonCancel = document.getElementById(`contact_dialog_button_cancel_${contactsIndex}`);
    let contentDialogContactButtonCreate = document.getElementById(`contact_dialog_button_create_${contactsIndex}`);
    styleAddNewContactDialog(contentDialogContactHeader, contentDialogContactDescription, contact_dialog_header_direction, contentDialogContactButtonDelete, contentDialogContactButtonSave, contentDialogContactButtonCancel, contentDialogContactButtonCreate);
}

function styleAddNewContactDialog(headerText, descriptionText, directionOfHeaderAndDescription, deleteButton, saveButton, cancelButton, createButton) {
    headerText.innerText = "Add contact";
    descriptionText.style.display = "block";
    directionOfHeaderAndDescription.style = "gap: 16px";
    deleteButton.classList.add("display_none_button_or_img");
    saveButton.classList.add("display_none_button_or_img");
    cancelButton.classList.remove("display_none_button_or_img");
    createButton.classList.remove("display_none_button_or_img");
    createButton.style.width = "200px";
}

function openContactWasCreatedSuccesfull() {
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