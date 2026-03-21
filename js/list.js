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

function createList(data) {
    contactsList = [];
    renderList(data);
}