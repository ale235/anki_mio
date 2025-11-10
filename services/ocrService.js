const Tesseract = require('tesseract.js');

/**
 * Extraer texto de una imagen usando OCR
 */
async function extractText(imagePath) {
  console.log('Iniciando OCR en:', imagePath);

  const result = await Tesseract.recognize(
    imagePath,
    'spa+eng', // Español e inglés
    {
      logger: info => {
        if (info.status === 'recognizing text') {
          console.log(`Progreso OCR: ${Math.round(info.progress * 100)}%`);
        }
      }
    }
  );

  return result.data.text;
}

/**
 * Generar pregunta y respuesta del texto extraído
 */
function generateCardFromText(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      front: '¿Qué muestra esta imagen?',
      back: 'Ver imagen'
    };
  }

  // Si hay múltiples líneas, usar la primera como pregunta y el resto como respuesta
  if (lines.length > 1) {
    return {
      front: lines[0].trim(),
      back: lines.slice(1).join('<br>').trim()
    };
  }

  // Si solo hay una línea, crear una pregunta simple
  return {
    front: `¿Qué dice el texto?`,
    back: lines[0].trim()
  };
}

module.exports = {
  extractText,
  generateCardFromText
};

