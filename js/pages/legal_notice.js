/**
 * Initializes the legal notice page header state.
 * 
 * Restores the current user's initials in the page header
 * when the legal notice view is loaded.
 */
async function initLegalNotice() {
    userInitials();
}

/**
 * Updates the user badge with the current user's initials.
 * 
 * Reads the stored user name and renders initials into the header badge
 * as long as the current session is not the guest user.
 */
function userInitials() {
    const userName = localStorage.getItem("userName");
    if (userName !== 'Guest') {
        let initials = getInitials(userName);
        const refUser = document.getElementById("user");
        refUser.innerHTML = initials;
    }
}

/**
 * Extracts initials from a full name.
 * 
 * Splits the provided name into parts and returns the uppercase
 * initials of the first two name segments.
 * 
 * @param {string} fullName - Full name used to derive initials.
 * @returns {string} Two-letter initials.
 */
function getInitials(fullName) {
    const names = fullName.trim().split(' ');
    return names[0][0].toUpperCase() + names[1][0].toUpperCase();
}