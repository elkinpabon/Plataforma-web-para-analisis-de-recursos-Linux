document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    const filterOption = document.getElementById("filterOption");
    const tableRows = document.querySelectorAll("#reportTable tbody tr");

    searchInput.addEventListener("keyup", function() {
        const filterValue = searchInput.value.toLowerCase();
        const selectedFilter = filterOption.value;

        tableRows.forEach(row => {
            let cellValue = row.querySelector(`td[data-label="${selectedFilter}"]`)?.textContent.toLowerCase();
            row.style.display = cellValue && cellValue.includes(filterValue) ? "" : "none";
        });
    });
});

// 🗑️ Función para eliminar un reporte
function deleteReport(reportId) {
    if (confirm("¿Seguro que deseas eliminar este reporte?")) {
        fetch(`/delete_report/${reportId}/`, {
            method: "DELETE",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("✅ Reporte eliminado correctamente.");
                location.reload();
            } else {
                alert("❌ Error al eliminar el reporte.");
            }
        })
        .catch(error => console.error("Error:", error));
    }
}

// Función para obtener el CSRF Token
function getCSRFToken() {
    return document.cookie.split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];
}
