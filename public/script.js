document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const subjectInput = document.getElementById('subject');
    const senderInput = document.getElementById('sender');
    const messageInput = document.getElementById('message');
    const previewSubject = document.getElementById('preview-subject');
    const previewMessage = document.getElementById('preview-message');
    const previewSender = document.getElementById('preview-sender');
    const progressBar = document.getElementById('progress-bar');
    const statusInfo = document.getElementById('status-info');
    const sendBtn = document.getElementById('send-btn');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const templateButtons = document.querySelectorAll('.template-btn');
    const recipientsList = document.getElementById('recipients-list-container');
    const fileUploadInput = document.getElementById('file-upload');
    const previewNameSelect = document.getElementById('preview-name-select');
    const previewRecipientEmail = document.getElementById('preview-recipient-email');
    const fileProcessing = document.getElementById('file-processing');
    const sendingStatus = document.getElementById('sending-status');
    const previewImageContainer = document.getElementById('preview-image-container');
    const previewImage = document.getElementById('preview-image');

    // ✅ VARIABLES PARA IMAGEN
    const imageUploadInput = document.getElementById('image-upload');
    const btnSelectImage = document.getElementById('btn-select-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const imageName = document.getElementById('image-name');
    const imageSize = document.getElementById('image-size');
    const btnRemoveImage = document.getElementById('btn-remove-image');
    const imageProgressBar = document.getElementById('image-progress-bar');
    const imageProgress = document.getElementById('image-progress');
    const imageUploadStatus = document.getElementById('image-upload-status');

    let allRecipients = [];
    let currentImageUrl = null;
    let serverImageUrl = null;

    // Plantillas de correo
    const templates = {
        formal: {
            subject: "Bienvenido a Universidad NEUUNI, [NOMBRE]",
            sender: "Departamento de Atención al Cliente",
            message: "Estimado/a [NOMBRE],\n\n¡Les damos la bienvenida a la institución! Para comenzar con éxito, es crucial que se familiaricen con nuestras herramientas digitales: Curso Introductorio de Plataforma: Consulten este curso para practicar y dominar el uso de la plataforma educativa antes de que inicien sus clases.Tutoriales y Guías: Si necesitan ayuda adicional con el manejo de las plataformas, pueden encontrar todos los tutoriales detallados en el siguiente sitio web:!"
        },
        informal: {
            subject: "¡Te damos la bienvenida, [NOMBRE]!",
            sender: "El equipo de comunidad",
            message: "¡Hola [NOMBRE]!\n\n¡Estamos encantados de tenerte con nosotros! Esperamos que te sientas como en casa y disfrutes de todos nuestros servicios.\n\nSi necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos. Estamos aquí para ayudarte.\n\n¡Un saludo!"
        },
        promotional: {
            subject: "¡[NOMBRE], tu descuento especial te espera!",
            sender: "Ofertas Especiales",
            message: "¡Bienvenido a bordo, [NOMBRE]!\n\nPara celebrar tu llegada, queremos ofrecerte un 20% de descuento en tu primera compra. Usa el código: BIENVENIDO20\n\nAdemás, tendrás acceso prioritario a nuestras promociones exclusivas.\n\n¡No esperes más para disfrutar de tus beneficios!\n\nEl equipo de Promociones"
        }
    };

    // --- FUNCIONES CENTRALES ---

    function updatePreview() {
        const selectedEmail = previewNameSelect.value;
        let recipientName = '[NOMBRE]';
        let recipientEmail = '[Destinatario]';

        if (selectedEmail) {
            const recipient = allRecipients.find(r => r.email === selectedEmail);
            if (recipient) {
                recipientName = recipient.name;
                recipientEmail = recipient.email;
            }
        }

        const personalizedSubject = subjectInput.value.replace(/\[NOMBRE\]/g, recipientName);
        const personalizedMessage = messageInput.value.replace(/\[NOMBRE\]/g, recipientName);

        previewSubject.textContent = personalizedSubject;
        previewSender.textContent = senderInput.value;
        previewMessage.innerHTML = personalizedMessage.replace(/\n/g, '<br>');
        previewRecipientEmail.textContent = recipientEmail;

        // ✅ ACTUALIZAR IMAGEN EN VISTA PREVIA
        if (currentImageUrl) {
            previewImage.src = currentImageUrl;
            previewImageContainer.style.display = 'block';
        } else {
            previewImageContainer.style.display = 'none';
        }
    }

    function updateRecipientsDisplay(recipients) {
        allRecipients = recipients; 
        recipientsList.innerHTML = '';
        previewNameSelect.innerHTML = '<option value="">Selecciona un destinatario</option>'; 

        if (recipients.length === 0) {
            recipientsList.innerHTML = `
                <div class="no-recipients">
                    <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <div>No hay destinatarios cargados</div>
                    <div style="font-size: 0.8rem; margin-top: 5px;">Carga un archivo para ver los destinatarios aquí</div>
                </div>
            `;
            statusInfo.textContent = "No hay destinatarios cargados.";
            sendBtn.disabled = true;
            return;
        }

        recipients.forEach(recipient => {
            const item = document.createElement('div');
            item.className = 'recipient-item';
            item.innerHTML = `
                <input type="checkbox" checked data-name="${recipient.name}" data-email="${recipient.email}">
                <div class="recipient-info">
                    <span class="recipient-name">${recipient.name}</span>
                    <span class="recipient-email">${recipient.email}</span>
                    ${recipient.fullName ? `<span class="recipient-fullname">${recipient.fullName}</span>` : ''}
                </div>
            `;
            recipientsList.appendChild(item);

            const option = document.createElement('option');
            option.value = recipient.email;
            option.textContent = `${recipient.name} (${recipient.email})`;
            previewNameSelect.appendChild(option);
        });
        
        updatePreview();
        statusInfo.textContent = `Destinatarios cargados: ${recipients.length}`;
        sendBtn.disabled = false;
    }

    function showNotification(message, isSuccess = true) {
        notificationText.textContent = message;
        if (isSuccess) {
            notification.style.backgroundColor = '#28a745';
            notification.classList.remove('error');
        } else {
            notification.style.backgroundColor = '#dc3545';
            notification.classList.add('error');
        }
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    // ✅ FUNCIONES PARA MANEJO DE IMAGEN
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showImagePreview(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imageName.textContent = file.name;
            imageSize.textContent = formatFileSize(file.size);
            imagePreviewContainer.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }

    function removeImage() {
        imageUploadInput.value = '';
        imagePreviewContainer.style.display = 'none';
        currentImageUrl = null;
        serverImageUrl = null;
        imagePreview.src = '';
        imageProgressBar.style.display = 'none';
        imageUploadStatus.style.display = 'none';
        updatePreview();
    }

    // ✅ FUNCIÓN MEJORADA - Subir imagen al servidor
    async function uploadImageToServer(file) {
        return new Promise((resolve, reject) => {
            try {
                // Mostrar progreso
                imageProgressBar.style.display = 'block';
                imageProgress.style.width = '30%';
                imageUploadStatus.style.display = 'block';
                imageUploadStatus.textContent = 'Subiendo imagen al servidor...';
                imageUploadStatus.className = 'image-upload-status';

                const formData = new FormData();
                formData.append('image', file);

                fetch('/upload-image', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    imageProgress.style.width = '100%';
                    
                    if (result.success) {
                        imageUploadStatus.textContent = '✅ Imagen subida al servidor';
                        imageUploadStatus.className = 'image-upload-status success';
                        console.log('✅ Imagen subida al servidor:', result.imageUrl);
                        resolve(result.imageUrl);
                    } else {
                        imageUploadStatus.textContent = '❌ Error subiendo imagen: ' + result.message;
                        imageUploadStatus.className = 'image-upload-status error';
                        reject(new Error(result.message));
                    }
                })
                .catch(error => {
                    imageUploadStatus.textContent = '❌ Error de conexión';
                    imageUploadStatus.className = 'image-upload-status error';
                    reject(error);
                });
                
            } catch (error) {
                imageUploadStatus.textContent = '❌ Error: ' + error.message;
                imageUploadStatus.className = 'image-upload-status error';
                reject(error);
            }
        });
    }

    // Función para parsear el contenido del archivo
    function parseFileContent(content) {
        const recipients = [];
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('El archivo está vacío');
        }

        const firstLine = lines[0];
        const hasPipes = firstLine.includes('|');
        const hasCommas = firstLine.includes(',');

        lines.forEach((line, index) => {
            if (hasPipes) {
                const parts = line.split('|').filter(part => part.trim());
                if (parts.length >= 2 && index > 0) {
                    recipients.push({
                        name: parts[0].trim(),
                        email: parts[1].trim(),
                        fullName: parts[2] ? parts[2].trim() : ''
                    });
                }
            } else if (hasCommas) {
                const parts = line.split(',');
                if (parts.length >= 2 && index > 0) {
                    recipients.push({
                        name: parts[0].trim(),
                        email: parts[1].trim(),
                        fullName: parts[2] ? parts[2].trim() : ''
                    });
                }
            } else {
                if (index > 0 && line.trim()) {
                    const emailMatch = line.match(/\S+@\S+\.\S+/);
                    if (emailMatch) {
                        const email = emailMatch[0];
                        const name = line.replace(email, '').trim();
                        recipients.push({
                            name: name || 'Usuario',
                            email: email,
                            fullName: ''
                        });
                    }
                }
            }
        });
        
        return recipients;
    }

    // ✅ FUNCIÓN CORREGIDA - Envío REAL de correos (ENVÍO MASIVO)
    async function sendEmails(recipients) {
        sendingStatus.style.display = 'block';
        sendingStatus.innerHTML = '';
        
        let successCount = 0;
        let errorCount = 0;
        
        // Obtener la configuración del correo
        const subject = subjectInput.value;
        const message = messageInput.value;
        const sender = senderInput.value;
        
        try {
            // ✅ ENVÍO MASIVO - Usar la ruta CORRECTA /send-emails
            const response = await fetch('/send-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: subject,
                    sender: sender,
                    message: message,
                    recipients: recipients,
                    imageUrl: serverImageUrl // ✅ Solo la URL, no la imagen completa
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    // ✅ PROCESAR RESULTADOS DEL ENVÍO MASIVO
                    result.details.forEach((detail, index) => {
                        const statusItem = document.createElement('div');
                        statusItem.className = 'sending-item';
                        
                        if (detail.status === 'enviado') {
                            statusItem.innerHTML = `
                                <span class="sending-status-icon sending-success"><i class="fas fa-check-circle"></i></span>
                                ✅ ENVIADO: ${detail.name} (${detail.email})
                            `;
                            successCount++;
                        } else {
                            statusItem.innerHTML = `
                                <span class="sending-status-icon sending-error"><i class="fas fa-exclamation-circle"></i></span>
                                ❌ Error: ${detail.name} - ${detail.error}
                            `;
                            errorCount++;
                        }
                        sendingStatus.appendChild(statusItem);
                    });
                    
                    // Actualizar progreso
                    progressBar.style.width = '100%';
                    statusInfo.textContent = `Envío completado: ${successCount} éxitos, ${errorCount} errores`;
                    
                } else {
                    throw new Error(result.message || 'Error en el envío masivo');
                }
            } else {
                throw new Error(`Error HTTP ${response.status}`);
            }
            
        } catch (error) {
            const statusItem = document.createElement('div');
            statusItem.className = 'sending-item';
            statusItem.innerHTML = `
                <span class="sending-status-icon sending-error"><i class="fas fa-exclamation-circle"></i></span>
                ❌ Error de conexión: ${error.message}
            `;
            sendingStatus.appendChild(statusItem);
            errorCount = recipients.length;
        }
        
        return { successCount, errorCount };
    }

    // --- MANEJADORES DE EVENTOS ---
    
    // Selector de Plantillas
    templateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            templateButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const template = this.dataset.template;
            const templateData = templates[template];
            
            subjectInput.value = templateData.subject;
            senderInput.value = templateData.sender;
            messageInput.value = templateData.message;
            
            updatePreview();
        });
    });

    // ✅ EVENT LISTENERS PARA IMAGEN CORREGIDOS
    btnSelectImage.addEventListener('click', function() {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification('Error: El archivo debe ser una imagen', false);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('Error: La imagen no debe superar los 10MB', false);
            return;
        }

        // Mostrar vista previa local
        showImagePreview(file);
        
        try {
            // ✅ SUBIR IMAGEN AL SERVIDOR
            serverImageUrl = await uploadImageToServer(file);
            currentImageUrl = URL.createObjectURL(file); // Para vista previa local
            updatePreview();
            showNotification('Imagen cargada correctamente', true);
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            removeImage();
            showNotification('Error subiendo imagen: ' + error.message, false);
        }
    });

    btnRemoveImage.addEventListener('click', removeImage);

    // Carga de Archivo CSV/TXT
    fileUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = ['text/plain', 'text/csv', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|csv)$/i)) {
            showNotification('Error: El archivo debe ser TXT o CSV', false);
            fileUploadInput.value = '';
            return;
        }

        fileProcessing.style.display = 'block';
        
        try {
            const text = await file.text();
            const recipients = parseFileContent(text);
            
            if (recipients.length === 0) {
                throw new Error('No se encontraron destinatarios en el formato esperado. Use CSV (Nombre,Correo) o TXT con pipes (| Nombre | Correo |)');
            }
            
            updateRecipientsDisplay(recipients);
            showNotification(`Se cargaron ${recipients.length} destinatarios correctamente`, true);
            
        } catch (error) {
            console.error('Error procesando archivo:', error);
            showNotification('Error: ' + error.message, false);
        } finally {
            fileProcessing.style.display = 'none';
            fileUploadInput.value = '';
        }
    });

    // Eventos de Actualización de Vista Previa
    subjectInput.addEventListener('input', updatePreview);
    senderInput.addEventListener('input', updatePreview);
    messageInput.addEventListener('input', updatePreview);
    previewNameSelect.addEventListener('change', updatePreview);

    // ✅ Envío masivo CORREGIDO - Envío REAL
    sendBtn.addEventListener('click', async function() {
        const recipientsToSend = Array.from(recipientsList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => ({
            name: checkbox.dataset.name,
            email: checkbox.dataset.email
        }));
        
        if (recipientsToSend.length === 0) {
            showNotification("Error: No hay destinatarios seleccionados.", false);
            return;
        }
        
        // Confirmación antes del envío REAL
        const confirmSend = confirm(`¿Estás seguro de que quieres enviar ${recipientsToSend.length} correos REALES?\n\nLos correos se enviarán realmente desde Universidad NEUUNI.`);
        if (!confirmSend) return;
        
        const totalToSend = recipientsToSend.length;
        statusInfo.textContent = `🚀 Iniciando envío REAL a ${totalToSend} destinatarios...`;
        progressBar.style.width = "10%";
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviando Correos REALES...';

        try {
            const result = await sendEmails(recipientsToSend);
            
            // Mensaje final mejorado
            if (result.successCount > 0) {
                statusInfo.textContent = `✅ ${result.successCount} correos REALES enviados exitosamente`;
                showNotification(`🎉 ${result.successCount} correos REALES enviados | ❌ ${result.errorCount} errores`, result.errorCount === 0);
            } else {
                statusInfo.textContent = `❌ Falló el envío de todos los correos`;
                showNotification(`😞 No se pudo enviar ningún correo. Verifica tu configuración SMTP.`, false);
            }
            
        } catch (error) {
            statusInfo.textContent = `❌ Error crítico durante el envío`;
            showNotification(`💥 Error: ${error.message}`, false);
        }
        
        // Restaurar interfaz
        setTimeout(() => {
            progressBar.style.width = "0%";
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Correos REALES';
        }, 5000);
    });

    // Inicialización
    statusInfo.textContent = "Carga un archivo para comenzar - Listo para correos REALES";
    sendBtn.disabled = true;
});