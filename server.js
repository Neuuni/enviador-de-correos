require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const INSTITUTION_NAME = "Universidad NEUUNI";

// ======================================================
// 🔷 CONFIGURACIÓN BÁSICA
// ======================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// ======================================================
// 📦 RUTA PRINCIPAL - ENVÍO DE CORREOS - CORREGIDA
// ======================================================
app.post('/send-bulk-emails', async (req, res) => {
    console.log('\n=== SOLICITUD DE ENVÍO MASIVO ===');
    
    try {
        const { recipients, subject, message, imageData } = req.body;

        console.log('Destinatarios:', recipients?.length || 0);
        console.log('Asunto:', subject);
        console.log('Tiene imagen:', !!imageData); // ✅ VERIFICAR IMAGEN

        if (!recipients || recipients.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay destinatarios' 
            });
        }

        // Configurar transporter de correo
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.verify();
        console.log('✅ SMTP conectado correctamente');

        const results = {
            successCount: 0,
            errorCount: 0,
            details: []
        };

        // ✅ CORRECCIÓN: PROCESAR IMAGEN CORRECTAMENTE
        let attachment = null;
        let imageCid = null;

        if (imageData && imageData.data) {
            try {
                console.log('🖼️ Procesando imagen del frontend...');
                
                // ✅ CORREGIDO: Usar la estructura correcta del frontend
                attachment = {
                    filename: imageData.filename || "imagen-bienvenida.jpg",
                    content: imageData.data, // ✅ Ya viene en base64 del frontend
                    encoding: 'base64', // ✅ Especificar que es base64
                    contentType: imageData.mimeType || 'image/jpeg',
                    cid: 'welcome_image_neuuni' // ✅ CID único para referencia en HTML
                };
                
                imageCid = 'welcome_image_neuuni';
                console.log('✅ Imagen preparada para envío');

            } catch (err) {
                console.log("⚠ Error procesando imagen:", err.message);
            }
        }

        // Enviar correos
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            if (!recipient.email) {
                results.errorCount++;
                continue;
            }

            try {
                const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name || '');
                const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name || '');

                // ✅ CORRECCIÓN: HTML MEJORADO CON IMAGEN
                const mailOptions = {
                    from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
                    to: recipient.email,
                    subject: personalizedSubject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
                            <div style="background: #4A6FFF; padding: 25px; color: white; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px;">${INSTITUTION_NAME}</h1>
                                <p style="margin: 10px 0 0 0; opacity: 0.9;">${personalizedSubject}</p>
                            </div>
                            
                            <div style="padding: 30px; background: #f8f9fa;">
                                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- MENSAJE PRINCIPAL -->
                                    <div style="white-space: pre-line; line-height: 1.6; color: #333;">
                                        ${personalizedMessage.replace(/\n/g, '<br>')}
                                    </div>
                                    
                                    <!-- ✅ IMAGEN INCORPORADA CORRECTAMENTE -->
                                    ${attachment ? `
                                    <div style="text-align: center; margin: 25px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                        <img src="cid:${imageCid}" alt="Bienvenida ${INSTITUTION_NAME}" 
                                             style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #ddd;">
                                        <p style="margin-top: 10px; color: #666; font-size: 14px;">
                                            ${INSTITUTION_NAME} - Innovación Educativa
                                        </p>
                                    </div>
                                    ` : ''}
                                </div>

                                <!-- PIE DE PÁGINA -->
                                <div style="text-align: center; margin-top: 25px; padding: 20px; color: #666; background: white; border-radius: 8px;">
                                    <p style="margin: 0 0 10px 0;">
                                        <strong>${INSTITUTION_NAME}</strong><br>
                                        📧 ${process.env.EMAIL_USER} | 🌐 www.neuuni.com
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: #999;">
                                        ${new Date().toLocaleString('es-MX', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}<br>
                                        &copy; ${new Date().getFullYear()} ${INSTITUTION_NAME}. Todos los derechos reservados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    `,
                    text: personalizedMessage,
                    attachments: attachment ? [attachment] : [] // ✅ AÑADIR ADJUNTO SI EXISTE
                };

                console.log(`📧 Enviando a: ${recipient.email} ${attachment ? '📷' : ''}`);
                await transporter.sendMail(mailOptions);
                
                results.successCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'enviado',
                    withImage: !!attachment
                });

                console.log('✅ Correo enviado' + (attachment ? ' con imagen' : ''));

            } catch (error) {
                console.log('❌ Error:', error.message);
                results.errorCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'error',
                    error: error.message
                });
            }

            // Pausa entre envíos
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`📊 Resumen: ${results.successCount} exitosos, ${results.errorCount} errores`);

        res.json({
            success: true,
            message: `Envío completado: ${results.successCount} correos enviados${attachment ? ' con imagen' : ''}`,
            details: results.details,
            successCount: results.successCount,
            errorCount: results.errorCount,
            realDelivery: true,
            imageIncluded: !!attachment
        });

    } catch (error) {
        console.log('❌ Error general:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// ======================================================
// RUTAS EXTRAS (NO MODIFICADAS)
// ======================================================
app.post('/upload-image', (req, res) => {
    console.log('📸 Solicitud de imagen recibida');
    res.json({
        success: true,
        imageUrl: 'https://via.placeholder.com/600x300/2c5aa0/ffffff?text=NEUUNI'
    });
});

app.post('/send-test-email', async (req, res) => {
    console.log('\n🧪 SOLICITUD DE PRUEBA');
    
    try {
        const { to } = req.body;
        const testEmail = to || process.env.EMAIL_USER;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.verify();

        const mailOptions = {
            from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: `✅ Prueba ${INSTITUTION_NAME}`,
            html: `
                <div style="font-family: Arial; padding: 20px;">
                    <h2 style="color: #28a745;">✅ PRUEBA EXITOSA</h2>
                    <p>El sistema de envío masivo funciona correctamente.</p>
                    <p><strong>Institución:</strong> ${INSTITUTION_NAME}</p>
                    <p><strong>Hora:</strong> ${new Date().toLocaleString('es-MX')}</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de prueba enviado');

        res.json({
            success: true,
            message: 'Correo de prueba enviado - Revisa tu bandeja',
            messageId: info.messageId,
            realDelivery: true
        });

    } catch (error) {
        console.log('❌ Error en prueba:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        institution: INSTITUTION_NAME,
        serverTime: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor ${INSTITUTION_NAME} ejecutándose en http://localhost:${PORT}`);
    console.log('✅ Listo para enviar correos REALES con imágenes');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
    console.log('🖼️ Sistema de imágenes: ACTIVADO');
});


