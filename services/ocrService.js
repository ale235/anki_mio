const Tesseract = require('tesseract.js');
const axios = require('axios');

/**
 * Extraer texto de una imagen usando OCR
 * @param {string} imagePath - Ruta de la imagen
 * @param {string} language - Idioma ('jpn' o 'eng')
 */
async function extractText(imagePath, language = 'eng') {
  console.log(`Iniciando OCR en idioma: ${language}`);

  const result = await Tesseract.recognize(
    imagePath,
    language, // 'jpn' para japonés o 'eng' para inglés
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
 * Convertir texto japonés a furigana usando API
 * @param {string} text - Texto en japonés
 */
async function addFurigana(text) {
  try {
    // Usar API gratuita de furigana
    const response = await axios.post('https://jisho.org/api/v1/search/words', {
      keyword: text
    }, {
      timeout: 10000
    });

    // Si no hay resultados, retornar el texto original
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      return text;
    }

    // Extraer la lectura (furigana)
    const firstResult = response.data.data[0];
    if (firstResult.japanese && firstResult.japanese[0]) {
      const reading = firstResult.japanese[0].reading || '';
      const word = firstResult.japanese[0].word || text;

      if (reading) {
        return `${word}（${reading}）`;
      }
    }

    return text;
  } catch (error) {
    console.error('Error obteniendo furigana:', error.message);
    return text;
  }
}

/**
 * Traducir texto usando API gratuita
 * @param {string} text - Texto a traducir
 * @param {string} sourceLang - Idioma origen ('ja' o 'en')
 * @param {string} targetLang - Idioma destino ('es')
 */
async function translateText(text, sourceLang = 'en', targetLang = 'es') {
  try {
    // Usar API de traducción gratuita de LibreTranslate (auto-hospedada o pública)
    // Alternativa: MyMemory Translation API (gratuita, sin API key)
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      },
      timeout: 10000
    });

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }

    return text; // Si falla, retornar texto original
  } catch (error) {
    console.error('Error en traducción:', error.message);
    return text;
  }
}

/**
 * Generar pregunta y respuesta del texto extraído
 * @param {string} text - Texto extraído por OCR
 * @param {string} language - Idioma del texto ('jpn' o 'eng')
 */
async function generateCardFromText(text, language = 'eng') {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      front: '¿Qué muestra esta imagen?',
      back: 'Ver imagen'
    };
  }

  const fullText = lines.join(' ').trim();

  if (language === 'jpn') {
    // Para japonés: frente = texto japonés, reverso = furigana + traducción
    console.log('Procesando texto japonés...');

    // Agregar furigana al texto
    const textWithFurigana = await addFurigana(fullText);

    // Traducir al español
    const translation = await translateText(fullText, 'ja', 'es');

    return {
      front: fullText,
      back: `<div style="margin-bottom: 10px;"><strong>Lectura:</strong><br>${textWithFurigana}</div><div><strong>Traducción:</strong><br>${translation}</div>`
    };
  } else {
    // Para inglés: frente = texto inglés, reverso = traducción al español
    console.log('Procesando texto en inglés...');

    const translation = await translateText(fullText, 'en', 'es');

    return {
      front: fullText,
      back: `<strong>Traducción:</strong><br>${translation}`
    };
  }
}

module.exports = {
  extractText,
  generateCardFromText,
  addFurigana,
  translateText
};
