// Главный файл: UI, события, отрисовка и бизнес-логика

import { Config } from "./config.js";
import { Project, Room, Work } from "./project-models.js";
import { formatCurrency, formatNumberPL, loadCompanyDataFromStorage, saveCompanyDataToStorage, loadCompanyDataFromServer } from "./helpers.js";
import { saveCategoriesToStorage } from "./categories-storage.js";
import { loadPdfSettingsFromStorage, savePdfSettingsToStorage } from "./pdf-settings-storage.js";
import { openModal, closeModal, showInputModal, showEditTemplateModal, showDeleteConfirmModal } from "./modals.js";
import { collectPdfData } from "./pdf-data.js";
import { saveQuoteToServer, loadQuotesHistory, updateQuoteStatus, getQuotesByStatus, deleteQuoteFromServer } from "./quotes-api.js";
import { generateClientPdf, generateOwnerPdf } from "./pdf-generator.js";
import {
    loadCategoriesFromServer,
    createCategoryOnServer,
    updateCategoryOnServer,
    deleteCategoryFromServer,
    createTemplateOnServer,
    updateTemplateOnServer,
    deleteTemplateFromServer
} from "./categories-api.js";

// --- INIT ---
const config = new Config();
let project = new Project(config);

// Timer intervals storage for cleanup
const activeTimers = new Map();

let pdfSettings = loadPdfSettingsFromStorage();
let pdfPriceMode;
if (pdfSettings && pdfSettings.priceMode) {
    pdfPriceMode = pdfSettings.priceMode;
} else {
    pdfPriceMode = "netto";
}
const $id = id => document.getElementById(id);
let DOM = {};

function updateDOMRefs() {
    DOM = {
        projectNameHeaderInput: $id("projectName"),
        projectNameLocalInput: $id("projectNameInputLocal"),
        cfgUseRooms: $id("cfgUseRooms"),
        cfgUseCategories: $id("cfgUseCategories"),
        cfgNumbering: $id("cfgNumbering"),
        cfgVat: $id("cfgVat"),
        applyConfigBtn: $id("applyConfigBtn"),
        roomsContainer: $id("roomsContainer"),
        newRoomNameInput: $id("newRoomName"),
        addRoomBtn: $id("addRoomBtn"),
        addGlobalWorkBtn: $id("addGlobalWorkBtn"),
        roomControls: $id("roomControls"),
        globalWorkControls: $id("globalWorkControls"),
        sumNettoEl: $id("sumNetto"),
        sumBruttoEl: $id("sumBrutto"),
        pdfGenerateBtn: $id("pdfGenerateBtn"),
        categoriesModal: $id("categoriesModal"),
        categoriesListEl: $id("categoriesList"),
        manageCategoriesBtn: $id("manageCategoriesBtn"),
        pdfDataModal: $id("pdfDataModal"),
        generateClientPdfBtn: $id("generateClientPdfBtn"),
        generateOwnerPdfBtn: $id("generateOwnerPdfBtn"),
        saveToHistoryBtn: $id("saveToHistoryBtn"),
        profileBtn: $id("profileBtn"),
        profileMenu: $id("profileMenu"),
        logoutBtnInside: $id("logoutBtnInside"),
        token: localStorage.getItem("token"),
        openHistoryBtn: $id("openHistoryBtn"),
        historyModal: $id("historyModal"),
        historyContainer: $id("historyContainer"),
        openFinishedBtn: $id("openFinishedBtn"),
        finishedModal: $id("finishedModal"),
        finishedContainer: $id("finishedContainer"),
        authBtn: $id("authBtn"),
        // optional global owner button (outside modal)
        ownerPdfButton: $id("btn-owner-pdf"),
    };
}
updateDOMRefs();

// --- EVENTS: PROJECT NAME ---
if (DOM.projectNameHeaderInput) {
    DOM.projectNameHeaderInput.addEventListener("input", () => {
        project.setName(DOM.projectNameHeaderInput.value.trim());
        if (DOM.projectNameLocalInput) DOM.projectNameLocalInput.value = project.name;
    });
}
if (DOM.projectNameLocalInput) {
    DOM.projectNameLocalInput.addEventListener("input", () => {
        project.setName(DOM.projectNameLocalInput.value.trim());
        if (DOM.projectNameHeaderInput) DOM.projectNameHeaderInput.value = project.name;
    });
}

// --- CONFIG ---
if (DOM.applyConfigBtn) {
    DOM.applyConfigBtn.addEventListener("click", () => {
        config.useRooms = DOM.cfgUseRooms ? DOM.cfgUseRooms.checked : true;
        config.useCategories = DOM.cfgUseCategories ? DOM.cfgUseCategories.checked : true;
        config.useNumbering = DOM.cfgNumbering ? DOM.cfgNumbering.checked : true;
        config.vat = DOM.cfgVat ? (parseFloat(DOM.cfgVat.value) || 23) : 23;
        // VAT mode
        let vatModeRadio = document.querySelector('input[name="vatMode"]:checked');
        if (vatModeRadio && vatModeRadio.value) {
            config.vatMode = vatModeRadio.value;
        } else {
            config.vatMode = "addToNetto";
        }
        // mode
        let modeRadio = document.querySelector('input[name="mode"]:checked');
        if (modeRadio && modeRadio.value) {
            config.mode = modeRadio.value;
        } else {
            config.mode = "simple";
        }
        if (DOM.roomControls) DOM.roomControls.style.display = config.useRooms ? "flex" : "none";
        if (DOM.globalWorkControls) DOM.globalWorkControls.style.display = config.useRooms ? "none" : "flex";
        // Сохраняем категории, но пересобираем объект
        const cats = project.categories;
        project = new Project(config);
        project.categories = cats;
        renderProject();
    });
}

// --- ROOM & WORKS ADD/REMOVE ---
if (DOM.addRoomBtn) {
    DOM.addRoomBtn.addEventListener("click", () => {
        project.addRoom(DOM.newRoomNameInput ? DOM.newRoomNameInput.value.trim() || null : null);
        if (DOM.newRoomNameInput) DOM.newRoomNameInput.value = "";
        renderProject();
    });
}
if (DOM.addGlobalWorkBtn) {
    DOM.addGlobalWorkBtn.addEventListener("click", () => {
        if (project.rooms.length === 0) project.addRoom("Pozycje ogólne");
        project.rooms[0].addWork(new Work(project.generateWorkId(project.rooms[0])));
        renderProject();
    });
}

// --- CATEGORY MODAL ---
if (DOM.manageCategoriesBtn) {
    DOM.manageCategoriesBtn.addEventListener("click", () => {
        openModal(DOM.categoriesModal);
        renderCategoriesModal();
    });
}

async function loadCategoriesFromServerF() {
    const cats = await loadCategoriesFromServer();
    project.categories = cats;
    renderCategoriesModal();
    renderProject();
}

// --- PDF ---
// Function to load company data into the PDF modal fields
async function loadCompanyDataIntoModal() {
    // Try to load from server first (user-specific data)
    let companyData = await loadCompanyDataFromServer();
    
    // If not available from server, fall back to localStorage
    if (!companyData) {
        companyData = loadCompanyDataFromStorage();
    }
    
    if (companyData) {
        const pdfCompanyNameInput = document.getElementById("pdfCompanyName");
        const pdfCompanyPersonInput = document.getElementById("pdfCompanyPerson");
        const pdfCompanyPhoneInput = document.getElementById("pdfCompanyPhone");
        const pdfCompanyEmailInput = document.getElementById("pdfCompanyEmail");
        const pdfCompanyNipInput = document.getElementById("pdfCompanyNip");
        const pdfCompanyAddressInput = document.getElementById("pdfCompanyAddress");
        
        if (pdfCompanyNameInput) pdfCompanyNameInput.value = companyData.companyName || "";
        if (pdfCompanyPersonInput) pdfCompanyPersonInput.value = companyData.companyPerson || "";
        if (pdfCompanyPhoneInput) pdfCompanyPhoneInput.value = companyData.phone || "";
        if (pdfCompanyEmailInput) pdfCompanyEmailInput.value = companyData.email || "";
        if (pdfCompanyNipInput) pdfCompanyNipInput.value = companyData.nip || "";
        if (pdfCompanyAddressInput) pdfCompanyAddressInput.value = companyData.address || "";
    }
    
    // Also load project name and address if available
    const pdfProjectNameInput = document.getElementById("pdfProjectName");
    const pdfObjectAddressInput = document.getElementById("pdfObjectAddress");
    
    if (pdfProjectNameInput && project.name) {
        pdfProjectNameInput.value = project.name;
    }
    if (pdfObjectAddressInput && project.pdfObjectAddress) {
        pdfObjectAddressInput.value = project.pdfObjectAddress;
    }
    
    // Load PDF price display setting from storage
    const pdfSettings = loadPdfSettingsFromStorage();
    const priceDisplayRadio = document.querySelector(`input[name="pdfPriceDisplay"][value="${pdfSettings.priceDisplay || "netto"}"]`);
    if (priceDisplayRadio) {
        priceDisplayRadio.checked = true;
    }
}

