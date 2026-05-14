import { filterInitialsOfName } from "../contacts/contact.js";

export function getContactsListHeaderTemplate(contactsIndex) {
    const initialLetter = getContactInitialLetter(contactsIndex);
    return `
      <table id="table_${initialLetter}" class="list">
        <tr class="horizontal_divider">
          <th class="prename_first_letter">${initialLetter}</th>
        </tr>
        <tbody id="new_row_${initialLetter}"></tbody>
      </table>
    `;
}

export function getContactsListContentTemplate(contactsIndex) {
    return `
      <tr>
        <td class="contact_person" colspan="2">
          ${createContactListEntry(contactsIndex)}
        </td>
      </tr>
    `;
}

export function getContactsInformationTemplate(contactsIndex) {
    return [
      createContactInformationHeader(contactsIndex),
      '<h4 class="contact_information_headline">Contact Information</h4>',
      createContactInformationBody(contactsIndex),
      createContactSuccessMessage(),
    ].join("");
}

export function getContactDialogTemplate(contactsIndex) {
    return `
      <dialog onclick="closeContactDialog(${contactsIndex})" id="contact_dialog_${contactsIndex}" class="contact_dialog_content dialog_closed">
        <div class="contact_dialog_direction" onclick="closeDialogOnBodyclick(event)">
          ${createContactDialogHeader(contactsIndex)}
          ${createContactDialogMain(contactsIndex)}
        </div>
      </dialog>
    `;
}

export function getContactDialogEditandDeleteMobileTemplate(contactsIndex) {
        return `
            <nav id="edit_and_delete_mobile_menu" class="edit_and_delete_mobile_menu" onclick="closeDialogOnBodyclick(event)">
                ${createMobileContactActionButton("openEditContactDialog", contactsIndex, true, "&#128393", "Edit")}
                ${createMobileContactActionButton("deleteContact", contactsIndex, false, "&#128465", "Delete", "false, true")}
            </nav>
        `;
}

function getContactInitialLetter(contactsIndex) {
        return contactsList[contactsIndex].name[0];
}

function createContactListEntry(contactsIndex) {
        return `
            <div id="contact_wrapper_${contactsIndex}" class="contact_wrapper" onclick="openContactInformation(${contactsIndex})">
                <span id="initial_bg_color_${contactsIndex}" class="contact_initials contact_initials_bg">${filterInitialsOfName(contactsIndex)}</span>
                <ul>
                    <li class="contact_name">${contactsList[contactsIndex].name}</li>
                    <li class="contact_email">${contactsList[contactsIndex].email}</li>
                </ul>
            </div>
        `;
}

function createContactInformationHeader(contactsIndex) {
        return `
            <div class="contact_information_header">
                <div><span id="initial_bg_color_contact_information_${contactsIndex}" class="contact_initials contact_initials_bg contact_initials_size">${filterInitialsOfName(contactsIndex)}</span></div>
                <span class="contact_information_header_gap">
                    <p class="contact_name contact_name_font_size">${contactsList[contactsIndex].name}</p>
                    <div class="edit_and_delete_button_direction">${createDesktopContactActions(contactsIndex)}</div>
                </span>
            </div>
        `;
}

function createDesktopContactActions(contactsIndex) {
        return [
            createDesktopContactActionButton("openEditContactDialog", contactsIndex, true, "&#128393", "Edit"),
            createDesktopContactActionButton("deleteContact", contactsIndex, false, "&#128465", "Delete", "false, false"),
        ].join("");
}

function createDesktopContactActionButton(action, contactsIndex, needsEvent, icon, text, argsPrefix = "") {
        const args = buildContactActionArgs(contactsIndex, needsEvent, argsPrefix);
        return `<button class="edit_and_delete_button edit_and_delete_button_none" onclick="${action}(${args})"><p class="edit_and_delete_icon">${icon}</p> <p class="edit_and_delete_text">${text}</p></button>`;
}

function buildContactActionArgs(contactsIndex, needsEvent, argsPrefix = "") {
        const suffix = needsEvent ? `${contactsIndex}, event` : contactsIndex;
        return argsPrefix ? `${argsPrefix}, ${contactsIndex}` : suffix;
}

function createContactInformationBody(contactsIndex) {
        return `
            <span class="contact_information_body">
                ${createContactInfoRow("Email", contactsList[contactsIndex].email, "contact_email")}
                ${createContactInfoRow("Phone", contactsList[contactsIndex].phone, "contact_phone")}
            </span>
        `;
}

function createContactInfoRow(label, value, valueClass) {
        return `
            <span class="contact_email_and_phone_information">
                <h5 class="email_and_phone_headline">${label}</h5>
                <p class="${valueClass}">${value}</p>
            </span>
        `;
}

function createContactSuccessMessage() {
        return `
            <span class="contact_createdSuccesfully_span">
                <div id="contact_createdSuccesfully" class="contact_createdSuccesfully contact_createdSuccesfully_deactive">
                    <p id="contact_created_text">Contact successfully created</p>
                    <p id="contact_etited_text" class="contact_etited_text_deactive">Contact successfully edited</p>
                </div>
            </span>
        `;
}

