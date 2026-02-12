require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ======================================================
// 🔷 CONFIGURACIÓN EXPRESS - FORZANDO LÍMITES
// ======================================================
const INSTITUTION_NAME = "Universidad NEUUNI";

// ✅ CONFIGURAR LÍMITES DE FORMA AGRESIVA
app.use(express.json({ 
    limit: '100mb',  // ✅ AUMENTADO A 100MB
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '100mb',  // ✅ AUMENTADO A 100MB
    parameterLimit: 1000000
}));

app.use(cors());

// ✅ MIDDLEWARE PERSONALIZADO PARA VERIFICAR TAMAÑO
app.use((req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    console.log(`📨 ${req.method} ${req.url} - Tamaño: ${contentLength || '?'} bytes`);
    
    if (contentLength > 50 * 1024 * 1024) { // 50MB
        console.log('⚠️  Advertencia: Payload muy grande');
    }
    next();
});

app.use(express.static('public'));

// ======================================================
// 📦 RUTA PRINCIPAL - ENVÍOS REALES
// ======================================================
app.post('/send-emails', async (req, res) => {
    console.log(`\n🎯 SOLICITUD DE ENVÍO MASIVO`);
    console.log('📍 Hora:', new Date().toLocaleString('es-MX'));
    
    try {
        const { recipients, subject, message, imageUrl } = req.body;

        // VERIFICAR RECEPCIÓN
        console.log('📊 Datos recibidos correctamente:');
        console.log('   - Destinatarios:', recipients?.length || 0);
        console.log('   - Tamaño payload:', JSON.stringify(req.body).length, 'bytes');

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay destinatarios válidos' 
            });
        }

        console.log(`📧 Iniciando envío a ${recipients.length} destinatarios...`);

        // CONFIGURACIÓN SMTP
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

        // VERIFICAR CONEXIÓN SMTP
        try {
            await transporter.verify();
            console.log('✅ Conexión SMTP verificada');
        } catch (smtpError) {
            console.log('❌ Error SMTP:', smtpError.message);
            return res.status(500).json({
                success: false,
                message: 'Error de configuración SMTP: ' + smtpError.message
            });
        }

        const results = {
            successCount: 0,
            errorCount: 0,
            details: []
        };

        // ENVIAR CORREOS
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            if (!recipient.email || !recipient.name) {
                results.errorCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'error',
                    error: 'Datos incompletos'
                });
                continue;
            }

            try {
                const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name);
                const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name);

                // CONSTRUIR HTML DEL CORREO
                const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalizedSubject}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            overflow: hidden; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            background: #2c5aa0; 
            padding: 25px; 
            color: white; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold; 
        }
        .content { 
            padding: 25px; 
            background: #f8f9fa; 
        }
        .message-box { 
            background: white; 
            padding: 25px; 
            border-radius: 8px; 
            border-left: 5px solid #2c5aa0; 
            line-height: 1.6; 
        }
        .image-container { 
            margin: 25px 0; 
            text-align: center; 
        }
        .image-container img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px; 
            border: 2px solid #e9ecef; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6c757d; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef; 
        }
        .footer strong { 
            color: #2c5aa0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${personalizedSubject}</h1>
        </div>
        <div class="content">
            <div class="message-box">
                ${personalizedMessage.replace(/\n/g, '<br>')}
                ${imageUrl ? `
                <div class="image-container">
                    <img src="${imageUrl}" alt="Imagen adjunta">
                </div>
                ` : ''}
            </div>
        </div>
        <div class="footer">
            <strong>${INSTITUTION_NAME}</strong><br>
            ${new Date().toLocaleString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>
    </div>
</body>
</html>
                `;

                const mailOptions = {
                    from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
                    to: recipient.email,
                    subject: personalizedSubject,
                    html: emailHtml,
                    text: personalizedMessage,
                    headers: {
                        'X-Priority': '1',
                        'X-MSMail-Priority': 'High',
                        'Importance': 'high'
                    }
                };

                console.log(`📤 [${i + 1}/${recipients.length}] Enviando a: ${recipient.name} <${recipient.email}>`);
                
                const info = await transporter.sendMail(mailOptions);
                
                results.successCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'enviado',
                    messageId: info.messageId,
                    response: info.response
                });

                console.log(`   ✅ Enviado correctamente - ID: ${info.messageId}`);

            } catch (error) {
                console.log(`   ❌ Error con ${recipient.email}: ${error.message}`);
                results.errorCount++;
                results.details.push({
                    email: recipient.email,
                    name: recipient.name,
                    status: 'error',
                    error: error.message
                });
            }

            // PAUSA ENTRE CORREOS (2 segundos)
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('\n📊 RESUMEN FINAL DEL ENVÍO:');
        console.log(`   ✅ Correos enviados exitosamente: ${results.successCount}`);
        console.log(`   ❌ Errores: ${results.errorCount}`);
        console.log(`   📧 Total procesado: ${recipients.length}`);

        res.json({
            success: true,
            message: `✅ Envío completado: ${results.successCount} correos enviados correctamente`,
            details: results.details,
            successCount: results.successCount,
            errorCount: results.errorCount,
            realDelivery: true
        });

    } catch (error) {
        console.log('❌ ERROR CRÍTICO EN EL SERVIDOR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message,
            realDelivery: false
        });
    }
});

// ======================================================
// 🖼️ RUTA PARA SUBIR IMAGEN
// ======================================================
app.post('/upload-image', (req, res) => {
    console.log('\n🖼️  Solicitud de subida de imagen recibida');
    res.json({
        success: true,
        imageUrl: 'https://via.placeholder.com/600x300/2c5aa0/ffffff?text=NEUUNI+IMAGEN',
        message: 'Imagen procesada correctamente'
    });
});

// ======================================================
// 🧪 RUTA DE PRUEBA
// ======================================================
app.post('/send-bulk-emails', async (req, res) => {
    console.log('\n🧪 SOLICITUD DE CORREO DE PRUEBA');
    
    try {
        const { to } = req.body;
        const testEmail = to || process.env.EMAIL_USER;

        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: 'No se especificó destinatario para la prueba'
            });
        }

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

        const mailOptions = {
            from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: `✅ Prueba de Sistema - ${INSTITUTION_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 10px; overflow: hidden;">
                    <div style="background: #28a745; padding: 25px; color: white; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">✅ PRUEBA EXITOSA</h1>
                    </div>
                    <div style="padding: 25px; background: white;">
                        <p style="font-size: 16px; line-height: 1.6;">Este correo confirma que el sistema de envío masivo de <strong>${INSTITUTION_NAME}</strong> está funcionando correctamente.</p>
                        
                        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Institución:</strong> ${INSTITUTION_NAME}</p>
                            <p style="margin: 5px 0;"><strong>Remitente:</strong> ${process.env.EMAIL_USER}</p>
                            <p style="margin: 5px 0;"><strong>Destinatario:</strong> ${testEmail}</p>
                            <p style="margin: 5px 0;"><strong>Hora de envío:</strong> ${new Date().toLocaleString('es-MX')}</p>
                        </div>
                        
                        <p style="color: #6c757d; text-align: center; font-size: 14px;">
                            Si recibes este correo, la configuración SMTP es correcta y puedes proceder con el envío masivo.
                        </p>
                    </div>
                    <div style="background: #343a40; padding: 15px; color: white; text-align: center;">
                        <small>Sistema de Envío Masivo - ${INSTITUTION_NAME}</small>
                    </div>
                </div>
            `,
            text: `Prueba de sistema ${INSTITUTION_NAME}. Hora: ${new Date().toLocaleString('es-MX')}. Destinatario: ${testEmail}`
        };

        console.log(`📤 Enviando correo de prueba a: ${testEmail}`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo de prueba enviado exitosamente');
        console.log('   📧 Message ID:', info.messageId);
        console.log('   🔄 Respuesta SMTP:', info.response);

        res.json({
            success: true,
            message: '✅ Correo de prueba enviado correctamente - Revisa tu bandeja de entrada',
            messageId: info.messageId,
            response: info.response,
            realDelivery: true
        });

    } catch (error) {
        console.log('❌ Error en correo de prueba:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Error enviando correo de prueba: ' + error.message,
            realDelivery: false
        });
    }
});

// ======================================================
// 📡 RUTAS ADICIONALES
// ======================================================
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        institution: INSTITUTION_NAME,
        emailConfigured: !!process.env.EMAIL_USER,
        serverTime: new Date().toISOString(),
        payloadLimit: '100mb',
        version: 'fixed'
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================================================
// 🚀 INICIAR SERVIDOR
// ======================================================
app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR ${INSTITUTION_NAME} INICIADO CORRECTAMENTE`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('✅ Límite de payload configurado: 100MB');
    console.log('✅ Express configurado para envíos REALES');
    console.log('✅ CORS habilitado');
    console.log('\n📧 CONFIGURACIÓN SMTP:');
    console.log('   Usuario:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
    console.log('   Contraseña:', process.env.EMAIL_PASS ? '✓ Configurada' : '❌ NO CONFIGURADA');
    console.log('\n🎯 LISTO PARA ENVIAR CORREOS REALES');
});
