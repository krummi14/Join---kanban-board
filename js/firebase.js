import { createList, extractIDs } from "./list.js";
import { contactsList } from "./list.js";

const BASE_URL =
  "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";

export async function getData(path = "") {
    return await loadData(path);
}

async function loadData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    createList(responseToJson);
    return responseToJson;
}

export async function putNewData(path = "", contactsIndex) {
    let newId = extractIDs();
    let newContact = insertNewContactData(contactsIndex);
    newContact.id = newId;

    await fetch(BASE_URL + path + (newId - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact)
    });

    contactsList.push(newContact);
    return newId;
}

export async function putEditData(path = "", contactsIndex) {
    let editContact = editCurrentContactData(contactsIndex);
    let currentId = editContact.id;

    await fetch(BASE_URL + path + (currentId - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editContact)
    });

    contactsList[contactsIndex] = editContact;
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}