async function initAddTask() {
  const userName = localStorage.getItem("userName");

  if (userName !== 'Guest') {
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }
}


// Funktion, um die Initialen aus einem vollständigen Namen zu extrahieren (generiert aus ChatGPT)
function getInitials(fullName) {
  // Namen in einzelne Wörter aufteilen
  const names = fullName.trim().split(' ');
  // Anfangsbuchstaben der ersten beiden Namen holen und zusammenfügen
  return names[0][0].toUpperCase() + names[1][0].toUpperCase();
}