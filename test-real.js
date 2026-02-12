require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🎯 DIAGNÓSTICO REAL DE ENVÍO\n');

// 1. Verificar configuración
console.log('1. CONFIGURACIÓN ACTUAL:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER);
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NO HAY');
console.log('   Dominio:', process.env.EMAIL_USER ? process.env.EMAIL_USER.split('@')[1] : 'N/A');

// 2. Probar diferentes configuraciones SMTP
const configs = [
  {
    name: 'Gmail Standard',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  {
    name: 'Office365',
    host: 'smtp.office365.com', 
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  {
    name: 'Gmail SSL',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }
];

async function testConfig(config) {
  console.log(`\n🔧 Probando: ${config.name}`);
  console.log(`   Servidor: ${config.host}:${config.port}`);
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    // Verificar conexión
    await transporter.verify();
    console.log('   ✅ Conexión exitosa');
    
    // Intentar enviar correo real
    const mailOptions = {
      from: `"Prueba Real" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviarse a sí mismo
      subject: `PRUEBA REAL - ${config.name} - ${new Date().toLocaleTimeString()}`,
      text: `Esta es una prueba REAL del sistema. Config: ${config.name}`,
      html: `<h1>Prueba REAL Exitosa</h1><p>Configuración: ${config.name}</p>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('   ✅ CORREO ENVIADO REALMENTE');
    console.log('      ID:', info.messageId);
    console.log('      Respuesta:', info.response);
    console.log('   📩 Revisa tu bandeja de entrada y SPAM ahora!');
    
    return true;
  } catch (error) {
    console.log('   ❌ Falla:', error.message);
    return false;
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('\n2. INICIANDO PRUEBAS DE ENVÍO REAL...');
  
  for (const config of configs) {
    const success = await testConfig(config);
    if (success) {
      console.log('\n🎉 CONFIGURACIÓN EXITOSA ENCONTRADA!');
      console.log('   Usa esta configuración en tu server.js');
      break;
    }
  }
  
  console.log('\n💡 SI NINGUNA FUNCIONA:');
  console.log('   - Verifica que tu email y contraseña sean correctos');
  console.log('   - Si usas Gmail: activa verificación 2 pasos y usa contraseña de aplicación');
  console.log('   - Si usas Office365: usa tu contraseña normal');
}

runTests();