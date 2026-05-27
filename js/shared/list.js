/**
 * Rebuilds the contacts list from the fetched response.
 * 
 * Clears the shared in-memory list and repopulates it from
 * the raw backend response structure.
 * 
 * @param {Array<Object>} responseToJson - Raw contact response payload.
 */
export function createList(responseToJson) {
    contactsList = [];
    renderList(responseToJson);
}

/**
 * Normalizes the raw contact response into the global contacts list.
 * 
 * Removes null entries from the response and pushes normalized
 * contact objects into the shared contacts list.
 * 
 * @param {Array<Object>} responseToJson - Raw contact response payload.
 */
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

/**
 * Returns the next numeric contact id.
 * 
 * Reads the existing contact ids from the in-memory list and
 * returns the next higher numeric identifier.
 * 
 * @returns {number} The next available contact id.
 */
export function extractIDs() {
    let ids = Object.values(contactsList).map(contact => Number(contact.id)); // ID extrahieren
    let nextId = Math.max(...ids) + 1; // höchste ID bestimmen
    return nextId
}