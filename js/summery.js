BASE_URL = "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";
let userDataArr = [];

async function init() {
  await fetchUser();
}

async function fetchUser() {
  const user = await fetch(BASE_URL + "users.json");
  const userData = await user.json();

  let userArr = Object.keys(userData);
  for (let i = 0; i < userArr.length; i++) {
    const currentUser = userData[userArr[i]];
    userDataArr.push(currentUser);
  }

  console.log(userDataArr);

  const refSummeryUser = document.getElementById("good_morning");
  refSummeryUser.innerHTML = `<h2>Good Morning,<br><span class="user_name">${userDataArr[1].name}!</span></h2>`;

  let initials = getInitials(userDataArr[1].name);
  const refUser = document.getElementById("user");
  refUser.innerHTML = initials;
  return;
}

function getInitials(fullName) {
  // Namen in einzelne Wörter aufteilen
  const names = fullName.trim().split(' ');
  // Anfangsbuchstaben der ersten beiden Namen holen und zusammenfügen
  return names[0][0].toUpperCase() + names[1][0].toUpperCase();
}