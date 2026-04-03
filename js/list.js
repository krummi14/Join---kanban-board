// WICHTIG: Variable definieren und exportieren
export let contactsList = [];

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
    // ❗ statt = [] (würde Import kaputt machen)
    contactsList.length = 0;

    renderList(responseToJson);
}

function extractIDs() {
    let ids = Object.values(contactsList).map(contact => Number(contact.id)); // ID extrahieren
    let nextId = Math.max(...ids) + 1; // höchste ID bestimmen
    return nextId;
}

// ❗ Falls du diese Funktionen in anderen Dateien brauchst:
export {
    createList,
    renderList,
    extractIDs
};