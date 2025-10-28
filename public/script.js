document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const textInput = document.getElementById('text-input');
    const processTextBtn = document.getElementById('process-text');
    const fileInput = document.getElementById('file-input');
    const processFileBtn = document.getElementById('process-file');
    const resultsSection = document.getElementById('results-section');
    const resultsBody = document.getElementById('results-body');
    const resultsCount = document.getElementById('results-count');
    const downloadCsvBtn = document.getElementById('download-csv');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    // Elementos para envío de correos (si existen)
    const emailSection = document.getElementById('email-section');
    const recipientsList = document.getElementById('recipients-list-container');
    
    let currentData = [];

    // Cambio de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Actualizar botones activos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar paneles activos
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });

    // Procesar texto
    processTextBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        
        if (!text) {
            showError('Por favor, ingresa algún texto para procesar.');
            return;
        }
        
        processData(text, 'text');
    });

    // Habilitar botón de procesar archivo cuando se selecciona un archivo
    fileInput.addEventListener('change', function() {
        processFileBtn.disabled = !this.files.length;
    });

    // Procesar archivo
    processFileBtn.addEventListener('click', function() {
        if (!fileInput.files.length) {
            showError('Por favor, selecciona un archivo.');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Validar tipo de archivo
        const validTypes = ['text/plain', 'text/csv', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|csv)$/i)) {
            showError('Error: El archivo debe ser TXT o CSV');
            return;
        }
        
        processData(file, 'file');
    });

    // Descargar CSV
    downloadCsvBtn.addEventListener('click', function() {
        if (currentData.length === 0) {
            showError('No hay datos para descargar.');
            return;
        }
        
        downloadCsv(currentData);
    });

    // Función para procesar datos
    function processData(data, type) {
        showLoading();
        hideError();
        
        let url, body, options;
        
        if (type === 'text') {
            url = '/api/extract';
            body = JSON.stringify({ text: data });
            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body
            };
        } else {
            // type === 'file'
            const formData = new FormData();
            formData.append('file', data);
            
            url = '/api/upload';
            options = {
                method: 'POST',
                body: formData
            };
        }
        
        fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Error del servidor');
                    });
                }
                return response.json();
            })
            .then(result => {
                hideLoading();
                
                if (result.success) {
                    currentData = result.data;
                    displayResults(result.data);
                    // ✅ NUEVO: Actualizar la lista de destinatarios para envío de correos
                    updateEmailRecipients(result.data);
                } else {
                    showError(result.error || 'Error al procesar los datos');
                }
            })
            .catch(error => {
                hideLoading();
                showError(error.message || 'Error de conexión');
            });
    }

    // Función para mostrar resultados
    function displayResults(data) {
        resultsBody.innerHTML = '';
        
        if (data.length === 0) {
            showError('No se encontraron nombres ni correos electrónicos en el texto proporcionado.');
            resultsSection.classList.add('hidden');
            return;
        }
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Número
            const numberCell = document.createElement('td');
            numberCell.textContent = index + 1;
            row.appendChild(numberCell);
            
            // Nombre
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name || 'No identificado';
            row.appendChild(nameCell);
            
            // Correo
            const emailCell = document.createElement('td');
            emailCell.textContent = item.email || 'No identificado';
            row.appendChild(emailCell);
            
            // Acciones - Envío individual
            const actionsCell = document.createElement('td');
            if (item.email && item.email !== 'No identificado') {
                const sendBtn = document.createElement('button');
                sendBtn.textContent = 'Enviar Correo';
                sendBtn.className = 'btn-send-email';
                sendBtn.addEventListener('click', () => sendIndividualEmail(item));
                actionsCell.appendChild(sendBtn);
                
                // ✅ NUEVO: Botón para agregar a lista de envío masivo
                const addBtn = document.createElement('button');
                addBtn.textContent = 'Agregar a Lista';
                addBtn.className = 'btn-secondary';
                addBtn.style.marginLeft = '5px';
                addBtn.style.fontSize = '11px';
                addBtn.addEventListener('click', () => addToEmailList(item));
                actionsCell.appendChild(addBtn);
            }
            row.appendChild(actionsCell);
            
            resultsBody.appendChild(row);
        });
        
        resultsCount.textContent = `${data.length} registro(s) encontrado(s)`;
        resultsSection.classList.remove('hidden');
    }

    // ✅ NUEVA FUNCIÓN: Actualizar lista de destinatarios para envío de correos
    function updateEmailRecipients(data) {
        // Si existe la sección de envío de correos, actualizarla
        if (recipientsList) {
            recipientsList.innerHTML = '';
            
            if (data.length === 0) {
                recipientsList.innerHTML = `
                    <div class="no-recipients">
                        <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                        <div>No hay destinatarios cargados</div>
                    </div>
                `;
                return;
            }
            
            data.forEach(recipient => {
                const item = document.createElement('div');
                item.className = 'recipient-item';
                item.innerHTML = `
                    <input type="checkbox" checked data-name="${recipient.name}" data-email="${recipient.email}">
                    <div class="recipient-info">
                        <span class="recipient-name">${recipient.name}</span>
                        <span class="recipient-email">${recipient.email}</span>
                    </div>
                `;
                recipientsList.appendChild(item);
            });
            
            // Actualizar el select de vista previa si existe
            updatePreviewSelect(data);
        }
    }

    // ✅ NUEVA FUNCIÓN: Actualizar select de vista previa
    function updatePreviewSelect(data) {
        const previewSelect = document.getElementById('preview-name-select');
        if (previewSelect) {
            previewSelect.innerHTML = '<option value="">Selecciona un destinatario</option>';
            data.forEach(recipient => {
                const option = document.createElement('option');
                option.value = recipient.email;
                option.textContent = `${recipient.name} (${recipient.email})`;
                previewSelect.appendChild(option);
            });
        }
    }

    // ✅ NUEVA FUNCIÓN: Agregar destinatario individual a la lista
    function addToEmailList(recipient) {
        if (recipientsList) {
            // Verificar si ya existe
            const existingItems = recipientsList.querySelectorAll('.recipient-item');
            let alreadyExists = false;
            
            existingItems.forEach(item => {
                const email = item.querySelector('input').dataset.email;
                if (email === recipient.email) {
                    alreadyExists = true;
                }
            });
            
            if (!alreadyExists) {
                const item = document.createElement('div');
                item.className = 'recipient-item';
                item.innerHTML = `
                    <input type="checkbox" checked data-name="${recipient.name}" data-email="${recipient.email}">
                    <div class="recipient-info">
                        <span class="recipient-name">${recipient.name}</span>
                        <span class="recipient-email">${recipient.email}</span>
                    </div>
                `;
                recipientsList.appendChild(item);
                
                // Actualizar select de vista previa
                const previewSelect = document.getElementById('preview-name-select');
                if (previewSelect) {
                    const option = document.createElement('option');
                    option.value = recipient.email;
                    option.textContent = `${recipient.name} (${recipient.email})`;
                    previewSelect.appendChild(option);
                }
                
                showNotification(`✅ ${recipient.name} agregado a la lista de envío`);
            } else {
                showNotification(`ℹ️ ${recipient.name} ya está en la lista`, false);
            }
        } else {
            showNotification('❌ La sección de envío de correos no está disponible', false);
        }
    }

    // Función para enviar correo individual
    function sendIndividualEmail(recipient) {
        // Obtener los datos del formulario de envío masivo si existen
        const subject = document.getElementById('subject') ? document.getElementById('subject').value : 'Correo de bienvenida';
        const message = document.getElementById('message') ? document.getElementById('message').value : 'Bienvenido a nuestra plataforma';
        const sender = document.getElementById('sender') ? document.getElementById('sender').value : 'Equipo de Soporte';
        
        // Personalizar el mensaje
        const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name || 'Usuario');
        const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name || 'Usuario');
        
        showLoading();
        
        fetch('/send-test-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: recipient.email,
                subject: personalizedSubject,
                message: personalizedMessage,
                sender: sender
            })
        })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.success) {
                showNotification(`✅ Correo enviado exitosamente a ${recipient.email}`);
            } else {
                showNotification(`❌ Error al enviar correo: ${result.message}`, false);
            }
        })
        .catch(error => {
            hideLoading();
            showNotification(`❌ Error de conexión: ${error.message}`, false);
        });
    }

    // Función para descargar CSV
    function downloadCsv(data) {
        const csvContent = createCsvContent(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // Función para crear contenido CSV
    function createCsvContent(data) {
        const headers = ['Número', 'Nombre', 'Email'];
        const rows = data.map((item, index) => [
            index + 1,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.email || '').replace(/"/g, '""')}"`
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // ✅ NUEVA FUNCIÓN: Mostrar notificación
    function showNotification(message, isSuccess = true) {
        // Crear notificación si no existe
        let notification = document.getElementById('global-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'global-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: #28a745;
                color: white;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateX(150%);
                opacity: 0;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
            `;
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.backgroundColor = isSuccess ? '#28a745' : '#dc3545';

        // Mostrar notificación
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';

        // Ocultar después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            notification.style.opacity = '0';
        }, 4000);
    }

    // Funciones de utilidad para UI
    function showLoading() {
        loading.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Inicialización
    processFileBtn.disabled = true;
});