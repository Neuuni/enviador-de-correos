require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta SIMPLE de prueba
app.post('/test-smtp', async (req, res) => {
    console.log('\n🔍 PRUEBA SMTP SOLICITADA');
    
    try {
        console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
        console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'CONFIGURADA' : 'NO CONFIGURADA');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({
                success: false,
                message: '❌ ERROR: Falta configurar .env\n\nCrea un archivo .env con:\nEMAIL_USER=tu_correo@neuuni.edu.mx\nEMAIL_PASS=contraseña_de_aplicación'
            });
        }
        
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
        console.log('✅ SMTP VERIFICADO');
        
        // Intentar enviar correo
        const info = await transporter.sendMail({
            from: `"Prueba" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: '✅ Prueba SMTP Exitosa',
            text: '¡Funciona! ' + new Date().toLocaleString()
        });
        
        console.log('✅ CORREO ENVIADO:', info.messageId);
        
        res.json({
            success: true,
            message: '🎉 ¡PRUEBA EXITOSA! Revisa tu bandeja de entrada.',
            details: 'Correo enviado a: ' + process.env.EMAIL_USER
        });
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        let mensaje = 'Error: ' + error.message;
        
        if (error.message.includes('535') || error.message.includes('BadCredentials')) {
            mensaje = '❌ CREDENCIALES INCORRECTAS\n\n' +
                     'Solución:\n' +
                     '1. Ve a: https://myaccount.google.com/apppasswords\n' +
                     '2. Genera CONTRASEÑA DE APLICACIÓN\n' +
                     '3. Copia los 16 caracteres\n' +
                     '4. Pégala en .env como EMAIL_PASS\n\n' +
                     '⚠️ NO uses tu contraseña normal de Gmail';
        }
        
        res.json({
            success: false,
            message: mensaje
        });
    }
});

// Ruta para ver estado
app.get('/check', (req, res) => {
    const tieneUser = !!process.env.EMAIL_USER;
    const tienePass = !!process.env.EMAIL_PASS;
    
    res.json({
        email_user: tieneUser ? 'CONFIGURADO' : 'FALTANTE',
        email_pass: tienePass ? 'CONFIGURADA' : 'FALTANTE',
        instrucciones: 'Envía POST a /test-smtp para probar'
    });
});

app.listen(PORT, () => {
    console.log(`\n🔍 Servidor de prueba en http://localhost:${PORT}`);
    console.log('📍 Para probar:');
    console.log('   1. Ve a http://localhost:3001/check');
    console.log('   2. O envía POST a http://localhost:3001/test-smtp');
});