document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    // Если пользователь уже авторизован → отправляем на главную
    if (token) {
        window.location.href = "/index.html";
    }
});