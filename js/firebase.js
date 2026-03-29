async function getData(path = "") {
    return await loadData(path);
}

async function loadData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    createList(responseToJson);
    return responseToJson;
}

async function putNewData(path = "", contactsIndex) {
    let newId = extractIDs(); // neue ID erzeugen
    let newContact = insertNewContactData(contactsIndex); // Daten aus dem Dialog holen
    newContact.id = newId;
    await fetch(BASE_URL + path + (newId - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact)
    });
    contactsList.push(newContact); // in Liste speichern
    return newId;
}

async function putEditData(path = "", contactsIndex) {
    let editContact = editCurrentContactData(contactsIndex); // Daten aus dem Dialog holen
    let currentId = editContact.id 
    await fetch(BASE_URL + path + currentId + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editContact)
    });
    contactsList[contactsIndex] = editContact; // in Liste speichern
    return currentId;
}

async function deleteData(path = "") {
    let response = await fetch(BASE_URL + path + ".json", {
        method: "DELETE",
    });
    return responseToJson = await response.json();
}