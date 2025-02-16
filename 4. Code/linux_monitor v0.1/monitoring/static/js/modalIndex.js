document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title-text");
    const modalIcon = document.getElementById("modal-icon");
    const modalDetails = document.getElementById("modal-details-list");
    const modalImage = document.getElementById("modal-image");
    const modalClose = document.getElementById("modal-close");

    function openModal(title, details, imagePath) {
        modalTitle.textContent = title;
        modalDetails.innerHTML = details;
        modalImage.src = imagePath;
        modal.style.display = "flex";
        modal.classList.add("show"); 
    }

    modalClose.addEventListener("click", function () {
        modal.style.display = "none";
        modal.classList.remove("show");
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            modal.classList.remove("show");
        }
    });

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", function () {
            const type = this.getAttribute("data-type");

            fetch("/api/system_usage/")
                .then(response => response.json())
                .then(data => {
                    let detailsHTML = "";
                    let imagePath = "";

                    switch (type) {
                        case "cpu":
                            modalIcon.textContent = "memory";
                            imagePath = "/static/img/cpu.png";
                            openModal("Detalles del CPU", `
                                <li><strong>Modelo:</strong> ${data.cpu_model}</li>
                                <li><strong>Velocidad:</strong> ${data.cpu_speed} GHz</li>
                                <li><strong>Uso Actual:</strong> ${data.cpu_usage}%</li>
                                <li><strong>Núcleos:</strong> ${data.cpu_cores}</li>
                                <li><strong>Procesadores Lógicos:</strong> ${data.cpu_logical}</li>
                            `, imagePath);
                            break;

                        case "ram":
                            modalIcon.textContent = "storage";
                            imagePath = "/static/img/ram.png";
                            openModal("Detalles de Memoria RAM", `
                                <li><strong>Total:</strong> ${data.ram_total} GB</li>
                                <li><strong>Usada:</strong> ${data.ram_used} GB</li>
                                <li><strong>Disponible:</strong> ${(data.ram_total - data.ram_used).toFixed(2)} GB</li>
                            `, imagePath);
                            break;

                        case "net":
                            modalIcon.textContent = "wifi";
                            imagePath = "/static/img/network.png";
                            openModal("Detalles de Red", `
                                <li><strong>Velocidad de Subida:</strong> ${data.net_upload} kbps</li>
                                <li><strong>Velocidad de Bajada:</strong> ${data.net_download} kbps</li>
                            `, imagePath);
                            break;

                        case "disk":
                            modalIcon.textContent = "sd_storage";
                            imagePath = "/static/img/disk.png";
                            openModal("Detalles del Disco", `
                                <li><strong>Total:</strong> ${data.disk_total} GB</li>
                                <li><strong>Usado:</strong> ${data.disk_used} GB</li>
                                <li><strong>Disponible:</strong> ${(data.disk_total - data.disk_used).toFixed(2)} GB</li>
                            `, imagePath);
                            break;
                    }
                });
        });
    }); 
});