if (DOM.pdfGenerateBtn) DOM.pdfGenerateBtn.addEventListener("click", async () => {
    await loadCompanyDataIntoModal();
    openModal(DOM.pdfDataModal);
});
if (DOM.generateClientPdfBtn) {
    DOM.generateClientPdfBtn.addEventListener("click", async() => {
        try {
            // collectPdfData may be async or sync — await to be safe
            await collectPdfData(project);
            await saveQuoteToServer(project);
            await generateClientPdf(project, config);
            closeModal(DOM.pdfDataModal);
        } catch (err) {
            console.error("Błąd przy generowaniu PDF dla klienta:", err);
            alert("Nie udało się wygenerować PDF dla klienta. Sprawdź konsolę.");
        }
    });
}
if (DOM.generateOwnerPdfBtn) {
    DOM.generateOwnerPdfBtn.addEventListener("click", async() => {
        try {
            await collectPdfData(project);
            await saveQuoteToServer(project);
            await generateOwnerPdf(project, config); // <-- вызов генерации для владельца
            closeModal(DOM.pdfDataModal);
        } catch (err) {
            console.error("Błąd przy generowaniu PDF dla właściciela:", err);
            alert("Nie udało się wygenerować PDF dla właściciela. Sprawdź konsolę.");
        }
    });
}

// --- SAVE TO HISTORY ---
if (DOM.saveToHistoryBtn) {
    DOM.saveToHistoryBtn.addEventListener("click", async() => {
        try {
            await collectPdfData(project);
            await saveQuoteToServer(project);
            alert("Kosztorys zapisany w historii!");
            closeModal(DOM.pdfDataModal);
        } catch (err) {
            console.error("Błąd przy zapisywaniu do historii:", err);
            alert("Nie udało się zapisać do historii. Sprawdź konsolę.");
        }
    });
}

// --- HISTORY ---
if (DOM.openHistoryBtn) {
    DOM.openHistoryBtn.addEventListener("click", () => {
        openModal(DOM.historyModal);
        loadQuotesHistory(renderQuotesHistoryUI);
    });
}

// --- FINISHED WORKS MODAL ---
if (DOM.openFinishedBtn) {
    DOM.openFinishedBtn.addEventListener("click", () => {
        openModal(DOM.finishedModal);
        loadFinishedQuotes();
    });
}

async function loadFinishedQuotes() {
    const quotes = await getQuotesByStatus("finished");
    renderFinishedQuotesUI(quotes);
}

function renderFinishedQuotesUI(quotes) {
    DOM.finishedContainer.innerHTML = "";
    if (!Array.isArray(quotes) || !quotes.length) {
        DOM.finishedContainer.innerHTML = "<p>Brak zakończonych prac.</p>";
        return;
    }
    quotes.forEach(q => {
        const div = document.createElement("div");
        div.className = "panel";
        div.style.marginBottom = "15px";
        
        const finishedDate = q.finishedAt ? new Date(q.finishedAt).toLocaleString() : "";
        const startedDate = q.startedAt ? new Date(q.startedAt).toLocaleString() : "";
        
        // Calculate daily earnings and work duration using shared utility
        const calculatedDailyEarnings = calculateDailyEarnings(q.total, q.startedAt, q.finishedAt);
        const workDuration = calculateWorkDuration(q.startedAt, q.finishedAt);
        
        div.innerHTML = `
            <h3>${q.name}</h3>
            <p>Suma: <strong>${(q.total || 0).toFixed(2)} zł</strong></p>
            <p>Rozpoczęto: ${startedDate}</p>
            <p>Zakończono: ${finishedDate}</p>
            ${workDuration.displayText ? `<p>Czas pracy: <strong>${workDuration.displayText}</strong></p>` : ""}
            <p style="color:#16a34a; font-weight:500;">💰 Zarobek dzienny: <strong>${calculatedDailyEarnings.toFixed(2)} zł</strong></p>
            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
                <button class="btn" onclick="returnToHistory(${q.id})">Wróć do historii</button>
                <button class="btn secondary" onclick="deleteFinishedQuote(${q.id})">Usuń</button>
            </div>
        `;
        DOM.finishedContainer.appendChild(div);
    });
}

async function returnToHistory(id) {
    await updateQuoteStatus(id, "normal");
    loadFinishedQuotes();
}
window.returnToHistory = returnToHistory;

async function deleteFinishedQuote(id) {
    const confirmed = await showDeleteConfirmModal(
        "Usuń kosztorys?",
        "Czy na pewno chcesz usunąć ten kosztorys? Tej operacji nie można cofnąć."
    );
    if (!confirmed) return;
    
    await deleteQuoteFromServer(id);
    loadFinishedQuotes();
}
window.deleteFinishedQuote = deleteFinishedQuote;

