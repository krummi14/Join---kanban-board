const BASE_URL = "https://join---the-kanban-system-default-rtdb.europe-west1.firebasedatabase.app/";
let contactsList = [];
let contactEmail = document.getElementById("email");
let contactName = document.getElementById("name");
let contactPhone = document.getElementById("phone");
let contactID = document.getElementById("contact_id");

function init() {
  getData("/contacts"); //direkt auf Kontakte zugreifen
}

function addContact() {
  putData("/contacts/");
}

function deleteContact(id) {
  deleteData("/contacts/" + id);
  contactsList = contactsList.filter(contact => contact.id !== id);
}
