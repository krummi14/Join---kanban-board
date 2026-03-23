/*import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import { getFirestore, collection, addDoc } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCP1QIYhulp_JV9VeYYXLQHfJlXnG3nWxo",
    authDomain: "join---kanban-board-5501a.firebaseapp.com",
    projectId: "join---kanban-board-5501a",
    storageBucket: "join---kanban-board-5501a.firebasestorage.app",
    messagingSenderId: "145444350218",
    appId: "1:145444350218:web:8de177980836496ccab2f3"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("APP:", app);

const db = getFirestore(app);
console.log("Firestore:", db);

async function testFirebase() {
  await addDoc(collection(db, "test"), {
    message: "Firebase funktioniert!",
    time: new Date()
  });

  console.log("Test erfolgreich gespeichert!");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("testBtn").addEventListener("click", testFirebase);
});

*/

const BASE_URL = "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";
export { BASE_URL };

export async function putData(path = "", data = {}) {
  await fetch(BASE_URL + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function getData(path = "") {
  const res = await fetch(BASE_URL + path + ".json");
  return await res.json();
}

export async function deleteData(path = "") {
  await fetch(BASE_URL + path + ".json", { method: "DELETE" });
}



/*

import { getData, putData } from "./firebase.js";

async function saveContact() {
  const id = Date.now().toString();

  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value
  };

  await putData("contacts/" + id, data);
  loadContacts();
}

async function loadContacts() {
  let data = await getData("contacts");

  console.log("Kontakte:", data);
}

function getDummyContacts() {
  return [
    { name: "Max Henke", email: "max@test.de" },
    { name: "Anna Müller", email: "anna@test.de" },
    { name: "Lukas Schmidt", email: "lukas@test.de" },
    { name: "Sophie Wagner", email: "sophie@test.de" }
  ];
}



async function initDummyContacts() {
  let data = await getData("contacts");

  if (data && Object.keys(data).length > 0) return;

  let contacts = getDummyContacts();

  for (let contact of contacts) {
    let id = Date.now().toString();

    await putData("contacts/" + id, contact);
  }

  console.log("Dummy Kontakte erstellt");
}

async function init() {
  await initDummyContacts();
  await loadContacts();
}

init();

document.getElementById("saveBtn").addEventListener("click", saveContact);

//-------------------------------------
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
 
*/