// Format timer display
function formatTimer(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate elapsed time between two dates and return duration info
function calculateWorkDuration(startedAt, finishedAt = null) {
    if (!startedAt) return { elapsedMs: 0, elapsedDays: 0, displayText: "" };
    
    const startTime = new Date(startedAt).getTime();
    const endTime = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    const elapsedMs = endTime - startTime;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    
    // Format display text
    let displayText = "";
    if (elapsedDays < 1) {
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        displayText = `${elapsedHours.toFixed(1)} godzin`;
    } else {
        displayText = `${elapsedDays.toFixed(1)} dni`;
    }
    
    return { elapsedMs, elapsedDays, displayText };
}

// Calculate daily earnings based on total and elapsed time
function calculateDailyEarnings(total, startedAt, finishedAt = null) {
    if (!startedAt || !total) return 0;
    
    const { elapsedDays } = calculateWorkDuration(startedAt, finishedAt);
    
    // Use actual days elapsed, with a minimum of 1 day to avoid inflated values for short jobs.
    // For jobs completed in less than a day, daily earnings equals the total earned.
    const effectiveDays = Math.max(1, elapsedDays);
    
    return total / effectiveDays;
}

// Store collapsed state for history quotes
const collapsedQuotes = new Set();

function renderQuotesHistoryUI(quotes) {
    // Clear existing timers
    activeTimers.forEach((intervalId) => clearInterval(intervalId));
    activeTimers.clear();
    
    DOM.historyContainer.innerHTML = "";
    if (!Array.isArray(quotes) || !quotes.length) {
        DOM.historyContainer.innerHTML = "<p>Brak kosztorysów.</p>";
        return;
    }
    
    // Sort: inProgress first, then normal, exclude finished
    const normalQuotes = quotes.filter(q => q.status === "normal" || !q.status);
    const inProgressQuotes = quotes.filter(q => q.status === "inProgress");
    
    // Render in progress quotes first
    if (inProgressQuotes.length > 0) {
        const inProgressHeader = document.createElement("div");
        inProgressHeader.className = "history-section-header";
        inProgressHeader.innerHTML = "<h3 style='color:#2563eb; margin-bottom:12px;'>🔄 W trakcie realizacji</h3>";
        DOM.historyContainer.appendChild(inProgressHeader);
        
        inProgressQuotes.forEach(q => {
            DOM.historyContainer.appendChild(createQuoteCard(q, true));
        });
        
        // Add separator
        const separator = document.createElement("hr");
        separator.style.margin = "20px 0";
        separator.style.border = "none";
        separator.style.borderTop = "1px solid #e5e7eb";
        DOM.historyContainer.appendChild(separator);
    }
    
    // Render normal quotes
    if (normalQuotes.length > 0) {
        const normalHeader = document.createElement("div");
        normalHeader.className = "history-section-header";
        normalHeader.innerHTML = "<h3 style='color:#374151; margin-bottom:12px;'>📋 Historia kosztorysów</h3>";
        DOM.historyContainer.appendChild(normalHeader);
        
        normalQuotes.forEach(q => {
            DOM.historyContainer.appendChild(createQuoteCard(q, false));
        });
    }
}

function createQuoteCard(q, isInProgress) {
    const div = document.createElement("div");
    div.className = "panel quote-card";
    div.style.marginBottom = "15px";
    if (isInProgress) {
        div.style.borderLeft = "4px solid #2563eb";
        div.style.background = "linear-gradient(to right, #eff6ff, #ffffff)";
    }
    
    const isCollapsed = collapsedQuotes.has(q.id);
    
    // Collapsible header with name and summary
    const headerWrapper = document.createElement("div");
    headerWrapper.className = "quote-collapse-header";
    headerWrapper.style.cursor = "pointer";
    headerWrapper.style.display = "flex";
    headerWrapper.style.alignItems = "center";
    headerWrapper.style.gap = "10px";
    
    // Collapse toggle arrow
    const collapseToggle = document.createElement("span");
    collapseToggle.className = "collapse-toggle";
    if (isCollapsed) collapseToggle.classList.add("collapsed");
    collapseToggle.textContent = "▼";
    headerWrapper.appendChild(collapseToggle);
    
    // Header content with name and total
    const headerContent = document.createElement("div");
    headerContent.style.flex = "1";
    headerContent.innerHTML = `
        <h3 style="margin:0; display:inline;">${q.name}</h3>
        <span style="margin-left:12px; color:#6b7280; font-size:14px;">${(q.total || 0).toFixed(2)} zł</span>
    `;
    headerWrapper.appendChild(headerContent);
    
    div.appendChild(headerWrapper);
    
    // Collapsible body content
    const bodyContent = document.createElement("div");
    bodyContent.className = "collapsible-content";
    if (isCollapsed) bodyContent.classList.add("collapsed");
    bodyContent.style.marginTop = "12px";
    
    // Date info
    const dateInfo = document.createElement("p");
    dateInfo.style.color = "#6b7280";
    dateInfo.style.fontSize = "13px";
    dateInfo.innerHTML = `Data utworzenia: ${q.createdAt ? new Date(q.createdAt).toLocaleString() : ""}`;
    bodyContent.appendChild(dateInfo);
    
    // Toggle collapse on header click
    headerWrapper.addEventListener("click", (e) => {
        // Don't toggle if clicking on buttons (including nested elements inside buttons)
        if (e.target.closest("button")) return;
        
        const wasCollapsed = collapsedQuotes.has(q.id);
        if (wasCollapsed) {
            collapsedQuotes.delete(q.id);
        } else {
            collapsedQuotes.add(q.id);
        }
        collapseToggle.classList.toggle("collapsed");
        bodyContent.classList.toggle("collapsed");
    });
    
    // Timer and auto-calculated daily earnings for in-progress quotes
    if (isInProgress && q.startedAt) {
        const timerSection = document.createElement("div");
        timerSection.className = "timer-section";
        timerSection.style.marginTop = "12px";
        timerSection.style.padding = "12px";
        timerSection.style.background = "#f0f9ff";
        timerSection.style.borderRadius = "8px";
        
        const timerDisplay = document.createElement("div");
        timerDisplay.style.fontSize = "18px";
        timerDisplay.style.fontWeight = "600";
        timerDisplay.style.color = "#2563eb";
        timerDisplay.innerHTML = `⏱️ <span id="timer-${q.id}">00:00:00</span>`;
        timerSection.appendChild(timerDisplay);
        
        // Auto-calculated daily earnings display
        const earningsDisplay = document.createElement("div");
        earningsDisplay.style.marginTop = "10px";
        earningsDisplay.id = `earnings-display-${q.id}`;
        timerSection.appendChild(earningsDisplay);
        
        // Update timer and calculate daily earnings
        const startTime = new Date(q.startedAt).getTime();
        const updateTimerAndEarnings = () => {
            const elapsed = Date.now() - startTime;
            const timerEl = document.getElementById(`timer-${q.id}`);
            if (timerEl) {
                timerEl.textContent = formatTimer(elapsed);
            }
            
            // Calculate and display daily earnings
            const dailyEarnings = calculateDailyEarnings(q.total, q.startedAt);
            const earningsEl = document.getElementById(`earnings-display-${q.id}`);
            if (earningsEl) {
                earningsEl.innerHTML = `
                    <p style="margin:0; color:#16a34a; font-weight:500;">
                        💰 Zarobek dzienny: <strong>${dailyEarnings.toFixed(2)} zł</strong>
                    </p>
                `;
            }
        };
        updateTimerAndEarnings();
        const intervalId = setInterval(updateTimerAndEarnings, 1000);
        activeTimers.set(q.id, intervalId);
        
        bodyContent.appendChild(timerSection);
    }
    
    // Buttons section
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.marginTop = "12px";
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "10px";
    buttonsDiv.style.flexWrap = "wrap";
    
    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "btn";
    editBtn.textContent = "Edytuj";
    editBtn.onclick = (e) => { e.stopPropagation(); editQuote(q.id); };
    buttonsDiv.appendChild(editBtn);
    
    if (isInProgress) {
        // Finish button
        const finishBtn = document.createElement("button");
        finishBtn.className = "btn";
        finishBtn.style.background = "linear-gradient(135deg, #16a34a 0%, #15803d 100%)";
        finishBtn.textContent = "Zakończ";
        finishBtn.onclick = (e) => { e.stopPropagation(); finishQuote(q.id); };
        buttonsDiv.appendChild(finishBtn);
        
        // Cancel in-progress button
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "btn secondary";
        cancelBtn.textContent = "Anuluj status";
        cancelBtn.onclick = (e) => { e.stopPropagation(); cancelInProgress(q.id); };
        buttonsDiv.appendChild(cancelBtn);
    } else {
        // Start work button
        const startBtn = document.createElement("button");
        startBtn.className = "btn";
        startBtn.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        startBtn.textContent = "Rozpocznij pracę";
        startBtn.onclick = (e) => { e.stopPropagation(); startWork(q.id); };
        buttonsDiv.appendChild(startBtn);
        
        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn secondary";
        deleteBtn.textContent = "Usuń";
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteQuote(q.id); };
        buttonsDiv.appendChild(deleteBtn);
    }
    
    bodyContent.appendChild(buttonsDiv);
    div.appendChild(bodyContent);
    return div;
}

async function startWork(id) {
    await updateQuoteStatus(id, "inProgress");
    loadQuotesHistory(renderQuotesHistoryUI);
}
window.startWork = startWork;

async function finishQuote(id) {
    const confirmed = await showDeleteConfirmModal(
        "Zakończ pracę?",
        "Czy na pewno chcesz zakończyć tę pracę? Kosztorys zostanie przeniesiony do zakończonych prac."
    );
    if (!confirmed) return;
    
    await updateQuoteStatus(id, "finished");
    loadQuotesHistory(renderQuotesHistoryUI);
}
window.finishQuote = finishQuote;

async function cancelInProgress(id) {
    await updateQuoteStatus(id, "normal");
    loadQuotesHistory(renderQuotesHistoryUI);
}
window.cancelInProgress = cancelInProgress;

function editQuote(id) {
    localStorage.setItem("editQuoteId", id);
    closeModal(DOM.historyModal);
    loadQuoteFromServer(id);
}
window.editQuote = editQuote;

async function deleteQuote(id) {
    const confirmed = await showDeleteConfirmModal(
        "Usuń kosztorys?",
        "Czy na pewno chcesz usunąć ten kosztorys? Tej operacji nie można cofnąć."
    );
    if (!confirmed) return;
    
    await deleteQuoteFromServer(id);
    loadQuotesHistory(renderQuotesHistoryUI);
}
window.deleteQuote = deleteQuote;

// --- PROJECT TABLE ---
function clearRoomsUI() { if (DOM.roomsContainer) DOM.roomsContainer.innerHTML = ""; }

// Store collapsed state for rooms
const collapsedRooms = new Set();

function renderProject() {
    updateDOMRefs(); // ensure refs are current
    clearRoomsUI();
    if (!config.useRooms && project.rooms.length === 0) project.addRoom("Pozycje ogólne");
    project.rooms.forEach(room => renderRoom(room));
    const totals = project.getTotals();
    if (DOM.sumNettoEl) DOM.sumNettoEl.textContent = formatCurrency(totals.netto);
    if (DOM.sumBruttoEl) DOM.sumBruttoEl.textContent = formatCurrency(totals.brutto);
}

