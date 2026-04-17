import { extractIDs } from "./list.js";
import { insertNewContactData, editCurrentContactData } from "./assets.js";

export async function getData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    return responseToJson;
}

export async function putNewData(path = "", contactsIndex) {
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

export async function putEditData(path = "", contactsIndex) {
    let editContact = editCurrentContactData(contactsIndex); // Daten aus dem Dialog holen
    let currentId = editContact.id
    await fetch(BASE_URL + path + (currentId - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editContact)
    });
    contactsList[contactsIndex] = editContact; // in Liste speichern
    return currentId;
}

export async function deleteData(path = "") {
    let response = await fetch(BASE_URL + path + ".json", {
        method: "DELETE",
    });
    return await response.json();
}

export async function putUserData(path = "", data = {}) {
    await fetch(BASE_URL + path + ".json", {
        method: "PATCH", //PUT BEDEUTET „Ersetze ALLES an diesem Pfad komplett“
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}