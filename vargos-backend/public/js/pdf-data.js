// Сбор информации для PDF

import { saveCompanyDataToStorage } from "./helpers.js";
import { loadPdfSettingsFromStorage } from "./pdf-settings-storage.js";

export function collectPdfData(project) {
    const pdfProjectNameInput = document.getElementById("pdfProjectName");
    const pdfObjectAddressInput = document.getElementById("pdfObjectAddress");
    const pdfCompanyNameInput = document.getElementById("pdfCompanyName");
    const pdfCompanyPersonInput = document.getElementById("pdfCompanyPerson");
    const pdfCompanyPhoneInput = document.getElementById("pdfCompanyPhone");
    const pdfCompanyEmailInput = document.getElementById("pdfCompanyEmail");
    const pdfCompanyNipInput = document.getElementById("pdfCompanyNip");
    const pdfCompanyAddressInput = document.getElementById("pdfCompanyAddress");
    const pdfSaveCompanyDefaults = document.getElementById("pdfSaveCompanyDefaults");
    const projectNameHeaderInput = document.getElementById("projectName");
    const projectNameLocalInput = document.getElementById("projectNameInputLocal");

    const companyData = {
        companyName: pdfCompanyNameInput ? pdfCompanyNameInput.value.trim() : "",
        companyPerson: pdfCompanyPersonInput ? pdfCompanyPersonInput.value.trim() : "",
        phone: pdfCompanyPhoneInput ? pdfCompanyPhoneInput.value.trim() : "",
        email: pdfCompanyEmailInput ? pdfCompanyEmailInput.value.trim() : "",
        nip: pdfCompanyNipInput ? pdfCompanyNipInput.value.trim() : "",
        address: pdfCompanyAddressInput ? pdfCompanyAddressInput.value.trim() : ""
    };

    const objectAddress = pdfObjectAddressInput ? pdfObjectAddressInput.value.trim() : "";
    const projectName = pdfProjectNameInput ? pdfProjectNameInput.value.trim() : "";

    project.pdfCompanyData = companyData;
    project.pdfObjectAddress = objectAddress;
    project.setName(projectName);

    if (projectNameHeaderInput) projectNameHeaderInput.value = projectName;
    if (projectNameLocalInput) projectNameLocalInput.value = projectName;

    if (pdfSaveCompanyDefaults && pdfSaveCompanyDefaults.checked) {
        saveCompanyDataToStorage(companyData);
    }

    let pdfPriceMode = loadPdfSettingsFromStorage().priceMode;
    return { companyData, objectAddress, projectName, priceMode: pdfPriceMode };
}