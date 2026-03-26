function getContactsListHeaderTemplate(contactsIndex) {
    return `<table id="table_${contactsList[contactsIndex].name[0]}" class="list">
                <tr class="horizontal_divider">
                    <th class="prename_first_letter">${contactsList[contactsIndex].name[0]}</th>
                </tr>
                <tbody id="new_row_${contactsList[contactsIndex].name[0]}"></tbody>
            </table>
            `;
}

function getContactsListContentTemplate(contactsIndex) {
    return `<tr>
                <td class="contact_person" colspan="2">
                    <div id="contact_wrapper_${contactsIndex}" class="contact_wrapper" onclick="openContactInformation(${contactsIndex})">
                        <span id="initial_bg_color_${contactsIndex}" class="contact_initials contact_initials_bg">${filterInitialsOfName(contactsIndex)}</span>
                        <ul>
                            <li class="contact_name">${contactsList[contactsIndex].name}</li>
                            <li class="contact_email">${contactsList[contactsIndex].email}</li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
}

function getContactsInformationTemplate(contactsIndex) {
    return `<div class="contact_information_header">
                <span id="initial_bg_color_contact_information_${contactsIndex}" class="contact_initials contact_initials_bg contact_initials_size">${filterInitialsOfName(contactsIndex)}</span>
                <span class="contact_information_header_gap">
                    <p class="contact_name contact_name_font_size">${contactsList[contactsIndex].name}</p>
                    <div class="edit_and_delete_button_direction">
                        <button class="edit_and_delete_button"><p class="edit_and_delete_icon">&#128393</p> <p class="edit_and_delete_text">Edit</p></button>
                        <button class="edit_and_delete_button"><p class="edit_and_delete_icon">&#128465</p> <p class="edit_and_delete_text">Delete</p></button>
                    </div>
            </div>
            <h4 class="contact_information_headline">Contact Information</h4>
            <span class="contact_information_body">
                <span class="contact_email_and_phone_information">
                    <h5 class="email_and_phone_headline">Email</h5>
                    <p class="contact_email">${contactsList[contactsIndex].email}</p>
                </span>
                <span class="contact_email_and_phone_information">
                    <h5 class="email_and_phone_headline">Phone</h5>
                    <p class="contact_phone">${contactsList[contactsIndex].phone}</p>
                </span>
            <span>
            `;
}