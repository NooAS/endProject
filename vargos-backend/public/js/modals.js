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

window.closeModal = closeModal;
window.openModal = openModal;