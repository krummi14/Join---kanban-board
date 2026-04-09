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

// Logout-Funktion: entfernt Login-Status und leitet zur Login-Seite weiter
function logout() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = '../index.html';
}

// Funktion, um die Initialen aus einem vollständigen Namen zu extrahieren (generiert aus ChatGPT)
function userInitials() {
    const userName = localStorage.getItem("userName");
    if (userName !== 'Guest') {
        let initials = getInitials(userName);
        const refUser = document.getElementById("user");
        refUser.innerHTML = initials;
    }
}

function getInitials(fullName) {
    // Namen in einzelne Wörter aufteilen
    const names = fullName.trim().split(' ');
    // Anfangsbuchstaben der ersten beiden Namen holen und zusammenfügen
    return names[0][0].toUpperCase() + names[1][0].toUpperCase();
}

// Formvalidation (showError)
function showError(errorId, message) {
    let errorField = document.getElementById(errorId);
    if (errorField) errorField.textContent = message;
}