function renderRoom(room) {
    const roomsContainer = DOM.roomsContainer;
    if (!roomsContainer) return;

    const roomCard = document.createElement("div");
    roomCard.className = "room-card";
    roomCard.dataset.roomId = String(room.id);

    const isCollapsed = collapsedRooms.has(room.id);

    const header = document.createElement("div");
    header.className = "room-header";

    // Create collapsible title box with toggle
    const titleBox = document.createElement("div");
    titleBox.className = "room-collapse-header";
    titleBox.style.flex = "1";

    // Collapse toggle arrow
    const collapseToggle = document.createElement("span");
    collapseToggle.className = "collapse-toggle";
    if (isCollapsed) collapseToggle.classList.add("collapsed");
    collapseToggle.textContent = "▼";

    const title = document.createElement("div");
    title.className = "room-title";
    title.textContent = config.useRooms ? `${room.number}. ${room.name}` : "Pozycje";

    const meta = document.createElement("div");
    meta.className = "room-meta";
    meta.style.marginLeft = "10px";
    meta.textContent = `(${room.works.length} prac)`;

    titleBox.appendChild(collapseToggle);
    titleBox.appendChild(title);
    titleBox.appendChild(meta);
    header.appendChild(titleBox);

    const actions = document.createElement("div");
    actions.className = "room-actions row";

    const addWorkBtn = document.createElement("button");
    addWorkBtn.className = "btn secondary";
    addWorkBtn.textContent = "Dodaj pracę";
    addWorkBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addWorkToRoom(room);
    });
    actions.appendChild(addWorkBtn);

    if (config.useRooms) {
        const deleteRoomBtn = document.createElement("button");
        deleteRoomBtn.className = "btn secondary";
        deleteRoomBtn.textContent = "Usuń pokój";
        deleteRoomBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            project.removeRoom(room.id);
            renderProject();
        });
        actions.appendChild(deleteRoomBtn);
    }

    header.appendChild(actions);
    roomCard.appendChild(header);

    // Create collapsible room body
    const roomBody = document.createElement("div");
    roomBody.className = "room-body";
    if (isCollapsed) roomBody.classList.add("collapsed");

    // Toggle collapse on title box click
    titleBox.addEventListener("click", () => {
        const wasCollapsed = collapsedRooms.has(room.id);
        if (wasCollapsed) {
            collapsedRooms.delete(room.id);
        } else {
            collapsedRooms.add(room.id);
        }
        collapseToggle.classList.toggle("collapsed");
        roomBody.classList.toggle("collapsed");
    });

    if (window.innerWidth > 768) {
        const table = document.createElement("table");
        table.className = "works-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");

        function addTh(cls, text) {
            const th = document.createElement("th");
            th.classList.add(cls);
            th.textContent = text;
            headRow.appendChild(th);
        }

        if (config.useNumbering) addTh("col-kod", "Numer");

        if (config.useCategories) {
            addTh("col-cat", "Kategoria");
            addTh("col-template", "Szablon");
        } else {
            addTh("col-nazwa", "Nazwa");
        }

        addTh("col-jm", "Jm");
        addTh("col-ilosc", "Ilość");
        addTh("col-cenakl", "Cena kl.");

        if (config.mode === "extended") {
            addTh("col-mat", "Mat.");
            addTh("col-rob", "Rob.");
        }

        addTh("col-sumakl", "Suma");
        addTh("col-kosztfirmy", "Koszt");
        addTh("col-zysk", "Zysk");
        addTh("col-akcje", "Akcje");

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        room.works.forEach(work => {
            tbody.appendChild(createWorkRow(room, work, true));
        });
        table.appendChild(tbody);

        const tableWrapper = document.createElement("div");
        tableWrapper.className = "works-table-wrapper";
        tableWrapper.appendChild(table);

        roomBody.appendChild(tableWrapper);
    } else {
        const worksContainer = document.createElement("div");
        worksContainer.className = "room-works-container";
        room.works.forEach(work => {
            worksContainer.appendChild(createWorkRow(room, work, false));
        });
        roomBody.appendChild(worksContainer);
    }

    roomCard.appendChild(roomBody);
    roomsContainer.appendChild(roomCard);
}

// --- TABLE TD HELPERS ---
function createTd(v) {
    const td = document.createElement("td");
    td.textContent = v;
    return td;
}

function nameInputTd(work) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.className = "input";
    input.value = work.name || "";
    input.setAttribute("autocomplete", "off");
    input.oninput = () => { work.name = input.value; };
    td.appendChild(input);
    return td;
}

function unitTd(work) {
    const td = document.createElement("td");
    const select = document.createElement("select");
    ["m2", "szt", "mb", "kg"].forEach(u => {
        const opt = new Option(u, u);
        if (work.unit === u) opt.selected = true;
        select.appendChild(opt);
    });
    select.onchange = () => { work.unit = select.value; };
    td.appendChild(select);
    return td;
}

function qtyTd(work) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.className = "input";
    input.value = work.quantity;
    input.setAttribute("autocomplete", "off");
    input.oninput = () => {
        work.quantity = parseFloat(input.value) || 0;
        renderProject();
    };
    td.appendChild(input);
    return td;
}

function clientPriceTd(work) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.className = "input";
    input.value = work.clientPrice;
    input.setAttribute("autocomplete", "off");
    input.oninput = () => {
        work.clientPrice = parseFloat(input.value) || 0;
        renderProject();
    };
    td.appendChild(input);
    return td;
}

function categoryTd(work) {
    const td = document.createElement("td");
    const select = document.createElement("select");
    select.className = "input";
    select.appendChild(new Option("—", ""));
    project.categories.forEach(cat => {
        const opt = new Option(cat.name, cat.id);
        if (work.categoryId === cat.id) opt.selected = true;
        select.appendChild(opt);
    });
    select.onchange = () => {
        work.categoryId = select.value ? Number(select.value) : null;
        work.templateId = null;
        renderProject();
    };
    td.appendChild(select);
    return td;
}

function templateTd(work) {
    const td = document.createElement("td");
    const select = document.createElement("select");
    select.className = "input";
    select.appendChild(new Option("—", ""));
    let cat = project.categories.find(c => c.id === work.categoryId);
    if (cat) {
        cat.templates.forEach(tpl => {
            const opt = new Option(tpl.name, tpl.id);
            if (work.templateId === tpl.id) opt.selected = true;
            select.appendChild(opt);
        });
    }
    select.onchange = () => {
        work.templateId = select.value ? Number(select.value) : null;
        const currentCat = project.categories.find(c => c.id === work.categoryId);
        if (currentCat && work.templateId) {
            const tpl = currentCat.templates.find(t => t.id === work.templateId);
            if (tpl && tpl.defaults) {
                work.clientPrice = typeof tpl.defaults.clientPrice === "number" ? tpl.defaults.clientPrice : work.clientPrice;
                work.materialPrice = typeof tpl.defaults.materialPrice === "number" ? tpl.defaults.materialPrice : work.materialPrice;
                work.laborPrice = typeof tpl.defaults.laborPrice === "number" ? tpl.defaults.laborPrice : work.laborPrice;
            }
        }
        renderProject();
    };
    td.appendChild(select);
    return td;
}

