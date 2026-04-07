async function initSummery() {
  const userName = localStorage.getItem("userName");

  if (userName !== 'Guest') {
    const refSummeryUser = document.getElementById("good_morning");
    refSummeryUser.innerHTML = `<h2>Good Morning,<br><span class="user_name">${userName}!</span></h2>`;
    let initials = getInitials(userName);
    const refUser = document.getElementById("user");
    refUser.innerHTML = initials;
  }
}