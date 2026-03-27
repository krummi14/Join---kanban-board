function addContact() {
    putData("/contacts/");
}

async function deleteContact(contactsIndex) {
    let deleteIndex = (contactsList[contactsIndex].id) - 1;
    await deleteData("/contacts/" + deleteIndex);
    contactsList = contactsList.filter(contact => contact.id !== deleteIndex + 1);
    renderContacts();
    closeContactInformation(contactsIndex);
    closeContactDialog(contactsIndex);
}

function filterInitialsOfName(contactsIndex) {
    let contactName = contactsList[contactsIndex].name;
    let initials = contactName.split(' ').map(initial => initial.charAt(0)).join('');
    return initials;
}

function renderContacts() {
    contentContactsListHeader.innerHTML = "";
    prenameInitialsList = [];
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
    let initialsColor = intitialBackgroundcolors[contactsIndex];
    contentInitialBackgroundColorContactDialog.style.backgroundColor = initialsColor;
}

function openContactDialog(contactsIndex, event) {
    if (event) event.stopPropagation();
    contentDialogofContacts.innerHTML = getContactsDialogTemplate(contactsIndex);
    let contentDialogContact = document.getElementById(`contact_dialog_${contactsIndex}`);
    contentDialogContact.showModal();
    contentDialogContact.classList.add("dialog_opend");
    contentDialogContact.classList.remove("dialog_closed");
    contactColorInContactDialog(contactsIndex);
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