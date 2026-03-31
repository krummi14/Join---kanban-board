const BASE_URL = "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";

const backgroundColors = [
    "#FF6B6B", "#4ECDC4", "#556270",
    "#C7F464", "#C44D58", "#FFA500",
    "#1E90FF", "#8A2BE2"
];

let intitialBackgroundcolors = [];
let contactsList = [];
let contactID = document.getElementById("contact_id");
let contentContactsListHeader = document.getElementById('list_content');
let contentContactInformation = document.getElementById("contact_information");
let prenameInitialsList = [];
let activeContact = null;
let contentDialogOfEditContact = document.getElementById("contact_dialog_content");
let contentDialogOfAddNewContact = document.getElementById("addNew_contact_dialog_content");