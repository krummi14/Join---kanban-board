function insertNewContactData() {
    return {
        id: extractIDs(),
        name: contactName.value,
        email: contactEmail.value,
        phone: contactPhone.value
    }
}
