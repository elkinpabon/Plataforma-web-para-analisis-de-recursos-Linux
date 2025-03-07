async function generateAndSendReportRed(email, alertMessage, networkData) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("times", "normal");

    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toLocaleDateString();
    const horaFormateada = fechaActual.toLocaleTimeString();

    pdf.setFontSize(22);
    pdf.setFont("times", "bold");
    pdf.text("INFORME DE ALERTA DE RED", 105, 20, null, null, "center");

    pdf.setFontSize(14);
    pdf.setFont("times", "italic");
    pdf.setTextColor(100);
    pdf.text(`Fecha: ${fechaFormateada} - Hora: ${horaFormateada}`, 105, 30, null, null, "center");

    pdf.setTextColor(0);
    pdf.setFont("times", "normal");
    pdf.text("Detalles de la Red", 105, 40, null, null, "center");

    pdf.text(`🔹 Adaptador: ${networkData.adaptador}`, 20, 60);
    pdf.text(`🔹 IPv4: ${networkData.ipv4 || "No disponible"}`, 20, 70);
    pdf.text(`🔹 Tipo de Conexión: ${networkData.tipo_conexion}`, 20, 80);
    pdf.text(`📥 Recepción: ${networkData.recepcion} kbps`, 20, 90);

    const pdfBlob = pdf.output("blob");
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "Informe_Red.pdf");
    formData.append("email", email);
    formData.append("network_usage", networkData.recepcion);

    await fetch('/api/send-red-alert-email/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    });

    console.log("📧 Informe de RED enviado correctamente.");
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