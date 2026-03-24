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
    return `<span id="initial_bg_color_contact_information_${contactsIndex}" class="contact_initials contact_initials_bg">${filterInitialsOfName(contactsIndex)}</span>
    `;
}