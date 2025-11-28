require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const INSTITUTION_NAME = "Universidad NEUUNI";

// Configuración básica
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Ruta principal - ENVÍOS REALES
app.post('/send-bulk-emails', async (req, res) => {
    console.log('\n=== 📧 SOLICITUD DE ENVÍO MASIVO ===');
    
    try {
        const { recipients, subject, message, imageUrl } = req.body;
        
        console.log('Destinatarios:', recipients?.length || 0);
        console.log('Asunto:', subject);

        if (!recipients || recipients.length === 0) {
            return res.json({ 
                success: false, 
                message: 'No hay destinatarios' 
            });
        }

        // CONFIGURACIÓN SMTP REAL
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

        // Verificar SMTP
        await transporter.verify();
        console.log('✅ SMTP conectado');

        const results = {
            successCount: 0,
            errorCount: 0,
            details: []
        };

        // ENVIAR CORREOS REALES
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            try {
                const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name || '');
                const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name || '');

                const mailOptions = {
                    from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
                    to: recipient.email,
                    subject: personalizedSubject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: #2c5aa0; padding: 20px; color: white;">
                                <h1>${personalizedSubject}</h1>
                            </div>
                            <div style="padding: 20px; background: #f8f9fa;">
                                <div style="background: white; padding: 20px; border-radius: 5px;">
                                    ${personalizedMessage.replace(/\n/g, '<br>')}
                                    ${imageUrl ? `<img src="${imageUrl}" style="max-width: 100%; margin-top: 20px;">` : ''}
                                </div>
                                <p style="text-align: center; color: #666; margin-top: 20px;">
                                    <strong>${INSTITUTION_NAME}</strong><br>
                                    ${new Date().toLocaleString('es-MX')}
                                </p>
                            </div>
                        </div>
                    `,
                    text: personalizedMessage
                };

                console.log(`📤 Enviando a: ${recipient.email}`);
                const info = await transporter.sendMail(mailOptions);
                
                results.successCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'enviado'
                });

                console.log('✅ Correo enviado');

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

            // Pausa de 1 segundo entre correos
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`📊 Resumen: ${results.successCount} exitosos, ${results.errorCount} errores`);

        res.json({
            success: true,
            message: `✅ ${results.successCount} correos enviados exitosamente`,
            details: results.details,
            successCount: results.successCount,
            errorCount: results.errorCount,
            realDelivery: true
        });
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
        res.json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// Ruta para subir imagen
app.post('/upload-image', (req, res) => {
    console.log('📸 Imagen solicitada');
    res.json({
        success: true,
        imageUrl: 'https://via.placeholder.com/600x300/2c5aa0/ffffff?text=NEUUNI'
    });
});

// Ruta de prueba
app.post('/send-test-email', async (req, res) => {
    console.log('🧪 SOLICITUD DE PRUEBA');
    
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
            message: '✅ Correo de prueba enviado - Revisa tu bandeja',
            realDelivery: true
        });

    } catch (error) {
        console.log('❌ Error en prueba:', error.message);
        res.json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

// Ruta de estado
app.get('/status', (req, res) => {
    res.json({ 
        status: 'online', 
        institution: INSTITUTION_NAME,
        message: 'Servidor funcionando correctamente' 
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor ${INSTITUTION_NAME} ejecutándose en http://localhost:${PORT}`);
    console.log('✅ Listo para enviar correos REALES');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
});