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
                        <button class="edit_and_delete_button" onclick="openEditContactDialog(${contactsIndex}, event)"><p class="edit_and_delete_icon">&#128393</p> <p class="edit_and_delete_text">Edit</p></button>
                        <button class="edit_and_delete_button" onclick="deleteContact(false, ${contactsIndex})"><p class="edit_and_delete_icon">&#128465</p> <p class="edit_and_delete_text">Delete</p></button>
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
            <div id="contact_createdSuccesfully" class="contact_createdSuccesfully contact_createdSuccesfully_deactive">
                <p id="contact_created_text">Contact successfully created</p>
                <p id="contact_etited_text" class="contact_etited_text_deactive">Contact successfully edited</p>   
            </div>
            `;
}

function getContactDialogTemplate(contactsIndex) {
    return `<dialog onclick="closeContactDialog(${contactsIndex})" id="contact_dialog_${contactsIndex}" class="contact_dialog_content dialog_closed">
                <div class="contact_dialog_direction" onclick="closeDialogOnBodyclick(event)">
                        <header class="contact_dialog_header">
                            <div id="contact_dialog_header_direction" class="contact_dialog_header_direction">
                                <img class="logo logo_size_contact_dialog" src="../assets/img/join_logo.svg" alt="Join Logo">
                                <h2 id="edit_or_addNew_headline" class="contact_headline_h2">Edit contact</h2>
                                <p id="addNew_description_text" class="contact_description_text" style="display:none">Tasks are better with a team</p>
                            </div>
                            <div class="header_dividingline"></div> 
                        </header>
                        <main class="contact_dialog_main">
                            <div class="contact_dialog_close_button_direction">
                                <button class="contact_dialog_close_button" onclick="closeContactDialog(${contactsIndex})">X</button>
                            </div>
                            <div class="contact_dialog_initial_and_assets">
                                <div id="initial_bg_color_contact_dialog_${contactsIndex}" class="contact_initials contact_initials_bg contact_initials_size">
                                    <p id="initial_text_${(contactsIndex)}">${filterInitialsOfName(contactsIndex)}</p>
                                    <img id="initial_img_${(contactsIndex)}" src="../assets/icon/person_white.svg" class="display_none_button_or_img" style="width: 40px; height: 40px" alt="Contact undefined">
                                </div>
                                <form id="contact_dialog_input_and_button_${contactsIndex}" class="contact_dialog_input_and_button_direction">
                                    <div class="contact_dialog_input_direction">
                                        <div class="input-wrapper">
                                            <input id="contact_dialog_input_name_${contactsIndex}" type="text" placeholder="Name">
                                            <img src="/assets/icon/person.svg" class="input-icon"/>
                                        </div>
                                        <div id="name_error_${contactsIndex}" class="error" style="margin-bottom: 16px; margin-left: 24px;"></div>
                                        <div class="input-wrapper">
                                            <input id="contact_dialog_input_email_${contactsIndex}" type="email" placeholder="Email">
                                            <img src="/assets/icon/mail.svg" class="input-icon"/>
                                        </div>
                                        <div id="email_error_${contactsIndex}" class="error" style="margin-bottom: 16px; margin-left: 24px;"></div>
                                        <div class="input-wrapper">
                                            <input id="contact_dialog_input_phone_${contactsIndex}" type="tel" placeholder="Phone">
                                            <img src="/assets/icon/call.svg" class="input-icon"/>
                                        </div>
                                        <div id="phone_error_${contactsIndex}" class="error" style="margin-bottom: 16px; margin-left: 24px;"></div>
                                    </div>
                                    <div class="contact_dialog_button_direction">
                                        <button type="button" id="contact_dialog_button_delete_${contactsIndex}" class="basic-btn-secondary contact_dialog_button_delete" onclick="deleteContact(true, ${contactsIndex})">Delete</button>
                                        <button type="button" id="contact_dialog_button_save_${contactsIndex}" class="button_basic_characteristics contact_dialog_button_save" onclick="saveContact('editContact', ${contactsIndex})">Save &#x2714</button>
                                        <button type="button" id="contact_dialog_button_cancel_${contactsIndex}" class="basic-btn-secondary display_none_button_or_img contact_dialog_button_delete" onclick="closeContactDialog(${contactsIndex})">Cancel  X</button>
                                        <button type="button" id="contact_dialog_button_create_${contactsIndex}" class="button_basic_characteristics display_none_button_or_img contact_dialog_button_creat" onclick="saveNewContact('addNewContact', ${contactsIndex})">Create Contact &#x2714</button>
                                    </div>
                                </form>
                            </div>
                        </main>
                </div>
            </dialog>
    `
}