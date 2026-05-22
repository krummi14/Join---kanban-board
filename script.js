const BASE_URL =
    "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";

const backgroundColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#556270",
    "#C7F464",
    "#C44D58",
    "#FFA500",
    "#1E90FF",
    "#8A2BE2"
];

let intitialBackgroundcolors = [];
let contactsList = [];

let contactID = document.getElementById("contact_id");
let contentContactsListHeader = document.getElementById("list_content");
let contentContactInformation = document.getElementById("contact_information");

let prenameInitialsList = [];
let activeContact = null;

let contentContactMain = document.getElementById("contact_main");

let contentDialogOfEditContact =
    document.getElementById("contact_dialog_content");

let contentDialogOfAddNewContact =
    document.getElementById("addNew_contact_dialog_content");

let contentContact =
    document.getElementById("contact_content");

let contentEditButton =
    document.getElementById("contact_dialog_edit_button_content");

let contentMobileSummary =
    document.getElementById("responsive_menu_button_summary");

let contentMobileAddTask =
    document.getElementById("responsive_menu_button_addTask");

let logoutMenu =
    document.getElementById("logout_menu");

let contentSection =
    document.getElementById("content");

let menuStatus = "on";

const userName =
    localStorage.getItem("userName") || "Guest";

const refSummeryUser =
    document.getElementById("good_morning");

const main =
    document.getElementById("main_framework");

const refUser =
    document.getElementById("user");

const mq =
    window.matchMedia("(max-width: 1115px)");

let contentBody =
    document.getElementById("body");

let contentDialogOfAddTask =
    document.getElementById("add_task_dialog_content");

let contentSearchInput =
    document.getElementById("search_input_value");

let currentTasks = [];

let isFiltering = false;

let filteredColumns = null;

let contentSearchInformation =
    document.getElementById("search_information");

let contentShowButton =
    document.getElementById("show_all_button");

let boardIsFiltered = false;

/* ---------------- SPLASH SCREEN (FIXED + SMOOTH) ---------------- */

window.addEventListener("load", () => {
    const splash =
        document.getElementById("splash_screen");

    if (!splash) return;

    // jedes Reload sichtbar
    setTimeout(() => {
        splash.classList.add("fade-out");
    }, 1200);

    setTimeout(() => {
        splash.remove();
    }, 1800);
});

/* ---------------- LOGOUT ---------------- */

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("greetingShown");
    sessionStorage.removeItem("user");

    window.location.href = "../index.html";
}

/* ---------------- USER INITIALS ---------------- */

function userInitials() {
    if (userName !== "Guest") {
        let initials = getInitials(userName);
        refUser.innerHTML = initials;
    }
}

function getInitials(fullName) {
    if (fullName == "Guest") return "G";

    const names =
        String(fullName || "")
            .trim()
            .split(" ")
            .filter(Boolean);

    if (!names.length) return "G";

    if (names.length === 1) {
        return names[0].slice(0, 2).toUpperCase();
    }

    return (
        names[0][0].toUpperCase() +
        names[1][0].toUpperCase()
    );
}

/* ---------------- FORM VALIDATION ---------------- */


function showError(errorId, message) {
    const el = document.getElementById(errorId);
    if (!el) return;

    el.textContent = message;

    if (message) {
        el.classList.add("show");
    } else {
        el.classList.remove("show");
    }
}


/* ---------------- ADD TASK TEMPLATE ---------------- */

function getAddTaskFormTemplate(path) {
    document.getElementById("addTaskContainer").innerHTML =
        createAddTaskFormTemplate(path);
}

/* ---------------- MOBILE MENU ---------------- */

function addMenu() {
    if (menuStatus === "on") {
        contentSection.style.overflow = "hidden";
        contentBody.style.overflow = "hidden";

        logoutMenu.classList.remove("close");
        logoutMenu.classList.add("open");

        menuStatus = "off";
    } else {
        logoutMenu.classList.add("close");
        menuStatus = "on";

        setTimeout(() => {
            contentSection.style.overflow = "";
            contentBody.style.overflow = "";

            logoutMenu.classList.remove("open");
        }, 125);
    }
}