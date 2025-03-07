document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("edit-profile-modal");
    const openModalBtn = document.getElementById("edit-profile-btn");
    const closeModalBtn = document.querySelector(".close");
    const profileForm = document.getElementById("edit-profile-form");

    const loadingContainer = document.getElementById("loading-container");
    const messageModal = document.getElementById("message-modal");
    const messageText = document.getElementById("modal-message");

    const logoutBtn = document.querySelector(".btn.danger");

    // 📌 Abrir modal de edición
    openModalBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    // 📌 Cerrar modal de edición
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // 📌 Cerrar modal al hacer clic fuera de él
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // 📌 Mostrar solo el loader sin fondo modal
    function showLoading() {
        loadingContainer.style.display = "block";
    }

    // 📌 Ocultar el loader
    function hideLoading() {
        loadingContainer.style.display = "none";
    }

    // 📌 Mostrar mensaje de éxito o error
    function showMessageModal(message, success = false) {
        messageText.textContent = message;
        messageText.style.color = success ? "#2ecc71" : "#e74c3c"; // Verde para éxito, rojo para error
        messageModal.style.display = "flex";

        setTimeout(() => {
            messageModal.style.display = "none";
        }, 3000);
    }

    // 📌 Enviar formulario de edición de perfil
    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();

        showLoading();

        const formData = new FormData(profileForm);

        fetch("/profile/update/", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();

            showMessageModal(data.message, data.success);

            if (data.success) {
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        })
        .catch(error => {
            hideLoading();
            showMessageModal("❌ Error al actualizar perfil.");
        });
    });

    // 📌 Cerrar sesión
    logoutBtn.addEventListener("click", () => {
        fetch("/logout/", {
            method: "POST",
            headers: {
                "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = "/";
            } else {
                showMessageModal("❌ Error al cerrar sesión.");
            }
        })
        .catch(error => {
            showMessageModal("❌ Error al cerrar sesión.");
        });
    });
});
