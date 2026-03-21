const BASE_URL = "https://join---the-kanban-system-default-rtdb.europe-west1.firebasedatabase.app/";
let contactsList = [];

function init() {
    getData("/contacts"); //direkt auf Kontakte zugreifen
}

async function addContact() {
    await putData();
    let data = await loadData();
    contactsList = data;
    createList(data);
}