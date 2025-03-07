document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("alert-modal");
    const openBtn = document.getElementById("open-alert-modal");
    const closeBtns = document.querySelectorAll(".close");
    const saveBtn = document.getElementById("save-alert");
    const disableAlertsBtn = document.getElementById("disable-ram-alerts");
    const thresholdInput = document.getElementById("cpu-threshold");
    const configuredThreshold = document.getElementById("configured-threshold");
    const emailInput = document.getElementById("email-address");
    const displayEmail = document.getElementById("display-email");
    const cpuAlertModal = document.getElementById("cpu-alert-modal");
    const currentCpuUsage = document.getElementById("current-cpu-usage");
    const emailStatus = document.getElementById("email-status");
    const processList = document.getElementById("process-list-alert");

    const enableEmailAlertCheckbox = document.getElementById("enable-email-alert");
    const emailConfig = document.getElementById("email-config");
    const saveEmailBtn = document.getElementById("save-email-btn");

    let alertsEnabled = true;
    let alertTriggered = false;
    let initialCpuUsage = null;

    // Obtener el correo electrónico del usuario desde el atributo de datos
    const userEmail = document.body.getAttribute("data-user-email");
    // Cargar configuración guardada
    const savedThreshold = localStorage.getItem("cpuThreshold") || 70;
    const savedEmail = localStorage.getItem("emailAddress") || userEmail;

    // Establecer valores iniciales
    thresholdInput.value = savedThreshold;
    emailInput.value = savedEmail;
    displayEmail.textContent = savedEmail;
    configuredThreshold.textContent = `${savedThreshold}%`;

    // Abrir modal de configuración
    openBtn.addEventListener("click", () => {
        emailInput.value = localStorage.getItem("emailAddress") || userEmail; // Mostrar email guardado
        modal.style.display = "block";
    });

    // Cerrar modales
    closeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.style.display = "none";
            cpuAlertModal.style.display = "none";
        });
    });

    // Guardar configuración
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

        localStorage.setItem("cpuThreshold", thresholdInput.value);
        localStorage.setItem("emailAddress", emailInput.value.trim());

        configuredThreshold.textContent = `${thresholdInput.value}%`;
        alertsEnabled = true;
        alertTriggered = false;
        modal.style.display = "none";
    });

    // Desactivar alertas manualmente
    disableAlertsBtn.addEventListener("click", () => {
        alertsEnabled = false;
        cpuAlertModal.style.display = "none";
    });

    enableEmailAlertCheckbox.addEventListener("change", () => {
        if (enableEmailAlertCheckbox.checked) {
            emailConfig.style.display = "block";
        } else {
            emailConfig.style.display = "none";
        }
    });

    saveEmailBtn.addEventListener("click", () => {
        if (!emailInput.value.trim()) {
            alert("Por favor ingrese un correo electrónico válido.");
            return;
        }

        localStorage.setItem("emailAddress", emailInput.value.trim());
        displayEmail.textContent = emailInput.value.trim();
        alert("Correo electrónico actualizado correctamente.");
        emailConfig.style.display = "none";
    });

    // Enviar alerta por email con el informe adjunto
    async function sendEmailAlert(cpuUsage, topProcesses) {
        const email = localStorage.getItem("emailAddress") || userEmail;
        if (!email) {
            console.error("❌ No hay correo guardado para enviar la alerta.");
            emailStatus.textContent = "❌ No hay correo guardado para enviar alerta.";
            return;
        }

        console.log(`📧 Enviando alerta de CPU (${cpuUsage}%) al correo: ${email}`);
        emailStatus.textContent = "Cargando informe...";

        const alertMessage = `Uso actual de CPU: ${cpuUsage}%\n\nLos procesos más usados de la CPU son:\n${topProcesses.map(proc => `${proc.name} - CPU: ${proc.cpu_percent.toFixed(2)}%`).join('\n')}`;

        try {
            await generateAndSendReport(email, alertMessage);
            emailStatus.textContent = `Enviado a ${email}...`;
        } catch (error) {
            console.error(`❌ Error al enviar alerta: ${error.message}`);
            emailStatus.textContent = "❌ Error al enviar la alerta por correo.";
        }
    }

    // Obtener y mostrar los 3 procesos que más consumen CPU
    function fetchProcessData(callback) {
        fetch("/api/cpu_usage/")
            .then(response => response.json())
            .then(data => {
                if (data.processes && data.processes.length > 0) {
                    const topProcesses = data.processes
                        .sort((a, b) => b.cpu_percent - a.cpu_percent)
                        .slice(0, 3);

                    processList.innerHTML = ""; // Limpiar lista antes de agregar nuevos datos
                    topProcesses.forEach(process => {
                        let li = document.createElement("li");
                        li.innerHTML = `<strong>${process.name}</strong> - CPU: ${process.cpu_percent.toFixed(2)}%`;
                        processList.appendChild(li);
                    });

                    callback(topProcesses); 
                }
            })
            .catch(error => console.error("❌ Error al obtener datos de procesos:", error));
    }

    // Obtener datos del CPU y activar alerta
    function fetchCpuData() {
        if (!alertsEnabled || alertTriggered) return;

        fetch("/api/cpu_usage/")
            .then(response => response.json())
            .then(data => {
                const cpuUsage = data.cpu_usage;
                const cpuThreshold = parseFloat(localStorage.getItem("cpuThreshold")) || 70;

                if (cpuUsage >= cpuThreshold) {
                    currentCpuUsage.textContent = cpuUsage.toFixed(2);
                    cpuAlertModal.style.display = "block";
                    alertTriggered = true;

                    fetchProcessData((topProcesses) => {
                        sendEmailAlert(cpuUsage, topProcesses);
                    });
                }
            })
            .catch(error => console.error("❌ Error al obtener datos de CPU:", error));
    }

    // Iniciar monitoreo
    setInterval(fetchCpuData, 2000); // Capturar datos cada segundo
});
