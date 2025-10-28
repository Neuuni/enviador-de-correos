require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ CONFIGURACIÓN CORRECTA PARA UNINEUUNI (Google Workspace)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // de.escobedo@unineuuni.edu.mx
      pass: process.env.EMAIL_PASS  // CONTRASEÑA DE APLICACIÓN
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verificación al iniciar
console.log('\n=== SISTEMA UNINEUUNI - CORREOS REALES ===');
const transporter = createTransporter();
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error de configuración:', error.message);
  } else {
    console.log('✅ CONFIGURACIÓN EXITOSA - CORREOS REALES ACTIVADOS');
    console.log('   📧 Remitente:', process.env.EMAIL_USER);
    console.log('   🌐 Servidor: smtp.gmail.com:587');
    console.log('   🚀 Los correos se enviarán REALMENTE\n');
  }
});

// ✅ RUTA PARA ENVÍO MASIVO REAL
app.post('/send-bulk-emails', async (req, res) => {
  console.log('\n📦 SOLICITUD DE ENVÍO MASIVO REAL');
  
  try {
    const { recipients, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay destinatarios válidos'
      });
    }

    console.log(`📧 Destinatarios: ${recipients.length}`);
    console.log(`📝 Asunto: ${subject}`);

    const results = {
      successCount: 0,
      errorCount: 0,
      details: []
    };

    const currentTransporter = createTransporter();

    // Verificar conexión primero
    try {
      await currentTransporter.verify();
      console.log('✅ Servidor UNINEUUNI verificado - Enviando correos REALES');
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error de conexión: ' + error.message
      });
    }

    console.log('🔄 Iniciando envío de correos REALES...');

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      if (!recipient.email || !recipient.name) {
        results.errorCount++;
        continue;
      }

      try {
        const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name);
        const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name);

        const mailOptions = {
          from: `"Universidad UNINEUUNI" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject: personalizedSubject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <div style="background: #2c5aa0; padding: 20px; border-radius: 10px 10px 0 0; color: white;">
                <h1 style="margin: 0; font-size: 24px;">${personalizedSubject}</h1>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #2c5aa0;">
                  ${personalizedMessage.replace(/\n/g, '<br>')}
                </div>
                <p style="color: #666; margin-top: 20px; text-align: center;">
                  <small>Universidad UNINEUUNI</small><br>
                  <small>${new Date().toLocaleString('es-MX')}</small>
                </p>
              </div>
            </div>
          `,
          text: personalizedMessage
        };

        console.log(`📤 [${i + 1}/${recipients.length}] ENVIANDO REAL a: ${recipient.email}`);
        
        // ✅ ENVÍO REAL
        const info = await currentTransporter.sendMail(mailOptions);
        
        results.successCount++;
        results.details.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
          messageId: info.messageId,
          response: info.response
        });

        console.log(`   ✅ ENVIADO REALMENTE: ${info.response}`);

      } catch (error) {
        console.log(`   ❌ ERROR REAL: ${error.message}`);
        results.errorCount++;
        results.details.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: error.message
        });
      }

      // Pausa entre correos
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('📊 RESULTADO FINAL REAL:');
    console.log(`   ✅ Correos REALMENTE enviados: ${results.successCount}`);
    console.log(`   ❌ Errores: ${results.errorCount}`);

    res.json({
      success: true,
      message: `✅ ${results.successCount} correos enviados REALMENTE desde UNINEUUNI`,
      results: results,
      realDelivery: true
    });

  } catch (error) {
    console.log('❌ ERROR CRÍTICO:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor: ' + error.message
    });
  }
});

// ✅ RUTA DE PRUEBA MEJORADA
app.post('/send-test-email', async (req, res) => {
  console.log('\n🧪 PRUEBA REAL UNINEUUNI');
  
  try {
    const { to, subject, message } = req.body;
    const testEmail = to || process.env.EMAIL_USER;

    const currentTransporter = createTransporter();
    await currentTransporter.verify();

    const mailOptions = {
      from: `"Sistema UNINEUUNI" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: subject || '✅ CORREO REAL UNINEUUNI - ' + new Date().toLocaleTimeString(),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #27ae60;">✅ CORREO REAL ENVIADO</h1>
          <p>Este correo fue enviado <strong>REALMENTE</strong> desde el servidor UNINEUUNI.</p>
          <p><strong>Remitente:</strong> ${process.env.EMAIL_USER}</p>
          <p><strong>Destinatario:</strong> ${testEmail}</p>
          <p><strong>Hora:</strong> ${new Date().toLocaleString('es-MX')}</p>
          <hr>
          <p>${message || 'Mensaje de prueba del sistema de envíos masivos.'}</p>
        </div>
      `,
      text: message || 'Correo de prueba REAL desde UNINEUUNI'
    };

    console.log('📤 Enviando prueba REAL desde UNINEUUNI...');
    const info = await currentTransporter.sendMail(mailOptions);
    
    console.log('🎉 PRUEBA REAL EXITOSA:');
    console.log('   ID:', info.messageId);
    console.log('   Respuesta:', info.response);

    res.json({
      success: true,
      message: '✅ Correo REAL enviado desde UNINEUUNI - Revisa tu bandeja',
      messageId: info.messageId,
      realDelivery: true
    });

  } catch (error) {
    console.log('❌ PRUEBA FALLIDA:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Error: ' + error.message,
      realDelivery: false
    });
  }
});

// Otras rutas (mantener igual)
app.post('/upload-contacts', (req, res) => {
  // ... (código anterior)
});

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    emailConfigured: !!process.env.EMAIL_USER,
    emailUser: process.env.EMAIL_USER,
    realEmails: true
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor UNINEUUNI ejecutándose en http://localhost:${PORT}`);
  console.log('📍 Los correos se enviarán REALMENTE');
  console.log('⚠️  Revisa la carpeta de SPAM si no ves los correos');
});