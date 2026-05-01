async function initSummery() {
  if (greetingShown == "true") {
    if (isMobile) {
      refSummeryUser.style.display = "none";
    }
    return;
  }
  if (userName !== "Guest") {
    refSummeryUser.innerHTML = `
      <h2 class="good_morning">Good Morning,<br><span class="user_name">${userName}</span></h2>`;
    let initials = getInitials(userName);
    refUser.innerHTML = initials;
  } else {
    refSummeryUser.innerHTML = `<h2 class="good_morning">Good Morning!</h2>`;
  }
  if (isMobile) {
    setTimeout(() => {
      refSummeryUser.classList.add("fadeOut");
      setTimeout(() => {
        refSummeryUser.style.display = "none";
        localStorage.setItem("greetingShown", "true");
      }, 800);
    }, 1500);
  }
}