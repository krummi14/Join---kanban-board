/** Rebuilds the contacts list from the fetched response. */
export function createList(responseToJson) {
    contactsList = [];
    renderList(responseToJson);
}

/** Normalizes the raw contact response into the global contacts list. */
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

/** Returns the next numeric contact id. */
export function extractIDs() {
    let ids = Object.values(contactsList).map(contact => Number(contact.id)); // ID extrahieren
    let nextId = Math.max(...ids) + 1; // höchste ID bestimmen
    return nextId
}