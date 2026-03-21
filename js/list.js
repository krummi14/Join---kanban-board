function renderList(responseToJson) {
    for (let index = 0; index < responseToJson.length; index++) {
        contactsList.push({
            id: responseToJson[index].id,
            name: responseToJson[index].name,
            email: responseToJson[index].email,
            phone: responseToJson[index].phone
        });
    }
}

function createList(responseToJson) {
    renderList(responseToJson);
}

function extractIDs() {
    // ID extrahieren
    let ids = Object.values(contactsList).map(contact => Number(contact.id));
    console.log(ids);
    // höchste ID bestimmen
    let nextId = Math.max(...ids) + 1;
    console.log(nextId);
    return nextId
}