// createWorkRow — desktop + mobile
function createWorkRow(room, work, isDesktop) {
    if (isDesktop) {
        const tr = document.createElement("tr");
        tr.dataset.workId = work.id;

        function makeTd(cls, value) {
            const td = document.createElement("td");
            td.classList.add(cls);
            td.textContent = value;
            return td;
        }

        if (config.useNumbering) {
            tr.appendChild(makeTd("col-kod", work.id));
        }

        if (config.useCategories) {
            // category select
            const tdCat = document.createElement("td");
            tdCat.classList.add("col-cat");
            const selectCat = document.createElement("select");
            selectCat.className = "input";
            selectCat.appendChild(new Option("—", ""));
            project.categories.forEach(cat => {
                const opt = new Option(cat.name, cat.id);
                if (work.categoryId === cat.id) opt.selected = true;
                selectCat.appendChild(opt);
            });
            selectCat.addEventListener("change", () => {
                work.categoryId = selectCat.value ? Number(selectCat.value) : null;
                work.templateId = null;
                updateTplList();
            });

            tdCat.appendChild(selectCat);
            tr.appendChild(tdCat);

            // template select
            const tdTpl = document.createElement("td");
            tdTpl.classList.add("col-template");
            const selectTpl = document.createElement("select");
            selectTpl.className = "input";
            selectTpl.appendChild(new Option("—", ""));
            tdTpl.appendChild(selectTpl);
            tr.appendChild(tdTpl);

            function updateTplList() {
                selectTpl.innerHTML = "";
                selectTpl.appendChild(new Option("—", ""));
                const cat = project.categories.find(c => c.id === work.categoryId);
                const templates = cat && cat.templates ? cat.templates : [];
                templates.forEach(tpl => {
                    const opt = new Option(tpl.name, tpl.id);
                    if (work.templateId === tpl.id) opt.selected = true;
                    selectTpl.appendChild(opt);
                });
            }

            selectTpl.addEventListener("change", () => {
                const tplId = Number(selectTpl.value) || null;
                work.templateId = tplId;
                if (!tplId) return;
                const cat = project.categories.find(c => c.id === work.categoryId);
                if (!cat) return;
                const tpl = cat.templates.find(t => t.id === tplId);
                if (!tpl || !tpl.defaults) return;
                if (typeof tpl.defaults.clientPrice === "number") work.clientPrice = tpl.defaults.clientPrice;
                if (typeof tpl.defaults.materialPrice === "number") work.materialPrice = tpl.defaults.materialPrice;
                if (typeof tpl.defaults.laborPrice === "number") work.laborPrice = tpl.defaults.laborPrice;
                renderProject();
            });

            updateTplList();
        } else {
            const tdName = document.createElement("td");
            tdName.classList.add("col-nazwa");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.className = "input";
            nameInput.value = work.name || "";
            nameInput.setAttribute("autocomplete", "off");
            nameInput.addEventListener("input", () => {
                work.name = nameInput.value;
            });
            tdName.appendChild(nameInput);
            tr.appendChild(tdName);
        }

        // unit
        const tdUnit = document.createElement("td");
        tdUnit.classList.add("col-jm");
        const selectUnit = document.createElement("select");
        selectUnit.className = "input";
        ["m2", "szt", "mb", "kg"].forEach(u => {
            const opt = document.createElement("option");
            opt.value = u;
            opt.textContent = u;
            if (work.unit === u) opt.selected = true;
            selectUnit.appendChild(opt);
        });
        selectUnit.addEventListener("change", () => work.unit = selectUnit.value);
        tdUnit.appendChild(selectUnit);
        tr.appendChild(tdUnit);

        // qty
        const tdQty = document.createElement("td");
        tdQty.classList.add("col-ilosc");
        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.className = "input";
        qtyInput.value = work.quantity;
        qtyInput.setAttribute("autocomplete", "off");
        qtyInput.addEventListener("input", () => {
            work.quantity = parseFloat(qtyInput.value) || 0;
            refresh();
        });
        tdQty.appendChild(qtyInput);
        tr.appendChild(tdQty);

        // client price
        const tdClientPrice = document.createElement("td");
        tdClientPrice.classList.add("col-cenakl");
        const clientPriceInput = document.createElement("input");
        clientPriceInput.type = "number";
        clientPriceInput.className = "input";
        clientPriceInput.value = work.clientPrice;
        clientPriceInput.setAttribute("autocomplete", "off");
        clientPriceInput.addEventListener("input", () => {
            work.clientPrice = parseFloat(clientPriceInput.value) || 0;
            refresh();
        });
        tdClientPrice.appendChild(clientPriceInput);
        tr.appendChild(tdClientPrice);

        let tdMat, tdLab;
        if (config.mode === "extended") {
            tdMat = document.createElement("td");
            tdMat.classList.add("col-mat");
            const matInput = document.createElement("input");
            matInput.type = "number";
            matInput.className = "input";
            matInput.value = work.materialPrice;
            matInput.setAttribute("autocomplete", "off");
            matInput.addEventListener("input", () => {
                work.materialPrice = parseFloat(matInput.value) || 0;
                refresh();
            });
            tdMat.appendChild(matInput);
            tr.appendChild(tdMat);

            tdLab = document.createElement("td");
            tdLab.classList.add("col-rob");
            const labInput = document.createElement("input");
            labInput.type = "number";
            labInput.className = "input";
            labInput.value = work.laborPrice;
            labInput.setAttribute("autocomplete", "off");
            labInput.addEventListener("input", () => {
                work.laborPrice = parseFloat(labInput.value) || 0;
                refresh();
            });
            tdLab.appendChild(labInput);
            tr.appendChild(tdLab);
        }

        const tdClientTotal = document.createElement("td");
        tdClientTotal.classList.add("col-sumakl");
        tr.appendChild(tdClientTotal);

        const tdCost = document.createElement("td");
        tdCost.classList.add("col-kosztfirmy");
        tr.appendChild(tdCost);

        const tdProfit = document.createElement("td");
        tdProfit.classList.add("col-zysk");
        tr.appendChild(tdProfit);

        const tdActions = document.createElement("td");
        tdActions.classList.add("col-akcje");
        const del = document.createElement("button");
        del.className = "btn secondary";
        del.textContent = "Usuń";
        del.addEventListener("click", () => {
            room.removeWork(work.id);
            renderProject();
        });
        tdActions.appendChild(del);
        tr.appendChild(tdActions);

        function refresh() {
            tdClientTotal.textContent = formatCurrency(work.clientTotal);
            tdCost.textContent = formatCurrency(work.companyCost);
            tdProfit.textContent = formatCurrency(work.profit);
            // Color code profit: green for positive, red for negative
            if (work.profit > 0) {
                tdProfit.style.color = "#16a34a"; // green
            } else if (work.profit < 0) {
                tdProfit.style.color = "#dc2626"; // red
            } else {
                tdProfit.style.color = ""; // default
            }
            const totals = project.getTotals();
            if (DOM.sumNettoEl) DOM.sumNettoEl.textContent = formatCurrency(totals.netto);
            if (DOM.sumBruttoEl) DOM.sumBruttoEl.textContent = formatCurrency(totals.brutto);
        }

        refresh();
        return tr;
    }

    // MOBILE accordion version (kept simple)
    const acc = document.createElement("div");
    acc.className = "work-accordion";

    const accHeader = document.createElement("div");
    accHeader.className = "work-acc-header";
    accHeader.innerHTML = `<span>${work.name || "Nowa pozycja"}</span><span class="work-acc-arrow">▶</span>`;
    acc.appendChild(accHeader);

    const body = document.createElement("div");
    body.className = "work-acc-body";
    acc.appendChild(body);

    accHeader.addEventListener("click", () => {
        const isOpen = acc.classList.toggle("open");
        body.style.display = isOpen ? "block" : "none";
        const arrow = accHeader.querySelector(".work-acc-arrow");
        if (arrow) arrow.style.transform = isOpen ? "rotate(90deg)" : "rotate(0deg)";
    });

    function addField(label, element) {
        const wrap = document.createElement("div");
        wrap.style.marginBottom = "12px";
        const l = document.createElement("div");
        l.textContent = label;
        l.style.fontSize = "13px";
        l.style.marginBottom = "4px";
        wrap.appendChild(l);
        wrap.appendChild(element);
        body.appendChild(wrap);
    }

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "input full-width";
    nameInput.value = work.name || "";
    nameInput.setAttribute("autocomplete", "off");
    nameInput.addEventListener("input", () => {
        work.name = nameInput.value;
        accHeader.querySelector("span").textContent = work.name || "Nowa pozycja";
    });
    addField("Название", nameInput);

    const unitSel = document.createElement("select");
    unitSel.className = "input";
    ["m2", "szt", "mb", "kg"].forEach(u => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        if (u === work.unit) opt.selected = true;
        unitSel.appendChild(opt);
    });
    unitSel.addEventListener("change", () => work.unit = unitSel.value);
    addField("Jm", unitSel);

    const qty = document.createElement("input");
    qty.type = "number";
    qty.className = "input";
    qty.value = work.quantity;
    qty.setAttribute("autocomplete", "off");
    qty.addEventListener("input", () => {
        work.quantity = parseFloat(qty.value) || 0;
        renderProject();
    });
    addField("Ilość", qty);

    const cPrice = document.createElement("input");
    cPrice.type = "number";
    cPrice.className = "input";
    cPrice.value = work.clientPrice;
    cPrice.setAttribute("autocomplete", "off");
    cPrice.addEventListener("input", () => {
        work.clientPrice = parseFloat(cPrice.value) || 0;
        renderProject();
    });
    addField("Cena kl.", cPrice);

    if (config.mode === "extended") {
        const mat = document.createElement("input");
        mat.type = "number";
        mat.className = "input";
        mat.value = work.materialPrice;
        mat.setAttribute("autocomplete", "off");
        mat.addEventListener("input", () => {
            work.materialPrice = parseFloat(mat.value) || 0;
            renderProject();
        });
        addField("Mat.", mat);

        const lab = document.createElement("input");
        lab.type = "number";
        lab.className = "input";
        lab.value = work.laborPrice;
        lab.setAttribute("autocomplete", "off");
        lab.addEventListener("input", () => {
            work.laborPrice = parseFloat(lab.value) || 0;
            renderProject();
        });
        addField("Rob.", lab);
    }

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary";
    delBtn.textContent = "Usuń";
    delBtn.addEventListener("click", () => {
        room.removeWork(work.id);
        renderProject();
    });
    body.appendChild(delBtn);

    return acc;
}

