// Carga las bibliotecas necesarias
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware para servir archivos estáticos (tu HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Configuración del transporte de Nodemailer (usa tus propios datos)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Ejemplo: 'gmail', 'outlook', 'yahoo'
    auth: {
        user: 'de.escobedo@unineuuni.edu.mx', // Tu dirección de correo
        pass: 'liib qrgg lyxz tgey' // Tu contraseña de aplicación (no la de tu cuenta)
    }
});

// Endpoint para enviar correos
app.post('/send-emails', async (req, res) => {
    const { subject, sender, message, recipients } = req.body;

    // Valida que los datos necesarios estén presentes
    if (!subject || !message || !recipients || recipients.length === 0) {
        return res.status(400).json({ success: false, message: 'Faltan datos para el envío.' });
    }

    try {
        // Recorre la lista de destinatarios y envía un correo a cada uno
        for (const recipient of recipients) {
            const mailOptions = {
                from: `" ${sender}" <tu_correo@gmail.com>`,
                to: recipient,
                subject: subject,
                html: message.replace(/\n/g, '<br>') // Convierte saltos de línea a etiquetas <br>
            };

            // Envía el correo
            await transporter.sendMail(mailOptions);
            console.log(`Correo enviado a: ${recipient}`);
        }

        res.json({ success: true, message: `Correos enviados a ${recipients.length} destinatarios.` });
    } catch (error) {
        console.error('Error al enviar los correos:', error);
        res.status(500).json({ success: false, message: 'Error al enviar los correos.' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});