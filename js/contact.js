function addContact() {
    putData("/contacts/");
}

function deleteContact(id) {
    deleteData("/contacts/" + id);
    contactsList = contactsList.filter(contact => contact.id !== id);
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
    let contentInitialBackgroundColorContentInformation = document.getElementById(`initial_bg_color_contact_information_${contactsIndex}`);
    let initialsColor = intitialBackgroundcolors[contactsIndex];
    contentInitialBackgroundColorContentInformation.style.backgroundColor = initialsColor;
}