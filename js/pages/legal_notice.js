/** Initializes the legal notice page header state. */
async function initLegalNotice() {
    userInitials();
}

/** Updates the user badge with the current user's initials. */
function userInitials() {
    const userName = localStorage.getItem("userName");
    if (userName !== 'Guest') {
        let initials = getInitials(userName);
        const refUser = document.getElementById("user");
        refUser.innerHTML = initials;
    }
}
/** Extracts initials from a full name. */
function getInitials(fullName) {
    // Namen in einzelne Wörter aufteilen
    const names = fullName.trim().split(' ');
    // Anfangsbuchstaben der ersten beiden Namen holen und zusammenfügen
    return names[0][0].toUpperCase() + names[1][0].toUpperCase();
}