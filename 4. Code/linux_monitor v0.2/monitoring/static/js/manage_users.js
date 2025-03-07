document.addEventListener("DOMContentLoaded", () => {
    const editForm = document.getElementById("edit-form");
    const editModal = document.getElementById("edit-modal");
    const deleteModal = document.getElementById("delete-modal");
    const loadingModal = document.getElementById("loading-modal");
    const messageModal = document.getElementById("message-modal");
    const messageText = document.getElementById("modal-message");
    let deleteUserId = null; // Variable global para almacenar el usuario a eliminar
    const searchInput = document.getElementById("search");
    const roleFilter = document.getElementById("role-filter");
    const usersTable = document.getElementById("users-table").getElementsByTagName("tr");

    // 📌 Función para filtrar usuarios
    function filterUsers() {
        const searchText = searchInput.value.toLowerCase();
        const selectedRole = roleFilter.value.toLowerCase();

        for (let row of usersTable) {
            const name = row.cells[1]?.textContent.toLowerCase() || "";
            const lastname = row.cells[2]?.textContent.toLowerCase() || "";
            const email = row.cells[3]?.textContent.toLowerCase() || "";
            const role = row.cells[4]?.textContent.toLowerCase() || "";

            const matchesSearch = name.includes(searchText) || lastname.includes(searchText) || email.includes(searchText);
            const matchesRole = selectedRole === "" || role === selectedRole;

            if (matchesSearch && matchesRole) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        }
    }

    // 📌 Aplicar filtros al escribir o cambiar selección
    searchInput.addEventListener("keyup", filterUsers);
    roleFilter.addEventListener("change", filterUsers);

    // 📌 Función para abrir el modal de edición con datos del usuario
    window.openEditModal = function(userId, name, lastname, email, roleId) {
        document.getElementById("edit-user-id").value = userId;
        document.getElementById("edit-name").value = name;
        document.getElementById("edit-lastname").value = lastname;
        document.getElementById("edit-email").value = email;
        document.getElementById("edit-role").value = roleId;
        editModal.style.display = "flex";
    };

    // 📌 Función para cerrar el modal de edición
    window.closeEditModal = function() {
        editModal.style.display = "none";
    };

    // 📌 Guardar cambios al editar usuario
    editForm.addEventListener("submit", function(event) {
        event.preventDefault();
        showLoadingModal();

        const formData = new FormData(editForm);
        const csrfToken = getCsrfToken();

        fetch("/users/update/", {
            method: "POST",
            headers: { 
                "X-CSRFToken": csrfToken,
                "Accept": "application/json"
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            closeLoadingModal();
            showMessageModal(data.message, data.success);
            if (data.success) {
                setTimeout(() => location.reload(), 1500);
            }
        })
        .catch(error => {
            closeLoadingModal();
            showMessageModal("Error al actualizar el usuario.", false);
        });
    });

    // 📌 Función para abrir el modal de confirmación para eliminar
    window.confirmDelete = function(userId) {
        deleteUserId = userId;
        deleteModal.style.display = "flex";
    };

    // 📌 Función para cerrar el modal de confirmación
    window.closeDeleteModal = function() {
        deleteModal.style.display = "none";
    };

    // 📌 Función para eliminar usuario
    window.deleteUser = function() {
        if (!deleteUserId) return;
        showLoadingModal();
        closeDeleteModal();

        fetch(`/users/delete/${deleteUserId}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCsrfToken() },
        })
        .then(response => response.json())
        .then(data => {
            closeLoadingModal();
            showMessageModal(data.message, data.success);
            if (data.success) {
                setTimeout(() => location.reload(), 1500);
            }
        })
        .catch(error => {
            closeLoadingModal();
            showMessageModal("Error al eliminar el usuario.", false);
        });
    };

    // 📌 Función para obtener el CSRF token
    function getCsrfToken() {
        const csrfInput = document.querySelector("#edit-form input[name='csrfmiddlewaretoken']");
        return csrfInput ? csrfInput.value : "";
    }

    // 📌 Función para mostrar modal de carga
    function showLoadingModal() {
        loadingModal.style.display = "flex";
    }

    // 📌 Función para cerrar modal de carga
    function closeLoadingModal() {
        loadingModal.style.display = "none";
    }

    // 📌 Función para mostrar modal de mensaje
    function showMessageModal(message, success = true) {
        messageText.textContent = message;
        messageModal.style.display = "flex";
        setTimeout(() => { messageModal.style.display = "none"; }, 2000);
    }
});
