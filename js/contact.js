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
    let randomColor = initialBackgroundColors[Math.floor(Math.random() * initialBackgroundColors.length)];
    contentInitialBackgroundColor.style.backgroundColor = randomColor;
}