require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 INICIANDO DIAGNÓSTICO...\n');

// Verificar variables de entorno
console.log('1. 📧 Variables de entorno:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER);
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NO CONFIGURADO');
console.log('   Longitud PASS:', process.env.EMAIL_PASS?.length || 0, 'caracteres\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test de conexión
console.log('2. 🔌 Probando conexión con Gmail...');
transporter.verify(function(error, success) {
  if (error) {
    console.log('   ❌ FALLA EN CONEXIÓN:');
    console.log('   Mensaje:', error.message);
    console.log('   Código:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 SOLUCIÓN INMEDIATA:');
      console.log('   1. Ve a: https://myaccount.google.com/');
      console.log('   2. Activa "Verificación en 2 pasos"');
      console.log('   3. Ve a "Contraseñas de aplicaciones"');
      console.log('   4. Genera contraseña para "Correo"');
      console.log('   5. Usa los 16 caracteres en .env\n');
    }
  } else {
    console.log('   ✅ Conexión exitosa con Gmail\n');
    
    // Enviar correo de prueba
    console.log('3. 📤 Enviando correo de prueba...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Enviarse a sí mismo
      subject: 'PRUEBA - ' + new Date().toLocaleString(),
      text: 'Si recibes esto, el envío funciona correctamente.'
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('   ❌ Error enviando:', error.message);
      } else {
        console.log('   ✅ Correo de prueba APARENTEMENTE enviado');
        console.log('   ID:', info.messageId);
        console.log('   Respuesta:', info.response);
        console.log('\n⚠️  IMPORTANTE:');
        console.log('   - Revisa tu bandeja de entrada en 2-5 minutos');
        console.log('   - Revisa la carpeta de SPAM');
        console.log('   - Si no llega, el problema es de autenticación con Gmail\n');
      }
    });
  }
});