function createContactDialogHeader(contactsIndex) {
        return `
            <header class="contact_dialog_header">
                <div class="contact_dialog_close_button_direction_responsive"><button class="close_button_responsive" onclick="closeContactDialog(${contactsIndex})">X</button></div>
                ${createContactDialogHeaderContent()}
            </header>
        `;
}

function createContactDialogHeaderContent() {
        return `
            <div id="contact_dialog_header_direction" class="contact_dialog_header_direction">
                <img class="logo logo_size_contact_dialog" src="../assets/img/join_logo.svg" alt="Join Logo">
                <h2 id="edit_or_addNew_headline" class="contact_headline_h2">Edit contact</h2>
                <p id="addNew_description_text" class="contact_description_text" style="display:none">Tasks are better with a team</p>
                <div class="header_dividingline"></div>
            </div>
        `;
}

function createContactDialogMain(contactsIndex) {
        return `
            <main class="contact_dialog_main">
                <div class="contact_dialog_close_button_direction"><button class="close_button" onclick="closeContactDialog(${contactsIndex})">X</button></div>
                <div class="contact_dialog_initial_and_assets">
                    ${createContactDialogInitial(contactsIndex)}
                    ${createContactDialogForm(contactsIndex)}
                </div>
            </main>
        `;
}

function createContactDialogInitial(contactsIndex) {
        return `
            <div id="initial_bg_color_contact_dialog_${contactsIndex}" class="contact_initials contact_initials_bg contact_initials_size contact_dialog_initial_responsive_position">
                <p id="initial_text_${contactsIndex}">${filterInitialsOfName(contactsIndex)}</p>
                <img id="initial_img_${contactsIndex}" src="../assets/icon/person_white.svg" class="display_none_button_or_img" style="width: 40px; height: 40px" alt="Contact undefined">
            </div>
        `;
}

function createContactDialogForm(contactsIndex) {
        return `
            <form id="contact_dialog_input_and_button_${contactsIndex}" class="contact_dialog_input_and_button_direction">
                ${createContactDialogInputs(contactsIndex)}
                ${createContactDialogButtons(contactsIndex)}
            </form>
        `;
}

function createContactDialogInputs(contactsIndex) {
        return `
            <div class="contact_dialog_input_direction">
                ${createContactDialogInputField(contactsIndex, "name", "text", "Name", "/assets/icon/person.svg")}
                ${createContactDialogError(contactsIndex, "name")}
                ${createContactDialogInputField(contactsIndex, "email", "email", "Email", "/assets/icon/mail.svg")}
                ${createContactDialogError(contactsIndex, "email")}
                ${createContactDialogInputField(contactsIndex, "phone", "tel", "Phone", "/assets/icon/call.svg")}
                ${createContactDialogError(contactsIndex, "phone")}
            </div>
        `;
}

function createContactDialogInputField(contactsIndex, field, type, placeholder, iconPath) {
        return `
            <div class="input-wrapper">
                <input id="contact_dialog_input_${field}_${contactsIndex}" type="${type}" placeholder="${placeholder}">
                <img src="${iconPath}" class="input-icon"/>
            </div>
        `;
}

function createContactDialogError(contactsIndex, field) {
        return `<div id="${field}_error_${contactsIndex}" class="error" style="margin-bottom: 16px; margin-left: 24px;"></div>`;
}

function createContactDialogButtons(contactsIndex) {
        return `
            <div class="contact_dialog_button_direction">
                <button type="button" id="contact_dialog_button_delete_${contactsIndex}" class="basic-btn-secondary contact_dialog_button_delete" onclick="deleteContact(true, false, ${contactsIndex})">Delete</button>
                <button type="button" id="contact_dialog_button_save_${contactsIndex}" class="button_basic_characteristics contact_dialog_button_save" onclick="saveContact('editContact', ${contactsIndex})">Save &#x2714</button>
                <button type="button" id="contact_dialog_button_cancel_${contactsIndex}" class="basic-btn-secondary display_none_button_or_img contact_dialog_button_delete contact_dialog_cancel_button_responsive" onclick="closeContactDialog(${contactsIndex})">Cancel  X</button>
                <button type="button" id="contact_dialog_button_create_${contactsIndex}" class="button_basic_characteristics display_none_button_or_img contact_dialog_button_creat" onclick="saveNewContact('addNewContact', ${contactsIndex})">Create contact &#x2714</button>
            </div>
        `;
}

function createMobileContactActionButton(action, contactsIndex, needsEvent, icon, text, argsPrefix = "") {
        const args = buildContactActionArgs(contactsIndex, needsEvent, argsPrefix);
        return `<button class="edit_and_delete_button" onclick="${action}(${args})"><p class="edit_and_delete_icon">${icon}</p> <p class="edit_and_delete_text">${text}</p></button>`;
}