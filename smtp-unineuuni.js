require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 BUSCANDO SERVIDOR SMTP DE UNINEUUNI\n');
console.log('📧 Email:', process.env.EMAIL_USER);
console.log('🔑 Contraseña:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'No configurada\n');

// Configuraciones para instituciones educativas mexicanas
const configs = [
  // Configuraciones específicas para UNINEUUNI
  { name: 'UNINEUUNI - Mail Principal', host: 'mail.unineuuni.edu.mx', port: 587, secure: false },
  { name: 'UNINEUUNI - Mail SSL', host: 'mail.unineuuni.edu.mx', port: 465, secure: true },
  { name: 'UNINEUUNI - SMTP', host: 'smtp.unineuuni.edu.mx', port: 587, secure: false },
  { name: 'UNINEUUNI - SMTP SSL', host: 'smtp.unineuuni.edu.mx', port: 465, secure: true },
  
  // Configuraciones genéricas para universidades
  { name: 'Genérico - Correo', host: 'correo.unineuuni.edu.mx', port: 587, secure: false },
  { name: 'Genérico - Webmail', host: 'webmail.unineuuni.edu.mx', port: 587, secure: false },
  { name: 'Genérico - Mail2', host: 'mail2.unineuuni.edu.mx', port: 587, secure: false },
  
  // Servidores comunes en México
  { name: 'MX - cPanel', host: 'unineuuni.edu.mx', port: 587, secure: false },
  { name: 'MX - cPanel SSL', host: 'unineuuni.edu.mx', port: 465, secure: true },
  { name: 'MX - DirectAdmin', host: 'email.unineuuni.edu.mx', port: 587, secure: false },
  
  // Proveedores de hosting comunes
  { name: 'Hosting - Plesk', host: 'smtp.unineuuni.edu.mx', port: 25, secure: false },
  { name: 'Hosting - CPanel', host: 'unineuuni.edu.mx', port: 26, secure: false }
];

async function testConfig(config) {
  console.log(`\n🔧 Probando: ${config.name}`);
  console.log(`   Servidor: ${config.host}:${config.port} (SSL: ${config.secure})`);
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  try {
    await transporter.verify();
    console.log('   ✅ CONEXIÓN EXITOSA al servidor UNINEUUNI');
    
    // Enviar correo de prueba
    const mailOptions = {
      from: `"Prueba SMTP" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `✅ SMTP FUNCIONA - ${config.name}`,
      text: `¡Funciona! Configuración: ${config.host}:${config.port}`,
      html: `<h1>¡SMTP ENCONTRADO!</h1><p>Configuración: ${config.name}</p>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('   🎉 CORREO ENVIADO REALMENTE');
    console.log('      ID:', info.messageId);
    
    return { success: true, config: config };
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Servidor no responde');
    } else if (error.code === 'EAUTH') {
      console.log('   ❌ Error de autenticación');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ❌ Timeout - Servidor no encontrado');
    } else {
      console.log('   ❌ Error:', error.message);
    }
    return { success: false, config: config };
  }
}

async function runTests() {
  console.log('🚀 Iniciando búsqueda del servidor SMTP...\n');
  
  let workingConfigs = [];
  
  for (const config of configs) {
    const result = await testConfig(config);
    if (result.success) {
      workingConfigs.push(result.config);
    }
  }
  
  if (workingConfigs.length > 0) {
    console.log('\n🎉 CONFIGURACIONES QUE FUNCIONAN:');
    workingConfigs.forEach((config, index) => {
      console.log(`\n${index + 1}. ${config.name}`);
      console.log(`   host: '${config.host}',`);
      console.log(`   port: ${config.port},`);
      console.log(`   secure: ${config.secure}`);
    });
  } else {
    console.log('\n❌ NINGÚN SERVIDOR FUNCIONÓ');
    console.log('\n💡 SOLUCIONES:');
    console.log('   1. Contacta al departamento de TI de UNINEUUNI');
    console.log('   2. Pregunta: "¿Cuál es el servidor SMTP para enviar correos?"');
    console.log('   3. Revisa la configuración en tu Outlook/Thunderbird');
    console.log('   4. Verifica que tu contraseña sea correcta');
  }
}

runTests();