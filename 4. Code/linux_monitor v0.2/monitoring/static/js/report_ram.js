let reportGenerating = false;

async function generateAndSendReportRam(email, alertMessage) {
    if (reportGenerating) {
        console.warn("⚠️ Se está generando un informe, evitando duplicados...");
        return;
    }

    reportGenerating = true;
    console.log("📌 Generando informe de RAM...");

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.setFont("times", "normal");

        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toLocaleDateString();
        const horaFormateada = fechaActual.toLocaleTimeString();

        // 🔹 Capturar la imagen del gráfico de RAM desde <div class="div1 card">
        const ramCard = document.querySelector(".div1.card");

        let ramImage = null;
        if (ramCard) {
            const canvas = await html2canvas(ramCard, { scale: 2, useCORS: true });
            ramImage = canvas.toDataURL("image/png");
        } else {
            console.error("❌ No se encontró el contenedor de RAM en la página.");
        }

        // 🔹 Encabezado del informe
        pdf.setFontSize(22);
        pdf.setFont("times", "bold");
        pdf.text("INFORME DE ALERTA DE RAM", 105, 20, null, null, "center");

        pdf.setFontSize(14);
        pdf.setFont("times", "italic");
        pdf.setTextColor(100);
        pdf.text(`Fecha: ${fechaFormateada} - Hora: ${horaFormateada}`, 105, 30, null, null, "center");

        pdf.setTextColor(0);
        pdf.setFont("times", "normal");
        pdf.text("Detalles de la Alerta de RAM", 105, 40, null, null, "center");

        pdf.setDrawColor(255, 59, 59);
        pdf.setLineWidth(1);
        pdf.line(15, 45, 195, 45);

        let y = 55;

        // 🔹 Si la imagen de RAM se capturó correctamente, agregarla al PDF
        if (ramImage) {
            let imgWidth = 160;
            let imgHeight = 100;
            let imgX = (210 - imgWidth) / 2;
            pdf.addImage(ramImage, "PNG", imgX, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("⚠️ No se pudo capturar la imagen de RAM", 105, y, null, null, "center");
            y += 20;
        }

        // 🔹 Obtener datos de RAM desde la API
        const response = await fetch("/api/ram_usage/");
        const data = await response.json();

        if (!data) {
            console.error("❌ No se pudieron obtener los datos de RAM.");
            pdf.setTextColor(255, 0, 0);
            pdf.text("❌ No se pudieron obtener los datos de RAM.", 105, y, null, null, "center");
            y += 20;
        } else {
            // 🔹 Introducción y configuración de la alerta
            pdf.setFontSize(14);
            pdf.setFont("times", "normal");
            pdf.setTextColor(0);
            let textoIntro = `
                Se ha configurado una alerta de RAM para monitorear el uso del sistema.
                A continuación, se presentan los datos registrados en el momento de la alerta.
            `;
            let introArray = textoIntro.trim().split("\n");
            introArray.forEach(line => {
                pdf.text(line.trim(), 20, y);
                y += 7;
            });

            pdf.setFontSize(16);
            pdf.setFont("times", "bold");
            pdf.setTextColor(255, 59, 59);
            pdf.text("USO DE RAM", 15, y);
            y += 10;

            pdf.setFontSize(12);
            pdf.setFont("times", "bold");
            pdf.setTextColor(0);
            const detailsText = `
                Mensaje de Alerta:  ${alertMessage}
                Uso Actual de RAM:  ${ data.ram_used} GB
                Total de RAM: ${data.ram_total} GB
                Porcentaje de Uso: ${data.ram_porcent}%
                RAM Disponible: ${(data.ram_total - data.ram_used).toFixed(2)} GB
                Memoria Caché: ${data.ram_cache !== "No disponible" ? `${data.ram_cache} GB` : "No disponible"}
                Velocidad de RAM:   ${data.ram_speed !== "No disponible" ? `${data.ram_speed}` : "No disponible"}
                Slots de RAM:  ${data.ram_slots}
            `;

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
        }

        if (y > 260) {
            pdf.addPage();
            y = 20;
        }

        pdf.setFontSize(10);
        pdf.setFont("times", "italic");
        pdf.setTextColor(120);
        pdf.text("Monitoreo de Recursos Linux - Elkinext Solutions", 105, 290, null, null, "center");

        const pdfBlob = pdf.output("blob");

        const formData = new FormData();
        formData.append("pdf", pdfBlob, "Informe_RAM.pdf");
        formData.append("email", email);
        formData.append("alert_message", alertMessage);

        const sendReportResponse = await fetch('/api/send-ram-alert-email/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const sendReportData = await sendReportResponse.json();
        if (sendReportData.success) {
            console.log('📧 Informe enviado correctamente');
            document.getElementById("email-ram-status").textContent = "📧 Informe enviado correctamente";
        } else {
            console.error('❌ Error al enviar el informe por email:', sendReportData.error);
            document.getElementById("email-ram-status").textContent = "❌ Error al enviar el informe por email";
        }

    } catch (error) {
        console.error(`❌ Error al generar y enviar el informe: ${error.message}`);
        document.getElementById("email-ram-status").textContent = `❌ Error al generar y enviar el informe: ${error.message}`;
        throw error;
    } finally {
        reportGenerating = false;
    }
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
