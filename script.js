const BASE_URL = "https://join---the-kanban-system-default-rtdb.europe-west1.firebasedatabase.app/";

const backgroundColors = [
    "#FF6B6B", "#4ECDC4", "#556270",
    "#C7F464", "#C44D58", "#FFA500",
    "#1E90FF", "#8A2BE2"
];

let intitialBackgroundcolors = [];
let contactsList = [];
let contactEmail = document.getElementById("email");
let contactName = document.getElementById("name");
let contactPhone = document.getElementById("phone");
let contactID = document.getElementById("contact_id");
let contentContactsListHeader = document.getElementById('list_content');
let contentContactInformation = document.getElementById("contact_information");
let prenameInitialsList = [];
let activeContact = null;

async function init() {
    await getData("/contacts"); //direkt auf Kontakte zugreifen
    renderContacts();
}