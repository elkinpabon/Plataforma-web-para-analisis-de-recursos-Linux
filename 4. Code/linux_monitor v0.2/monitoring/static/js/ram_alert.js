
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("ram-alert-modal");
    const openBtn = document.getElementById("open-ram-alert-modal");
    const closeBtns = document.querySelectorAll(".close");
    const saveBtn = document.getElementById("save-alert");
    const disableAlertsBtn = document.getElementById("disable-ram-alerts");
    const thresholdInput = document.getElementById("ram-threshold");
    const configuredThreshold = document.getElementById("configured-threshold");
    const emailInput = document.getElementById("email-address");
    const displayEmail = document.getElementById("display-email");
    const ramAlertModal = document.getElementById("ram-alert-popup");
    const currentRamUsage = document.getElementById("current-ram-usage");
    const emailStatus = document.getElementById("email-ram-status");

    const enableEmailAlertCheckbox = document.getElementById("enable-email-alert");
    const saveEmailBtn = document.getElementById("save-email-btn");
    const emailConfig = document.getElementById("email-config");

    let alertsEnabled = true;
    let alertTriggered = false;

    // 🔹 Obtener el correo del usuario desde el atributo `data-user-email`
    const userEmail = document.body.getAttribute("data-user-email") || null;

    // 🔹 Crear modal de "Iniciar sesión o registrarse" si no existe
    let loginModal = document.createElement("div");
    loginModal.id = "login-modal";
    loginModal.className = "modal";
    loginModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="close-login-modal">&times;</span>
            <h2>⚠️ Necesita iniciar sesión</h2>
            <p>Para recibir alertas, debe iniciar sesión o registrarse.</p>
            <div class="modal-actions">
                <button onclick="window.location.href='/login/'" class="btn-login">Iniciar Sesión</button>
                <button onclick="window.location.href='/register/'" class="btn-register">Registrarse</button>
            </div>
        </div>
    `;
    document.body.appendChild(loginModal);
    const closeLoginModalBtn = document.getElementById("close-login-modal");

    closeLoginModalBtn.addEventListener("click", () => {
        loginModal.style.display = "none";
    });

    // 🔹 Cargar configuración guardada
    const savedThreshold = localStorage.getItem("ramThreshold") || 70;
    const savedEmail = localStorage.getItem("ramEmailAddress") || userEmail;

    // 🔹 Establecer valores iniciales
    thresholdInput.value = savedThreshold;
    if (emailInput) {
        emailInput.value = savedEmail;
    }
    displayEmail.textContent = savedEmail || "No registrado";
    configuredThreshold.textContent = `${savedThreshold}%`;

    // 🔹 Abrir modal de configuración
    openBtn.addEventListener("click", () => {
        if (emailInput) {
            emailInput.value = localStorage.getItem("ramEmailAddress") || userEmail;
        }
        modal.style.display = "block";
    });

    // 🔹 Cerrar modales
    closeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.style.display = "none";
            ramAlertModal.style.display = "none";
        });
    });

    // 🔹 Guardar configuración
    saveBtn.addEventListener("click", () => {
        if (!emailInput.value.trim()) {
            const alertModal = document.createElement("div");
            alertModal.classList.add("modal");
            alertModal.innerHTML = `
                <div class="modal-content" style="position: fixed; top: 10%; left: 42%; transform: translate(-10%, -10%);">
                    <span class="close">&times;</span>
                    <p>Por favor registrese o ingrese con usuario</p>
                </div>
            `;
            document.body.appendChild(alertModal);
            alertModal.style.display = "block";

            alertModal.querySelector(".close").addEventListener("click", () => {
                alertModal.style.display = "none";
                document.body.removeChild(alertModal);
            });
            return;
        }

        localStorage.setItem("ramThreshold", thresholdInput.value);
        if (emailInput) {
            localStorage.setItem("ramEmailAddress", emailInput.value.trim());
        }

        configuredThreshold.textContent = `${thresholdInput.value}%`;
        alertsEnabled = true;
        alertTriggered = false;
        modal.style.display = "none";
    });

    // 🔹 Desactivar alertas manualmente
    disableAlertsBtn.addEventListener("click", () => {
        alertsEnabled = false;
        ramAlertModal.style.display = "none";
    });

    enableEmailAlertCheckbox.addEventListener("change", () => {
        emailConfig.style.display = enableEmailAlertCheckbox.checked ? "block" : "none";
    });

    saveEmailBtn.addEventListener("click", () => {
        if (emailInput && !emailInput.value.trim()) {
            alert("Por favor ingrese un correo electrónico válido.");
            return;
        }

        if (emailInput) {
            localStorage.setItem("ramEmailAddress", emailInput.value.trim());
            displayEmail.textContent = emailInput.value.trim();
        }
        alert("Correo electrónico actualizado correctamente.");
        emailConfig.style.display = "none";
    });

    // 🔹 Enviar alerta por email
    async function sendRamEmailAlert(ramUsage) {
        const email = localStorage.getItem("ramEmailAddress") || userEmail;
        if (!email) {
            console.error("❌ No hay correo guardado para enviar la alerta.");
            emailStatus.textContent = "❌ No hay correo guardado para enviar alerta.";
            loginModal.style.display = "block"; // Mostrar modal de login
            return;
        }

        console.log(`📧 Enviando alerta de RAM (${ramUsage}%) al correo: ${email}`);
        emailStatus.textContent = "Cargando informe...";

        const alertMessage = `Uso actual de RAM: ${ramUsage}%`;

        try {
            await generateAndSendReportRam(email, alertMessage);
            emailStatus.textContent = `Enviado a ${email}...`;
        } catch (error) {
            console.error(`❌ Error al enviar alerta: ${error.message}`);
            emailStatus.textContent = "❌ Error al enviar la alerta por correo.";
        }
    }

    // 🔹 Obtener datos de la RAM y activar alerta
    function fetchRamData() {
        if (!alertsEnabled || alertTriggered) return;

        fetch("/api/ram_usage/")
            .then(response => response.json())
            .then(data => {
                const ramUsage = data.ram_porcent;
                const ramThreshold = parseFloat(localStorage.getItem("ramThreshold")) || 70;

                if (ramUsage >= ramThreshold) {
                    currentRamUsage.textContent = ramUsage.toFixed(2);
                    ramAlertModal.style.display = "block";
                    alertTriggered = true;

                    sendRamEmailAlert(ramUsage);
                }
            })
            .catch(error => console.error("❌ Error al obtener datos de RAM:", error));
    }

    // 🔹 Obtener token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // 🔹 Iniciar monitoreo de RAM
    setInterval(fetchRamData, 2000);
});
