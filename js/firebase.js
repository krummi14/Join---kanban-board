async function getData(path = "") {
    if (contactsList.length > 0) {
        return contactsList;
    } else {
        return await loadData(path);
    }
}

async function loadData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    createList(responseToJson);
    return responseToJson;
}

async function putData(path = "") {
    // unter eigener ID speichern
    await fetch(BASE_URL + path + (extractIDs() - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertNewContactData())
    });
    contactsList.push(insertNewContactData());
}

async function deleteData(path = "") {
    let response = await fetch(BASE_URL + path + ".json", {
        method: "DELETE",
    });
    return responseToJSON = await response.json();
}