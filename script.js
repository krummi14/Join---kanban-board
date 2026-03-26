BASE_URL = "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";
const userDataArr = [];

async function fetchUser() {
  const user = await fetch(BASE_URL + "users.json");
  const userData = await user.json();

  let userArr = Object.keys(userData);
  for (let i = 0; i < userArr.length; i++) {
    const currentUser = userData[userArr[i]];
    userDataArr.push(currentUser);
  }
  
  return userDataArr;    
}