/* ===== Добавление покоев / позиций ===== */
function addRoomFromUI() {
    const name = DOM.newRoomNameInput ? DOM.newRoomNameInput.value.trim() || null : null;
    project.addRoom(name);
    if (DOM.newRoomNameInput) DOM.newRoomNameInput.value = "";
    renderProject();
}

function addWorkToRoom(room) {
    const workId = project.generateWorkId(room);
    const work = new Work(workId);
    room.addWork(work);
    renderProject();
}

function addGlobalWork() {
    if (project.rooms.length === 0) project.addRoom("Pozycje ogólne");
    const room = project.rooms[0];
    addWorkToRoom(room);
}

/* ===== Категории Modal ===== */
// Store collapsed state for categories
const collapsedCategories = new Set();

function renderCategoriesModal() {
    if (!DOM.categoriesListEl) return;
    DOM.categoriesListEl.innerHTML = "";

    const addCatRow = document.createElement("div");
    addCatRow.className = "row";
    addCatRow.style.marginBottom = "10px";

    const addCatInput = document.createElement("input");
    addCatInput.type = "text";
    addCatInput.placeholder = "Nazwa nowej kategorii";
    addCatInput.className = "input";
    addCatInput.setAttribute("autocomplete", "off");

    const addCatBtn = document.createElement("button");
    addCatBtn.className = "btn secondary";
    addCatBtn.textContent = "Dodaj kategorię";

    addCatBtn.addEventListener("click", async() => {
        const name = addCatInput.value.trim();
        if (!name) return;
        await createCategoryOnServer(name);
        await loadCategoriesFromServerF();
    });

    addCatRow.appendChild(addCatInput);
    addCatRow.appendChild(addCatBtn);
    DOM.categoriesListEl.appendChild(addCatRow);

    if (!project.categories || project.categories.length === 0) {
        const p = document.createElement("p");
        p.textContent = "Brak kategorii. Dodaj pierwszą kategorię powyżej.";
        p.style.fontSize = "13px";
        p.style.color = "#6b7280";
        DOM.categoriesListEl.appendChild(p);
        return;
    }

    project.categories.forEach(cat => {
        const card = document.createElement("div");
        card.className = "panel category-card";
        card.style.marginBottom = "10px";

        const isCollapsed = collapsedCategories.has(cat.id);

        // Create collapsible header
        const header = document.createElement("div");
        header.className = "category-header";

        const headerLeft = document.createElement("div");
        headerLeft.className = "category-header-left";

        // Collapse toggle arrow
        const collapseToggle = document.createElement("span");
        collapseToggle.className = "collapse-toggle";
        if (isCollapsed) collapseToggle.classList.add("collapsed");
        collapseToggle.textContent = "▼";

        const titleText = document.createElement("span");
        titleText.className = "category-title";
        titleText.textContent = cat.name;

        const countText = document.createElement("span");
        countText.className = "category-count";
        countText.textContent = `(${cat.templates.length} szablonów)`;

        headerLeft.appendChild(collapseToggle);
        headerLeft.appendChild(titleText);
        headerLeft.appendChild(countText);

        const tools = document.createElement("div");
        tools.style.display = "flex";
        tools.style.gap = "6px";

        const editCatBtn = document.createElement("span");
        editCatBtn.style.cursor = "pointer";
        editCatBtn.textContent = "✎";
        editCatBtn.title = "Edytuj";
        editCatBtn.onclick = async(e) => {
            e.stopPropagation();
            const newName = await showInputModal("Zmień nazwę kategorii", "Nowa nazwa kategorii", cat.name);
            if (newName && newName.trim()) {
                await updateCategoryOnServer(cat.id, newName);
                await loadCategoriesFromServerF();
            }
        };

        const deleteCatBtn = document.createElement("span");
        deleteCatBtn.style.cursor = "pointer";
        deleteCatBtn.textContent = "🗑";
        deleteCatBtn.title = "Usuń";
        deleteCatBtn.onclick = async(e) => {
            e.stopPropagation();
            const confirmed = await showDeleteConfirmModal(
                "Usuń kategorię?",
                `Czy na pewno chcesz usunąć kategorię "${cat.name}"? Tej operacji nie można cofnąć.`
            );
            if (confirmed) {
                await deleteCategoryFromServer(cat.id);
                await loadCategoriesFromServerF();
            }
        };

        tools.appendChild(editCatBtn);
        tools.appendChild(deleteCatBtn);
        header.appendChild(headerLeft);
        header.appendChild(tools);
        card.appendChild(header);

        // Create collapsible content container
        const contentContainer = document.createElement("div");
        contentContainer.className = "collapsible-content";
        if (isCollapsed) contentContainer.classList.add("collapsed");
        contentContainer.style.marginTop = "8px";

        // Toggle collapse on header click
        header.addEventListener("click", () => {
            const wasCollapsed = collapsedCategories.has(cat.id);
            if (wasCollapsed) {
                collapsedCategories.delete(cat.id);
            } else {
                collapsedCategories.add(cat.id);
            }
            collapseToggle.classList.toggle("collapsed");
            contentContainer.classList.toggle("collapsed");
        });

        // Добавление шаблона
        const addTplRow = document.createElement("div");
        addTplRow.className = "row";

        const tplNameInput = document.createElement("input");
        tplNameInput.type = "text";
        tplNameInput.className = "input";
        tplNameInput.placeholder = "Nazwa pracy w tej kategorii";
        tplNameInput.setAttribute("autocomplete", "off");

        const tplBtn = document.createElement("button");
        tplBtn.className = "btn secondary";
        tplBtn.textContent = "Dodaj pracę";

        addTplRow.appendChild(tplNameInput);
        addTplRow.appendChild(tplBtn);
        contentContainer.appendChild(addTplRow);

        const tplDefaultsLabel = document.createElement("label");
        tplDefaultsLabel.className = "checkbox";
        tplDefaultsLabel.style.marginTop = "6px";
        const tplDefaultsCheck = document.createElement("input");
        tplDefaultsCheck.type = "checkbox";
        const tplDefaultsSpan = document.createElement("span");
        tplDefaultsSpan.textContent = "Użyć domyślnych cen";
        tplDefaultsLabel.appendChild(tplDefaultsCheck);
        tplDefaultsLabel.appendChild(tplDefaultsSpan);
        contentContainer.appendChild(tplDefaultsLabel);

        const tplPricesRow = document.createElement("div");
        tplPricesRow.className = "row";
        tplPricesRow.style.marginTop = "4px";
        tplPricesRow.style.display = "none";

        const tplClientPriceInput = document.createElement("input");
        tplClientPriceInput.type = "number";
        tplClientPriceInput.className = "input input-small";
        tplClientPriceInput.placeholder = "Cena kl.";
        tplClientPriceInput.setAttribute("autocomplete", "off");
        const tplMatPriceInput = document.createElement("input");
        tplMatPriceInput.type = "number";
        tplMatPriceInput.className = "input input-small";
        tplMatPriceInput.placeholder = "Mat.";
        tplMatPriceInput.setAttribute("autocomplete", "off");
        const tplLabPriceInput = document.createElement("input");
        tplLabPriceInput.type = "number";
        tplLabPriceInput.className = "input input-small";
        tplLabPriceInput.placeholder = "Rob.";
        tplLabPriceInput.setAttribute("autocomplete", "off");
        tplPricesRow.appendChild(tplClientPriceInput);
        tplPricesRow.appendChild(tplMatPriceInput);
        tplPricesRow.appendChild(tplLabPriceInput);
        contentContainer.appendChild(tplPricesRow);

        tplDefaultsCheck.onchange = () => {
            tplPricesRow.style.display = tplDefaultsCheck.checked ? "flex" : "none";
        };

        tplBtn.onclick = async() => {
            const name = tplNameInput.value.trim();
            if (!name) return;
            const defaults = tplDefaultsCheck.checked ? {
                clientPrice: parseFloat(tplClientPriceInput.value) || 0,
                materialPrice: parseFloat(tplMatPriceInput.value) || 0,
                laborPrice: parseFloat(tplLabPriceInput.value) || 0
            } : null;
            await createTemplateOnServer(cat.id, { name, defaults });
            await loadCategoriesFromServerF();
            tplNameInput.value = "";
            tplClientPriceInput.value = "";
            tplMatPriceInput.value = "";
            tplLabPriceInput.value = "";
            tplDefaultsCheck.checked = false;
            tplPricesRow.style.display = "none";
        };

        // Список шаблонов
        if (cat.templates.length > 0) {
            const ul = document.createElement("ul");
            ul.style.listStyle = "none";
            ul.style.margin = "8px 0 0 0";
            cat.templates.forEach(tpl => {
                const li = document.createElement("li");
                li.style.display = "flex";
                li.style.justifyContent = "space-between";
                li.style.alignItems = "center";
                li.style.fontSize = "13px";
                li.style.marginBottom = "4px";
                const left = document.createElement("div");
                let text = tpl.name;
                if (tpl.defaults) {
                    text += ` (kl: ${tpl.defaults.clientPrice || 0} / mat: ${tpl.defaults.materialPrice || 0} / rob: ${tpl.defaults.laborPrice || 0})`;
                }
                left.textContent = text;
                const right = document.createElement("div");
                right.style.display = "flex";
                right.style.gap = "6px";
                const editTpl = document.createElement("span");
                editTpl.style.cursor = "pointer";
                editTpl.textContent = "✎";
                editTpl.title = "Edytuj";
                editTpl.onclick = async() => {
                    const result = await showEditTemplateModal(tpl);
                    if (result && result.name && result.name.trim()) {
                        await updateTemplateOnServer(tpl.id, result);
                        await loadCategoriesFromServerF();
                    }
                };
                const deleteTpl = document.createElement("span");
                deleteTpl.style.cursor = "pointer";
                deleteTpl.textContent = "🗑";
                deleteTpl.title = "Usuń pracę";
                deleteTpl.onclick = async() => {
                    const confirmed = await showDeleteConfirmModal(
                        "Usuń pracę?",
                        `Czy na pewno chcesz usunąć pracę "${tpl.name}"? Tej operacji nie można cofnąć.`
                    );
                    if (confirmed) {
                        await deleteTemplateFromServer(tpl.id);
                        await loadCategoriesFromServerF();
                    }
                };
                right.appendChild(editTpl);
                right.appendChild(deleteTpl);
                li.appendChild(left);
                li.appendChild(right);
                ul.appendChild(li);
            });
            contentContainer.appendChild(ul);
        }

        card.appendChild(contentContainer);
        DOM.categoriesListEl.appendChild(card);
    });
}

