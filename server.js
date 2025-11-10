const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const ankiService = require('./services/ankiService');
const ocrService = require('./services/ocrService');
const imageService = require('./services/imageService');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Rutas
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const imagePath = req.file.path;
    const deckName = req.body.deckName || 'Default';
    const generateFromOCR = req.body.useOCR === 'true';
    const ocrLanguage = req.body.ocrLanguage || 'eng'; // 'jpn' o 'eng'

    let front, back;

    if (generateFromOCR) {
      // Extraer texto de la imagen con OCR
      console.log(`Procesando imagen con OCR (idioma: ${ocrLanguage})...`);
      const extractedText = await ocrService.extractText(imagePath, ocrLanguage);

      // Generar pregunta y respuesta del texto extraído con traducción
      const cardData = await ocrService.generateCardFromText(extractedText, ocrLanguage);
      front = cardData.front;
      back = cardData.back;
    } else {
      // Usar campos manuales del usuario
      front = req.body.front || 'Pregunta';
      back = req.body.back || 'Respuesta';
    }

    // Optimizar imagen antes de enviar a Anki
    console.log('Optimizando imagen...');
    const optimizedImageBuffer = await imageService.optimizeImage(imagePath);
    const base64Image = optimizedImageBuffer.toString('base64');
    const imageFilename = `anki_${Date.now()}${path.extname(req.file.originalname)}`;

    console.log('Guardando imagen en Anki...');
    // Guardar la imagen optimizada en Anki
    await ankiService.storeMediaFile(imageFilename, base64Image);

    // Crear el HTML con referencia a la imagen guardada
    const frontWithImage = `${front}<br><img src="${imageFilename}">`;

    // Crear tarjeta en Anki
    console.log('Creando tarjeta en Anki...');
    const result = await ankiService.addNote(deckName, frontWithImage, back);

    // Limpiar archivo temporal
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: 'Tarjeta creada exitosamente',
      noteId: result,
      preview: {
        front: front,
        back: back,
        image: imageFilename
      }
    });

  } catch (error) {
    console.error('Error:', error);

    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message || 'Error al procesar la imagen',
      details: error.toString()
    });
  }
});

// Obtener lista de mazos disponibles
app.get('/api/decks', async (req, res) => {
  try {
    const decks = await ankiService.getDeckNames();
    res.json({ decks });
  } catch (error) {
    console.error('Error al obtener mazos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar conexión con Anki
app.get('/api/anki-status', async (req, res) => {
  try {
    const version = await ankiService.getVersion();
    res.json({
      connected: true,
      version: version,
      message: 'AnkiConnect está funcionando correctamente'
    });
  } catch (error) {
    res.status(503).json({
      connected: false,
      error: error.message,
      message: 'No se puede conectar con AnkiConnect. Asegúrate de tener Anki abierto con el plugin AnkiConnect instalado.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Asegúrate de tener Anki abierto con AnkiConnect instalado`);
});
