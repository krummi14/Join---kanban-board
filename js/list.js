function renderList(responseToJson) {
    for (let index = 0; index < responseToJson.length; index++) {
        if (responseToJson[index] == null) {
            responseToJson.splice(index, 1);
        }
        contactsList.push({
            id: responseToJson[index].id,
            name: responseToJson[index].name,
            email: responseToJson[index].email,
            phone: responseToJson[index].phone
        });
    }
}

function createList(responseToJson) {
    contactsList = [];
    renderList(responseToJson);
}

function extractIDs() {
    let ids = Object.values(contactsList).map(contact => Number(contact.id)); // ID extrahieren
    let nextId = Math.max(...ids) + 1; // höchste ID bestimmen
    return nextId
}