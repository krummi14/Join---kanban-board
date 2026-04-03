const BASE_URL = "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";

const backgroundColors = [
    "#FF6B6B", "#4ECDC4", "#556270",
    "#C7F464", "#C44D58", "#FFA500",
    "#1E90FF", "#8A2BE2"
];

let intitialBackgroundcolors = [];
let contactsList = [];
let contactID;
let contentContactsListHeader;
let contentContactInformation;
let prenameInitialsList = [];
let activeContact = null;
let contentDialogOfEditContact;
let contentDialogOfAddNewContact;

function initElements() {
  contactID = document.getElementById("contact_id");
  contentContactsListHeader = document.getElementById('list_content');
  contentContactInformation = document.getElementById("contact_information");
  contentDialogOfEditContact = document.getElementById("contact_dialog_content");
  contentDialogOfAddNewContact = document.getElementById("addNew_contact_dialog_content");
}

function logout() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = '../index.html';
}

export {
  logout,
  contactsList,
  backgroundColors,
  intitialBackgroundcolors,
  contactID,
  contentContactsListHeader,
  contentContactInformation,
  prenameInitialsList,
  activeContact,
  contentDialogOfEditContact,
  contentDialogOfAddNewContact,
  initElements
};