// --- PROFILE / MENU ---
if (DOM.profileBtn) {
    DOM.profileBtn.addEventListener("click", () => { if (DOM.profileMenu) DOM.profileMenu.classList.toggle("hidden"); });
}
document.addEventListener("click", e => {
    if (!DOM.profileBtn || !DOM.profileMenu) return;
    if (!DOM.profileBtn.contains(e.target) && !DOM.profileMenu.contains(e.target)) {
        DOM.profileMenu.classList.add("hidden");
    }
});
if (DOM.logoutBtnInside) {
    DOM.logoutBtnInside.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.reload();
    });
}

// --- CHANGE EMAIL ---
const changeLoginBtn = $id("changeLoginBtn");
const changeEmailModal = $id("changeEmailModal");
const newEmailInput = $id("newEmailInput");
const emailPasswordInput = $id("emailPasswordInput");
const submitChangeEmail = $id("submitChangeEmail");

if (changeLoginBtn) {
    changeLoginBtn.addEventListener("click", () => {
        openModal(changeEmailModal);
        if (newEmailInput) newEmailInput.value = "";
        if (emailPasswordInput) emailPasswordInput.value = "";
    });
}

if (submitChangeEmail) {
    submitChangeEmail.addEventListener("click", async() => {
        const newEmail = newEmailInput?.value?.trim();
        const password = emailPasswordInput?.value?.trim();

        if (!newEmail || !password) {
            alert("Wypełnij wszystkie pola");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Nie zalogowano");
            return;
        }

        try {
            const res = await fetch("/auth/change-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ newEmail, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Email zmieniony pomyślnie!");
                closeModal(changeEmailModal);
                if (DOM.profileMenu) DOM.profileMenu.classList.add("hidden");
            } else {
                alert(data.error || "Błąd przy zmianie emaila");
            }
        } catch (err) {
            console.error(err);
            alert("Błąd sieci");
        }
    });
}

// --- CHANGE PASSWORD ---
const changePasswordBtn = $id("changePasswordBtn");
const changePasswordModal = $id("changePasswordModal");
const oldPasswordInput = $id("oldPasswordInput");
const newPasswordInput = $id("newPasswordInput");
const confirmPasswordInput = $id("confirmPasswordInput");
const submitChangePassword = $id("submitChangePassword");

if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
        openModal(changePasswordModal);
        if (oldPasswordInput) oldPasswordInput.value = "";
        if (newPasswordInput) newPasswordInput.value = "";
        if (confirmPasswordInput) confirmPasswordInput.value = "";
    });
}

if (submitChangePassword) {
    submitChangePassword.addEventListener("click", async() => {
        const oldPassword = oldPasswordInput?.value?.trim();
        const newPassword = newPasswordInput?.value?.trim();
        const confirmPassword = confirmPasswordInput?.value?.trim();

        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("Wypełnij wszystkie pola");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Nowe hasło i potwierdzenie nie zgadzają się");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Nie zalogowano");
            return;
        }

        try {
            const res = await fetch("/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Hasło zmienione pomyślnie!");
                closeModal(changePasswordModal);
                if (DOM.profileMenu) DOM.profileMenu.classList.add("hidden");
            } else {
                alert(data.error || "Błąd przy zmianie hasła");
            }
        } catch (err) {
            console.error(err);
            alert("Błąd sieci");
        }
    });
}

// --- NOTES TOGGLE ---
const toggleNotesBtn = $id("toggleNotesBtn");
const notesContainer = $id("notesContainer");
const notesToggleIcon = $id("notesToggleIcon");
const projectNotesTextarea = $id("projectNotes");

if (toggleNotesBtn && notesContainer) {
    toggleNotesBtn.addEventListener("click", () => {
        const isVisible = notesContainer.style.display !== "none";
        notesContainer.style.display = isVisible ? "none" : "block";
        if (notesToggleIcon) {
            notesToggleIcon.textContent = isVisible ? "▼" : "▲";
        }
    });
}

// Sync notes with project
if (projectNotesTextarea) {
    projectNotesTextarea.addEventListener("input", () => {
        project.notes = projectNotesTextarea.value;
    });
}


