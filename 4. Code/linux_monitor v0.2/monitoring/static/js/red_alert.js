document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("red-alert-modal");
    const openBtn = document.getElementById("open-red-alert-modal");
    const closeBtns = document.querySelectorAll(".close");
    const saveBtn = document.getElementById("save-alert");
    const disableAlertsBtn = document.getElementById("disable-red-alerts");
    const thresholdInput = document.getElementById("red-threshold");
    const configuredThreshold = document.getElementById("configured-threshold");
    const emailInput = document.getElementById("email-address");
    const displayEmail = document.getElementById("display-email");
    const redAlertModal = document.getElementById("red-alert-popup");
    const currentRedUsage = document.getElementById("current-red-usage");
    const emailStatus = document.getElementById("email-red-status");

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
    const savedThreshold = localStorage.getItem("redThreshold") || 70;
    const savedEmail = localStorage.getItem("redEmailAddress") || userEmail;

    // 🔹 Establecer valores iniciales
    thresholdInput.value = savedThreshold;
    if (emailInput) {
        emailInput.value = savedEmail;
    }
    displayEmail.textContent = savedEmail || "No registrado";
    configuredThreshold.textContent = `${savedThreshold} Kbps`;

    // 🔹 Abrir modal de configuración
    openBtn.addEventListener("click", () => {
        if (emailInput) {
            emailInput.value = localStorage.getItem("redEmailAddress") || userEmail;
        }
        modal.style.display = "block";
    });

    // 🔹 Cerrar modales
    closeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.style.display = "none";
            redAlertModal.style.display = "none";
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

        localStorage.setItem("redThreshold", thresholdInput.value);
        if (emailInput) {
            localStorage.setItem("redEmailAddress", emailInput.value.trim());
        }

        configuredThreshold.textContent = `${thresholdInput.value} Kbps`;
        alertsEnabled = true;
        alertTriggered = false;
        modal.style.display = "none";
    });

    // 🔹 Desactivar alertas manualmente
    disableAlertsBtn.addEventListener("click", () => {
        alertsEnabled = false;
        redAlertModal.style.display = "none";
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
            localStorage.setItem("redEmailAddress", emailInput.value.trim());
            displayEmail.textContent = emailInput.value.trim();
        }
        alert("Correo electrónico actualizado correctamente.");
        emailConfig.style.display = "none";
    });

    // 🔹 Obtener datos de la RED y activar alerta
    function fetchNetworkData() {
        if (!alertsEnabled || alertTriggered) return;

        fetch("/api/network_usage/")
            .then(response => response.json())
            .then(data => {
                const downloadSpeed = data.main_interface.recepcion;
                const networkThreshold = parseFloat(localStorage.getItem("redThreshold")) || 1000;

                if (downloadSpeed >= networkThreshold) {
                    currentRedUsage.textContent = `${downloadSpeed} kbps`;
                    redAlertModal.style.display = "block";
                    alertTriggered = true;

                    sendNetworkEmailAlert(downloadSpeed, data.main_interface);
                }
            })
            .catch(error => console.error("❌ Error al obtener datos de RED:", error));
    }

    // 🔹 Enviar alerta por email
    async function sendNetworkEmailAlert(downloadSpeed, networkData) {
        const email = localStorage.getItem("redEmailAddress") || userEmail;
        if (!email) {
            console.error("❌ No hay correo guardado para enviar la alerta.");
            emailStatus.textContent = "❌ No hay correo guardado para enviar alerta.";
            loginModal.style.display = "block";
            return;
        }

        console.log(`📧 Enviando alerta de RED (${downloadSpeed} kbps) al correo: ${email}`);
        emailStatus.textContent = "Cargando informe...";

        const alertMessage = `Velocidad de descarga: ${downloadSpeed} kbps`;

        try {
            await generateAndSendReportRed(email, alertMessage, networkData);
            emailStatus.textContent = `Enviado a ${email}...`;
        } catch (error) {
            console.error(`❌ Error al enviar alerta: ${error.message}`);
            emailStatus.textContent = "❌ Error al enviar la alerta por correo.";
        }
    }

    // 🔹 Iniciar monitoreo de RED
    setInterval(fetchNetworkData, 2000);
});
