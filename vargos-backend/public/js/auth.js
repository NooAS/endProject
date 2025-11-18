document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
        window.location.href = "/index.html";
        return;
    }

    // Элементы
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const loginBtn = document.getElementById("loginBtn");
    const regBtn = document.getElementById("regBtn");

    const emailRegex = /^\S+@\S+\.\S+$/;

    // Переключение вкладок
    tabLogin.addEventListener("click", () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
    });

    tabRegister.addEventListener("click", () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
    });

    // --- LOGIN ---
    loginBtn.addEventListener("click", async() => {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const msg = document.getElementById("loginMsg");
        msg.innerHTML = "";

        if (!email || !emailRegex.test(email)) {
            msg.innerHTML = "<div class='error'>Введите корректный email</div>";
            return;
        }

        if (!password) {
            msg.innerHTML = "<div class='error'>Введите пароль</div>";
            return;
        }

        try {
            const res = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                msg.innerHTML = `<div class='error'>${data.error}</div>`;
                return;
            }

            localStorage.setItem("token", data.token);
            msg.innerHTML = "<div class='success'>Вы успешно вошли!</div>";
            setTimeout(() => window.location.href = "/index.html", 800);

        } catch (err) {
            msg.innerHTML = "<div class='error'>Ошибка соединения</div>";
        }
    });

    // --- REGISTER ---
    regBtn.addEventListener("click", async() => {
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();
        const msg = document.getElementById("registerMsg");
        msg.innerHTML = "";

        if (!email || !emailRegex.test(email)) {
            msg.innerHTML = "<div class='error'>Введите корректный email</div>";
            return;
        }

        if (!password || password.length < 6) {
            msg.innerHTML = "<div class='error'>Пароль ≥ 6 символов</div>";
            return;
        }

        try {
            const res = await fetch("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                msg.innerHTML = `<div class='error'>${data.error}</div>`;
                return;
            }

            msg.innerHTML = "<div class='success'>Аккаунт создан!</div>";
            setTimeout(() => tabLogin.click(), 1200);

        } catch (err) {
            msg.innerHTML = "<div class='error'>Ошибка соединения</div>";
        }
    });
});