// --- Загрузка отдельной сметы с сервера и загрузка в UI ---
async function loadQuoteFromServer(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Nie zalogowano");
        return;
    }
    try {
        const res = await fetch(`/quotes/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) {
            const text = await res.text();
            console.error("Błąd przy ładowaniu kosztorysu:", res.status, text);
            alert("Błąd ładowania kosztorysu");
            return;
        }
        const q = await res.json();

        // Сохраним текущие локальные категории, чтобы привязать по id при возможности
        const prevCats = project.categories || [];

        // Новый проект, но с прежними категориями
        project = new Project(config);
        project.categories = prevCats;

        // Если сервер сохранил конфиг в объекте quote.config — восстановим параметры UI из него.
        // Также поддерживаем простые флаги на верхнем уровне: useRooms, useNumbering, useCategories, mode, vat
        if (q.config && typeof q.config === "object") {
            if (typeof q.config.useRooms !== "undefined") config.useRooms = Boolean(q.config.useRooms);
            if (typeof q.config.useNumbering !== "undefined") config.useNumbering = Boolean(q.config.useNumbering);
            if (typeof q.config.useCategories !== "undefined") config.useCategories = Boolean(q.config.useCategories);
            if (typeof q.config.mode === "string") config.mode = q.config.mode;
            if (typeof q.config.vat !== "undefined") config.vat = Number(q.config.vat) || config.vat;
        } else {
            if (typeof q.useRooms !== "undefined") config.useRooms = Boolean(q.useRooms);
            if (typeof q.useNumbering !== "undefined") config.useNumbering = Boolean(q.useNumbering);
            if (typeof q.useCategories !== "undefined") config.useCategories = Boolean(q.useCategories);
            if (typeof q.mode === "string") config.mode = q.mode;
            if (typeof q.vat !== "undefined") config.vat = Number(q.vat) || config.vat;
        }

        // Apply config flags to UI checkboxes/radios if they exist
        if (DOM.cfgUseRooms) DOM.cfgUseRooms.checked = config.useRooms;
        if (DOM.cfgNumbering) DOM.cfgNumbering.checked = config.useNumbering;
        if (DOM.cfgUseCategories) DOM.cfgUseCategories.checked = config.useCategories;
        // mode radio
        const modeRadio = document.querySelector(`input[name="mode"][value="${config.mode}"]`);
        if (modeRadio) modeRadio.checked = true;
        if (DOM.cfgVat) DOM.cfgVat.value = String(config.vat);

        // Название
        project.setName(q.name || "");
        if (DOM.projectNameHeaderInput) DOM.projectNameHeaderInput.value = project.name;
        if (DOM.projectNameLocalInput) DOM.projectNameLocalInput.value = project.name;

        // PDF данные
        if (q.pdfCompanyData) project.pdfCompanyData = q.pdfCompanyData;
        if (q.objectAddress) project.pdfObjectAddress = q.objectAddress;

        // items
        const items = Array.isArray(q.items) ? q.items : [];

        // Если хоть один item имеет materialPrice/laborPrice — включим extended режим
        const hasExtended = items.some(it => (it.materialPrice && Number(it.materialPrice) !== 0) || (it.laborPrice && Number(it.laborPrice) !== 0));
        if (hasExtended) {
            config.mode = "extended";
            const modeRadioEx = document.querySelector(`input[name="mode"][value="extended"]`);
            if (modeRadioEx) modeRadioEx.checked = true;
        }

        // Решаем, использовать ли категории — если в items есть category non-empty
        const hasAnyCategory = items.some(it => it.category !== undefined && it.category !== null && String(it.category).trim() !== "");
        if (hasAnyCategory) {
            config.useCategories = true;
            if (DOM.cfgUseCategories) DOM.cfgUseCategories.checked = true;
        }

        // Группируем items по имени комнаты (room). Пустые идут в "Pozycje ogólne"
        const grouped = {};
        items.forEach(it => {
            const roomName = (it.room && String(it.room).trim() !== "") ? String(it.room).trim() : "Pozycje ogólne";
            if (!grouped[roomName]) grouped[roomName] = [];
            grouped[roomName].push(it);
        });

        project.rooms = [];
        project._roomAutoId = 1;

        Object.keys(grouped).forEach(roomName => {
            const room = project.addRoom(roomName === "Pozycje ogólne" ? null : roomName);
            grouped[roomName].forEach(it => {
                const workId = project.generateWorkId(room);
                const w = new Work(workId);
                w.name = it.job || it.name || "";
                w.unit = it.unit || "m2";
                w.quantity = parseFloat(it.quantity) || 0;
                w.clientPrice = parseFloat(it.price || it.clientPrice) || 0;
                w.materialPrice = parseFloat(it.materialPrice) || 0;
                w.laborPrice = parseFloat(it.laborPrice) || 0;
                w.templateId = it.templateId || null;

                // category could be id (string/number)
                if (it.category !== undefined && it.category !== null && String(it.category).trim() !== "") {
                    const cid = Number(it.category);
                    const cat = project.categories.find(c => Number(c.id) === cid);
                    if (cat) {
                        w.categoryId = cat.id;
                        if (w.templateId) {
                            const tpl = cat.templates.find(t => t.id === w.templateId);
                            if (tpl && tpl.defaults) {
                                if (typeof tpl.defaults.clientPrice === "number") w.clientPrice = tpl.defaults.clientPrice;
                                if (typeof tpl.defaults.materialPrice === "number") w.materialPrice = tpl.defaults.materialPrice;
                                if (typeof tpl.defaults.laborPrice === "number") w.laborPrice = tpl.defaults.laborPrice;
                            }
                        }
                    } else {
                        // Категория не найдена локально — оставляем categoryId null
                    }
                }

                room.addWork(w);
            });
        });

        // Восстанавливаем поля PDF в модале, если они есть
        if (project.pdfCompanyData) {
            const pdfCompanyNameInput = document.getElementById("pdfCompanyName");
            const pdfCompanyPersonInput = document.getElementById("pdfCompanyPerson");
            const pdfCompanyPhoneInput = document.getElementById("pdfCompanyPhone");
            const pdfCompanyEmailInput = document.getElementById("pdfCompanyEmail");
            const pdfCompanyNipInput = document.getElementById("pdfCompanyNip");
            const pdfCompanyAddressInput = document.getElementById("pdfCompanyAddress");
            const pdfObjectAddressInput = document.getElementById("pdfObjectAddress");
            if (pdfCompanyNameInput) pdfCompanyNameInput.value = project.pdfCompanyData.companyName || "";
            if (pdfCompanyPersonInput) pdfCompanyPersonInput.value = project.pdfCompanyData.companyPerson || "";
            if (pdfCompanyPhoneInput) pdfCompanyPhoneInput.value = project.pdfCompanyData.phone || "";
            if (pdfCompanyEmailInput) pdfCompanyEmailInput.value = project.pdfCompanyData.email || "";
            if (pdfCompanyNipInput) pdfCompanyNipInput.value = project.pdfCompanyData.nip || "";
            if (pdfCompanyAddressInput) pdfCompanyAddressInput.value = project.pdfCompanyData.address || "";
            if (pdfObjectAddressInput) pdfObjectAddressInput.value = project.pdfObjectAddress || "";
        }

        // Load notes
        if (q.notes) {
            project.notes = q.notes;
            const projectNotesTextarea = document.getElementById("projectNotes");
            if (projectNotesTextarea) {
                projectNotesTextarea.value = q.notes;
            }
        }

        // Apply UI flags: numbering, categories, rooms
        if (DOM.cfgNumbering) DOM.cfgNumbering.checked = config.useNumbering;
        if (DOM.cfgUseCategories) DOM.cfgUseCategories.checked = config.useCategories;
        if (DOM.cfgUseRooms) DOM.cfgUseRooms.checked = config.useRooms;

        renderProject();

        localStorage.removeItem("editQuoteId");
    } catch (e) {
        console.error("Błąd sieci przy ładowaniu kosztorysu:", e);
        alert("Błąd sieci przy ładowaniu kosztorysu");
    }
}
window.loadQuoteFromServer = loadQuoteFromServer;

// --- INIT ---
(async function init() {
    updateDOMRefs();
    if (DOM.token) {
        if (DOM.authBtn) DOM.authBtn.style.display = "none";
        if (DOM.profileBtn) DOM.profileBtn.style.display = "inline-block";
        await loadCategoriesFromServerF();
    } else {
        if (DOM.authBtn) DOM.authBtn.style.display = "inline-block";
        if (DOM.profileBtn) DOM.profileBtn.style.display = "none";
    }
    // restore edit id if present
    const editId = localStorage.getItem("editQuoteId");
    if (editId) {
        await loadQuoteFromServer(editId);
    } else {
        // Clear notes if not loading from history
        project.notes = "";
        if (projectNotesTextarea) projectNotesTextarea.value = "";
    }
    renderProject();
})();

// Obsługa zewnętrznego przycisku (jeśli w HTML jest przycisk id="btn-owner-pdf")
// Используем DOM.ownerPdfButton (поддерживается в updateDOMRefs)
if (DOM.ownerPdfButton) {
    DOM.ownerPdfButton.addEventListener("click", async(e) => {
        try {
            await collectPdfData(project);
            await saveQuoteToServer(project);
            await generateOwnerPdf(project, config);
            console.info("generateOwnerPdf wykonano pomyślnie (przez btn-owner-pdf).");
        } catch (err) {
            console.error("Błąd przy generowaniu PDF dla właściciela (przez btn-owner-pdf):", err);
            alert("Nie udało się wygenerować PDF dla właściciela. Sprawdź konsolę.");
        }
    });
} else {
    // Dla debugowania zostaw funkcję w window
    if (typeof generateOwnerPdf === "function") {
        window.generateOwnerPdf = generateOwnerPdf;
        console.info("generateOwnerPdf dostępna jako window.generateOwnerPdf do ręcznego wywołania");
    } else {
        console.warn("btn-owner-pdf nie znaleziono w DOM i generateOwnerPdf nie jest dostępna.");
    }
}