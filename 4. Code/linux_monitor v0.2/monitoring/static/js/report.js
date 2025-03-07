let reportGenerating = false;

async function generateAndSendReport(email, alertMessage) {
    if (reportGenerating) {
        console.warn("⚠️ Se está generando un informe, evitando duplicados...");
        return;
    }

    reportGenerating = true;
    console.log("📌 Generando informe...");

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.setFont("times", "normal");

        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toLocaleDateString();
        const horaFormateada = fechaActual.toLocaleTimeString();

        pdf.setFontSize(22);
        pdf.setFont("times", "bold");
        pdf.text("INFORME DE MONITOREO DEL SISTEMA JOSUE", 105, 20, null, null, "center");

        pdf.setFontSize(14);
        pdf.setFont("times", "italic");
        pdf.setTextColor(100);
        pdf.text(`Fecha: ${fechaFormateada} - Hora: ${horaFormateada}`, 105, 30, null, null, "center");

        pdf.setTextColor(0);
        pdf.setFont("times", "normal");
        pdf.text("Recursos del sistema LINUX", 105, 40, null, null, "center");

        pdf.setDrawColor(255, 59, 59);
        pdf.setLineWidth(1);
        pdf.line(15, 45, 195, 45);

        let y = 55;
        let capturePromises = [];

        const cards = document.querySelectorAll(".card");

        cards.forEach((card) => {
            capturePromises.push(
                html2canvas(card, { scale: 1, useCORS: true }).then(canvas => {
                    return { card, image: canvas.toDataURL("image/jpeg", 0.5) }; 
                })
            );
        });

        const systemDataResponse = await fetch("/api/system_usage/");
        const data = await systemDataResponse.json();

        console.log("📡 Datos obtenidos correctamente:", data);

        const results = await Promise.all(capturePromises);
        results.forEach(({ card, image }) => {
            const type = card.getAttribute("data-type");
            let sectionTitle = "";
            let detailsText = "";

            switch (type) {
                case "cpu":
                    sectionTitle = "USO DE CPU";
                    detailsText = `
                        - Modelo: ${data.cpu_model}
                        - Velocidad: ${data.cpu_speed} GHz
                        - Uso Actual: ${data.cpu_usage}%
                        - Núcleos: ${data.cpu_cores}
                        - Proc. Lógicos: ${data.cpu_logical}`;
                    break;

                case "ram":
                    sectionTitle = "MEMORIA RAM";
                    detailsText = `
                        - Total: ${data.ram_total} GB
                        - Usada: ${data.ram_used} GB
                        - Disponible: ${(data.ram_total - data.ram_used).toFixed(2)} GB`;
                    break;

                case "net":
                    sectionTitle = "CONEXIÓN DE RED";
                    detailsText = `
                        - Subida: ${data.net_upload} kbps
                        - Bajada: ${data.net_download} kbps`;
                    break;

                case "disk":
                    sectionTitle = "USO DE DISCO";
                    detailsText = `
                        - Total: ${data.disk_total} GB
                        - Usado: ${data.disk_used} GB
                        - Disponible: ${(data.disk_total - data.disk_used).toFixed(2)} GB`;
                    break;
            }

            pdf.setFontSize(16);
            pdf.setFont("times", "bold");
            pdf.setTextColor(255, 59, 59);
            pdf.text(sectionTitle, 15, y);
            y += 10;

            let imgWidth = 120;
            let imgHeight = 80;
            let imgX = (210 - imgWidth) / 2;
            pdf.addImage(image, "JPEG", imgX, y, imgWidth * 0.7, imgHeight * 0.7); // Reducir tamaño al 70%
            y += imgHeight + 10;

            pdf.setFontSize(12);
            pdf.setFont("times", "bold");
            pdf.setTextColor(0);

            let detailsArray = detailsText.trim().split("\n");
            detailsArray.forEach(line => {
                let [title, value] = line.split(":");
                if (title && value) {
                    pdf.text(`${title.trim()}:`, 20, y);
                    pdf.setFont("times", "normal");
                    pdf.text(value.trim(), 55, y);
                    pdf.setFont("times", "bold");
                } else {
                    pdf.text(line.trim(), 20, y);
                }
                y += 7;
            });

            pdf.setDrawColor(200);
            pdf.setLineWidth(0.4);
            pdf.line(15, y + 2, 195, y + 2);
            y += 10;

            if (y > 260) {
                pdf.addPage();
                y = 20;
            }
        });

        pdf.setFontSize(10);
        pdf.setFont("times", "italic");
        pdf.setTextColor(120);
        pdf.text("Monitoreo de Recursos Linux - Elkinext Solutions", 105, 290, null, null, "center");

        const pdfBlob = pdf.output("blob");

        const formData = new FormData();
        formData.append("pdf", pdfBlob, "Informe_Sistema.pdf");

        formData.append("email", email);
        formData.append("alert_message", alertMessage);

        const sendReportResponse = await fetch("/monitoring/api/send-alert-email/", {
            method: "POST",
            body: formData,
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        });

        const sendReportData = await sendReportResponse.json();
        if (sendReportData.success) {
            console.log("✅ Alerta enviada correctamente con el informe adjunto.");
        } else {
            console.error("❌ Error al enviar la alerta con el informe adjunto:", sendReportData.error);
        }

    } catch (error) {
        console.error("❌ Error al generar el informe:", error);
    } finally {
        reportGenerating = false;
    }
}

// Función para obtener el token CSRF
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
