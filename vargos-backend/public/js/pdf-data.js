// Сбор информации для PDF

import { saveCompanyDataToStorage, saveCompanyDataToServer } from "./helpers.js";
import { loadPdfSettingsFromStorage } from "./pdf-settings-storage.js";

// Generate a default project name based on current date
function generateDefaultProjectName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `Projekt z ${day}.${month}.${year}`;
}

export async function collectPdfData(project) {
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

    let objectAddress = pdfObjectAddressInput ? pdfObjectAddressInput.value.trim() : "";
    let projectName = pdfProjectNameInput ? pdfProjectNameInput.value.trim() : "";

    // Auto-fill logic for project name and address
    if (!projectName && objectAddress) {
        // If project name is empty but address is provided, use address as project name
        projectName = objectAddress;
    } else if (!objectAddress && projectName) {
        // If address is empty but project name is provided, use project name as address
        objectAddress = projectName;
    } else if (!projectName && !objectAddress) {
        // If both are empty, generate a default name
        projectName = generateDefaultProjectName();
        objectAddress = projectName;
    }

    // Update the input fields with the resolved values
    if (pdfProjectNameInput) pdfProjectNameInput.value = projectName;
    if (pdfObjectAddressInput) pdfObjectAddressInput.value = objectAddress;

    project.pdfCompanyData = companyData;
    project.pdfObjectAddress = objectAddress;
    project.setName(projectName);

    if (projectNameHeaderInput) projectNameHeaderInput.value = projectName;
    if (projectNameLocalInput) projectNameLocalInput.value = projectName;

    if (pdfSaveCompanyDefaults && pdfSaveCompanyDefaults.checked) {
        // Save to localStorage as fallback
        saveCompanyDataToStorage(companyData);
        // Save to server for user-specific persistence
        const serverSaveSuccess = await saveCompanyDataToServer(companyData);
        if (!serverSaveSuccess) {
            console.warn("Failed to save company data to server, using localStorage fallback only");
        }
    }

    let pdfPriceMode = loadPdfSettingsFromStorage().priceMode;
    return { companyData, objectAddress, projectName, priceMode: pdfPriceMode };
}