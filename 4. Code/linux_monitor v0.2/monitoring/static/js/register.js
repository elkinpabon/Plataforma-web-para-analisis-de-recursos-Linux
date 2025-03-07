document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const messageModal = document.getElementById("message-modal");
    const messageText = document.getElementById("modal-message");
    const modalIcon = document.getElementById("modal-icon");
    const modalTitle = document.getElementById("modal-title");
    const closeModalButton = document.querySelector(".close");
    const loadingContainer = document.getElementById("loading-container");

    messageModal.style.display = "none";
    loadingContainer.style.display = "none";

    closeModalButton.addEventListener("click", () => {
        messageModal.style.display = "none";
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const csrfToken = formData.get("csrfmiddlewaretoken");

        showLoadingContainer();

        fetch("/register/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            closeLoadingContainer();

            if (data.success) {
                showMessageModal("¡Bienvenido!", data.message, "bx bxs-check-circle", true);
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                showMessageModal("Error", data.message, "bx bxs-error-circle", false);
            }
        })
        .catch(error => {
            closeLoadingContainer();
            showMessageModal("Error", "❌ Error de conexión con el servidor.", "bx bxs-error-circle", false);
        });
    });

    function showMessageModal(title, message, iconClass, success = false) {
        modalTitle.textContent = title;
        messageText.textContent = message;
        modalIcon.className = iconClass;
        messageModal.style.display = "flex";
    }

    function showLoadingContainer() {
        loadingContainer.style.display = "flex";
    }

    function closeLoadingContainer() {
        loadingContainer.style.display = "none";
    }
});
