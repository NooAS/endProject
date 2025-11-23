// Модальные окна

export function openModal(backdrop) {
    if (!backdrop) return;
    backdrop.classList.add("active");
    document.body.classList.add("modal-open");
}
export function closeModal(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove("active");
    if (!document.querySelector(".modal-backdrop.active")) {
        document.body.classList.remove("modal-open");
    }
}

// Initialize event listeners for modal close buttons
export function initModalCloseButtons() {
    const modalCloseButtons = [
        { id: 'closeCategoriesModal', modalId: 'categoriesModal' },
        { id: 'closePdfDataModal', modalId: 'pdfDataModal' },
        { id: 'closeHistoryModal', modalId: 'historyModal' },
        { id: 'closeChangeEmailModal', modalId: 'changeEmailModal' },
        { id: 'closeChangePasswordModal', modalId: 'changePasswordModal' },
        { id: 'closeInputTextModal', modalId: 'inputTextModal' },
        { id: 'closeEditTemplateModal', modalId: 'editTemplateModal' },
        { id: 'closeDeleteConfirmModal', modalId: 'deleteConfirmModal' }
    ];

    modalCloseButtons.forEach(({ id, modalId }) => {
        const closeBtn = document.getElementById(id);
        const modal = document.getElementById(modalId);
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => closeModal(modal));
            
            // Close modal when clicking on backdrop (outside modal content)
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });
}


// Универсальное модальное окно для ввода текста
export function showInputModal(title, placeholder, defaultValue = "") {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById("inputTextModal");
        const titleEl = document.getElementById("inputModalTitle");
        const inputEl = document.getElementById("inputModalText");
        const submitBtn = document.getElementById("inputModalSubmit");
        const cancelBtn = document.getElementById("inputModalCancel");

        if (!modal || !titleEl || !inputEl || !submitBtn || !cancelBtn) {
            reject(new Error("Input modal elements not found"));
            return;
        }

        titleEl.textContent = title;
        inputEl.placeholder = placeholder;
        inputEl.value = defaultValue;

        const cleanup = () => {
            submitBtn.onclick = null;
            cancelBtn.onclick = null;
            closeModal(modal);
        };

        submitBtn.onclick = () => {
            const value = inputEl.value.trim();
            cleanup();
            resolve(value);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        openModal(modal);
        inputEl.focus();
    });
}

// Модальное окно для редактирования шаблона
export function showEditTemplateModal(template) {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById("editTemplateModal");
        const nameInput = document.getElementById("editTplNameInput");
        const clientPriceInput = document.getElementById("editTplClientPriceInput");
        const materialPriceInput = document.getElementById("editTplMaterialPriceInput");
        const laborPriceInput = document.getElementById("editTplLaborPriceInput");
        const submitBtn = document.getElementById("editTplSubmit");
        const cancelBtn = document.getElementById("editTplCancel");

        if (!modal || !nameInput || !clientPriceInput || !materialPriceInput || !laborPriceInput || !submitBtn || !cancelBtn) {
            reject(new Error("Edit template modal elements not found"));
            return;
        }

        nameInput.value = template.name || "";
        clientPriceInput.value = template.defaults?.clientPrice || 0;
        materialPriceInput.value = template.defaults?.materialPrice || 0;
        laborPriceInput.value = template.defaults?.laborPrice || 0;

        const cleanup = () => {
            submitBtn.onclick = null;
            cancelBtn.onclick = null;
            closeModal(modal);
        };

        submitBtn.onclick = () => {
            const result = {
                name: nameInput.value.trim(),
                defaults: {
                    clientPrice: parseFloat(clientPriceInput.value) || 0,
                    materialPrice: parseFloat(materialPriceInput.value) || 0,
                    laborPrice: parseFloat(laborPriceInput.value) || 0
                }
            };
            cleanup();
            resolve(result);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        openModal(modal);
        nameInput.focus();
    });
}

// Модальное окно для подтверждения удаления
export function showDeleteConfirmModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("deleteConfirmModal");
        const titleEl = document.getElementById("deleteConfirmTitle");
        const messageEl = document.getElementById("deleteConfirmMessage");
        const yesBtn = document.getElementById("deleteConfirmYes");
        const noBtn = document.getElementById("deleteConfirmNo");

        if (!modal || !titleEl || !messageEl || !yesBtn || !noBtn) {
            console.error("Delete confirm modal elements not found");
            resolve(false);
            return;
        }

        if (title) titleEl.textContent = title;
        if (message) messageEl.textContent = message;

        const cleanup = () => {
            yesBtn.onclick = null;
            noBtn.onclick = null;
            closeModal(modal);
        };

        yesBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        noBtn.onclick = () => {
            cleanup();
            resolve(false);
        };

        openModal(modal);
        noBtn.focus(); // Focus on cancel button for safety
    });
}

window.closeModal = closeModal;
window.openModal = openModal;