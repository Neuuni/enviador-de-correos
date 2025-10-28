require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🎯 DIAGNÓSTICO ESPECÍFICO UNINEUUNI\n');
console.log('📧 Email:', process.env.EMAIL_USER);

// Configuraciones MÁS probables para universidades mexicanas
const configs = [
  {
    name: 'UNINEUUNI - Google Workspace',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  {
    name: 'UNINEUUNI - Office365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  {
    name: 'UNINEUUNI - Servidor Propio',
    host: 'mail.unineuuni.edu.mx',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  {
    name: 'UNINEUUNI - Alternativo',
    host: 'smtp.unineuuni.edu.mx',
    port: 587,
    secure: false,
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
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000
    });

    await transporter.verify();
    console.log('   ✅ Conexión exitosa');
    
    // Enviar correo REAL
    const mailOptions = {
      from: `"Diagnóstico UNINEUUNI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `✅ ${config.name} FUNCIONA - ${new Date().toLocaleTimeString()}`,
      html: `<h1>¡CONFIGURACIÓN ENCONTRADA!</h1><p>${config.name} funciona correctamente.</p>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('   🎉 CORREO ENVIADO REALMENTE');
    console.log('      ID:', info.messageId);
    
    return { success: true, config: config };
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return { success: false, config: config };
  }
}

async function runTests() {
  console.log('🚀 Probando configuraciones...\n');
  
  for (const config of configs) {
    const result = await testConfig(config);
    if (result.success) {
      console.log('\n🎉 CONFIGURACIÓN EXITOSA ENCONTRADA!');
      console.log('Copia esto en tu server.js:');
      console.log(`
const transporter = nodemailer.createTransport({
  host: '${result.config.host}',
  port: ${result.config.port},
  secure: ${result.config.secure},
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
      `);
      return;
    }
  }
  
  console.log('\n❌ NINGUNA configuración funcionó automáticamente');
  console.log('\n📞 Contacta al soporte de UNINEUUNI y pregunta:');
  console.log('   "¿Cuál es el servidor SMTP para enviar correos desde aplicaciones?"');
}


runTests();