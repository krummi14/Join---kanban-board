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

async function putData() {
    let ids = Object.values(contactsList).map(contact => Number(contact.id));
    console.log(ids);
    // höchste ID bestimmen
    let nextId = Math.max(...ids) + 1;
    console.log(nextId);
    const newContact = {
        name: "Peter Mafay",
        id: nextId,
        email: "peter@hotmail.com",
        phone: "+49 1667829465"
    };
    // unter eigener ID speichern
    await fetch(BASE_URL + "/contacts/" + (nextId - 1) + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact)
    });
}