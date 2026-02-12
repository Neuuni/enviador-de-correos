require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const INSTITUTION_NAME = "Universidad NEUUNI";

// ======================================================
// 🔍 VERIFICACIÓN DETALLADA DE CREDENCIALES
// ======================================================
console.log('\n' + '='.repeat(50));
console.log('🔍 VERIFICANDO CONFIGURACIÓN SMTP');
console.log('='.repeat(50));

// Cargar variables manualmente para debug
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ Archivo .env encontrado');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Contenido de .env:');
        console.log(envContent);
    } else {
        console.log('❌ Archivo .env NO encontrado');
    }
} catch (error) {
    console.log('⚠️  Error leyendo .env:', error.message);
}

console.log('\n📧 VARIABLES DE ENTORNO:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NO DEFINIDO');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ DEFINIDA (longitud: ' + process.env.EMAIL_PASS.length + ')' : '❌ NO DEFINIDA');

// Verificar formato del email
if (process.env.EMAIL_USER) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.EMAIL_USER)) {
        console.log('⚠️  ADVERTENCIA: EMAIL_USER no tiene formato válido de email');
    }
}

// Configuración Express
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// ======================================================
// 🧪 RUTA DE PRUEBA CON DIAGNÓSTICO COMPLETO
// ======================================================
app.post('/send-test-email', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 INICIANDO PRUEBA DE DIAGNÓSTICO');
    console.log('='.repeat(50));
    
    try {
        const { to } = req.body;
        const testEmail = to || process.env.EMAIL_USER;
        
        console.log('\n📊 DATOS DE PRUEBA:');
        console.log('   - Email de prueba:', testEmail);
        console.log('   - EMAIL_USER:', process.env.EMAIL_USER);
        console.log('   - EMAIL_PASS:', process.env.EMAIL_PASS ? 'DEFINIDA' : 'NO DEFINIDA');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            const errorMsg = '❌ ERROR: Credenciales incompletas en .env';
            console.log(errorMsg);
            return res.json({
                success: false,
                message: errorMsg + '\nVerifica que tu archivo .env tenga:\nEMAIL_USER=tu_correo@neuuni.edu.mx\nEMAIL_PASS=contraseña_de_aplicación'
            });
        }
        
        // CONFIGURACIÓN DETALLADA SMTP
        console.log('\n🔧 CONFIGURANDO SMTP:');
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
        
        console.log('   - Host:', smtpConfig.host);
        console.log('   - Port:', smtpConfig.port);
        console.log('   - Secure:', smtpConfig.secure);
        console.log('   - User:', smtpConfig.auth.user);
        
        const transporter = nodemailer.createTransport(smtpConfig);
        
        // PRUEBA DE CONEXIÓN
        console.log('\n🔌 VERIFICANDO CONEXIÓN SMTP...');
        try {
            await transporter.verify();
            console.log('✅ CONEXIÓN SMTP EXITOSA');
        } catch (verifyError) {
            console.log('❌ ERROR EN VERIFICACIÓN SMTP:', verifyError.message);
            
            let diagnosticMessage = '❌ ERROR SMTP: ' + verifyError.message + '\n\n';
            
            if (verifyError.message.includes('535-5.7.8') || verifyError.message.includes('BadCredentials')) {
                diagnosticMessage += 'PROBLEMA: Credenciales incorrectas\n';
                diagnosticMessage += 'SOLUCIÓN:\n';
                diagnosticMessage += '1. Ve a: https://myaccount.google.com/apppasswords\n';
                diagnosticMessage += '2. Genera una nueva "Contraseña de aplicación"\n';
                diagnosticMessage += '3. Selecciona "Correo" y "Windows"\n';
                diagnosticMessage += '4. Copia la contraseña de 16 caracteres\n';
                diagnosticMessage += '5. Actualiza tu archivo .env con:\n';
                diagnosticMessage += '   EMAIL_PASS=la_nueva_contraseña\n\n';
                diagnosticMessage += '⚠️  NOTA: NO uses tu contraseña normal de Gmail';
            } else if (verifyError.message.includes('Invalid login')) {
                diagnosticMessage += 'PROBLEMA: Usuario o contraseña inválidos\n';
                diagnosticMessage += 'Verifica que:\n';
                diagnosticMessage += '1. El email sea correcto: ' + process.env.EMAIL_USER + '\n';
                diagnosticMessage += '2. La contraseña sea la de APLICACIÓN (no la normal)\n';
            }
            
            return res.json({
                success: false,
                message: diagnosticMessage
            });
        }
        
        // ENVÍO DE CORREO DE PRUEBA
        console.log('\n📤 ENVIANDO CORREO DE PRUEBA...');
        
        const mailOptions = {
            from: `"${INSTITUTION_NAME}" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: `✅ PRUEBA ${INSTITUTION_NAME} - ${new Date().toLocaleTimeString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #28a745; border-radius: 10px;">
                    <h1 style="color: #28a745; text-align: center;">✅ PRUEBA EXITOSA</h1>
                    <p>Este correo confirma que la configuración SMTP de <strong>${INSTITUTION_NAME}</strong> es correcta.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Institución:</strong> ${INSTITUTION_NAME}</p>
                        <p><strong>Remitente:</strong> ${process.env.EMAIL_USER}</p>
                        <p><strong>Destinatario:</strong> ${testEmail}</p>
                        <p><strong>Hora de envío:</strong> ${new Date().toLocaleString('es-MX')}</p>
                    </div>
                    <p style="color: #666; text-align: center; font-size: 14px;">
                        Si recibes este correo, el sistema de envío masivo está listo para usar.
                    </p>
                </div>
            `,
            text: `Prueba de ${INSTITUTION_NAME} - ${new Date().toLocaleString('es-MX')}`
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ CORREO ENVIADO EXITOSAMENTE');
        console.log('   - Message ID:', info.messageId);
        console.log('   - Respuesta:', info.response);
        
        res.json({
            success: true,
            message: '🎉 ¡PRUEBA EXITOSA! Correo enviado correctamente - Revisa tu bandeja de entrada',
            diagnostic: 'SMTP configurado correctamente',
            realDelivery: true
        });
        
    } catch (error) {
        console.log('❌ ERROR NO CONTROLADO:', error);
        res.json({
            success: false,
            message: 'Error inesperado: ' + error.message
        });
    }
});

// ======================================================
// 📦 RUTA PRINCIPAL (solo si la prueba funciona)
// ======================================================
app.post('/send-bulk-emails', (req, res) => {
    console.log('\n⚠️  RUTA BLOQUEADA - Primero pasa la prueba de diagnóstico');
    res.json({
        success: false,
        message: '❌ Primero debes pasar la prueba de diagnóstico. Usa el botón "Enviar Correo de Prueba".'
    });
});

// ======================================================
// 📡 RUTAS BÁSICAS
// ======================================================
app.get('/status', (req, res) => {
    res.json({
        status: 'diagnostic_mode',
        institution: INSTITUTION_NAME,
        message: 'Modo diagnóstico activado',
        instructions: 'Usa /send-test-email para probar las credenciales SMTP'
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================================================
// 🚀 INICIAR SERVIDOR
// ======================================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVIDOR DE DIAGNÓSTICO INICIADO');
    console.log('📍 URL: http://localhost:' + PORT);
    console.log('='.repeat(50));
    console.log('\n🎯 INSTRUCCIONES:');
    console.log('1. Usa el botón "Enviar Correo de Prueba" en la interfaz');
    console.log('2. Si hay errores, te daremos instrucciones específicas');
    console.log('3. Solo cuando la prueba funcione, podrás enviar correos masivos');
    console.log('\n⚠️  El envío masivo está BLOQUEADO hasta pasar la prueba');
});