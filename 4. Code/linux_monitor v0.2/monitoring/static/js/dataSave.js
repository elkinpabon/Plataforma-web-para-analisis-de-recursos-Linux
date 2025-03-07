// Variable global para controlar el estado de guardado
let isSaving = false;

// Función para remover listeners existentes y agregar uno nuevo
function initializeSaveButton() {
    const saveButton = document.getElementById('saveDataBtn');
    
    // Remover todos los event listeners existentes
    const newButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newButton, saveButton);
    
    // Agregar el nuevo event listener
    newButton.addEventListener('click', handleSave);
}

// Función para manejar el guardado
async function handleSave(event) {
    event.preventDefault();
    
    // Evitar guardado múltiple
    if (isSaving) {
        console.log('Ya hay un guardado en proceso');
        return;
    }

    const saveButton = document.getElementById('saveDataBtn');
    
    try {
        isSaving = true;
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="material-icons">hourglass_empty</i> Guardando...';

        const response = await fetch('/system_usage/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})  // Asegúrate de enviar un cuerpo de solicitud válido
        });

        const data = await response.json();

        if (response.ok) {
            showModal('Guardado Exitoso', '✅ ' + data.message);
        } else {
            showModal('Error', '❌ ' + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        showModal('Error', '❌ Error al guardar los datos');
    } finally {
        isSaving = false;
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="material-icons">save</i> Guardar Datos';
    }
}

// Función para mostrar el modal con mensajes
function showModal(title, message) {
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('messageModalTitle');
    const modalBody = document.getElementById('messageModalBody');
    const modalClose = document.getElementById('messageModalClose');

    modalTitle.textContent = title;
    modalBody.textContent = message;
    modal.style.display = 'block';

    modalClose.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Inicializar el botón cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeSaveButton();
});