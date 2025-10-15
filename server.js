const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// CONFIGURACIÓN GMAIL
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

console.log('🔧 CONFIGURACIÓN SMTP:');
console.log('Usuario:', process.env.EMAIL_USER);
console.log('Contraseña configurada:', process.env.EMAIL_PASS ? 'Sí' : 'No');

// Función para procesar archivos
function processTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const recipients = [];

    lines.forEach((line) => {
      const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase().trim();
        let name = 'Destinatario';
        
        const namePart = line.replace(email, '').replace(/,/g, '').trim();
        if (namePart) {
          name = namePart;
        }
        
        recipients.push({ name: name, email: email });
      }
    });

    return recipients;
  } catch (error) {
    throw new Error('Error al procesar el archivo: ' + error.message);
  }
}

// Ruta para procesar archivos
app.post('/upload-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: 'No se subió archivo' });
    }

    const recipients = processTextFile(req.file.path);
    
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (recipients.length === 0) {
      return res.json({ success: false, message: 'No se encontraron emails válidos' });
    }
    
    res.json({
      success: true,
      message: `${recipients.length} destinatarios procesados`,
      recipients: recipients
    });
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.json({ success: false, message: error.message });
  }
});

// Ruta de ENVÍO REAL con verificación
app.post('/send-emails', async (req, res) => {
  console.log('\n🎯 INICIANDO ENVÍO REAL...');
  
  try {
    const { subject, sender, message, recipients } = req.body;
    
    console.log('📊 DATOS RECIBIDOS:');
    console.log('- Asunto:', subject);
    console.log('- Mensaje:', message.substring(0, 50) + '...');
    console.log('- Número de destinatarios:', recipients.length);
    console.log('- Destinatarios:', recipients.map(r => r.email));

    if (!recipients || recipients.length === 0) {
      return res.json({ success: false, message: 'No hay destinatarios' });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // VERIFICAR CONEXIÓN SMTP PRIMERO
    try {
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada');
    } catch (error) {
      console.log('❌ Error SMTP:', error.message);
      return res.json({ success: false, message: 'Error SMTP: ' + error.message });
    }

    // ENVIAR A CADA DESTINATARIO
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      console.log(`\n📧 [${i + 1}/${recipients.length}] Procesando: ${recipient.email}`);
      
      try {
        const personalizedSubject = subject.replace(/\[NOMBRE\]/g, recipient.name);
        const personalizedMessage = message.replace(/\[NOMBRE\]/g, recipient.name);
        
        const mailOptions = {
          from: `"Sistema de Correos" <${process.env.EMAIL_USER}>`,
          to: recipient.email, // ← IMPORTANTE: Enviar al destinatario
          subject: personalizedSubject,
          text: personalizedMessage,
          html: `<div>${personalizedMessage.replace(/\n/g, '<br>')}</div>`
        };

        console.log(`   📤 Enviando a: ${recipient.email}`);
        
        // INTENTAR ENVÍO
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`   ✅ ENVIADO: ${recipient.email}`);
        console.log(`   📫 Message ID: ${info.messageId}`);
        console.log(`   🔄 Response: ${info.response}`);
        
        successful++;
        results.push({ 
          email: recipient.email, 
          status: 'enviado', 
          messageId: info.messageId,
          response: info.response 
        });

        // Pausa de 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ FALLÓ: ${recipient.email}`);
        console.log(`   💥 Error: ${error.message}`);
        
        failed++;
        results.push({ 
          email: recipient.email, 
          status: 'falló', 
          error: error.message 
        });
      }
    }

    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Enviados: ${successful}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`📨 Total: ${recipients.length}`);

    res.json({
      success: successful > 0,
      message: `Enviados: ${successful}, Fallidos: ${failed}`,
      sent: successful,
      failed: failed,
      details: results
    });
    
  } catch (error) {
    console.log('💥 ERROR CRÍTICO:', error);
    res.json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Ruta de PRUEBA INDIVIDUAL
app.post('/send-test-single', async (req, res) => {
  console.log('\n🧪 PRUEBA INDIVIDUAL...');
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email requerido' });
    }

    console.log(`📧 Enviando prueba a: ${email}`);
    
    const mailOptions = {
      from: `"Prueba Individual" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Prueba Individual - ' + new Date().toLocaleString(),
      text: `Hola,\n\nEsta es una prueba individual enviada a ${email}.\n\nSi recibes este correo, el sistema funciona correctamente.`,
      html: `<h2>¡Prueba Individual Exitosa!</h2><p>Este correo fue enviado específicamente a: <strong>${email}</strong></p>`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ PRUEBA ENVIADA: ${email}`);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    res.json({ 
      success: true, 
      message: `Prueba enviada a ${email}`,
      messageId: info.messageId
    });
    
  } catch (error) {
    console.log('❌ PRUEBA FALLÓ:', error.message);
    res.json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Crear directorio de uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log('📍 Endpoints:');
  console.log('   - /send-emails → Envío masivo');
  console.log('   - /send-test-single → Prueba individual (POST)');
});
