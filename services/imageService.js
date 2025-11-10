const sharp = require('sharp');
const fs = require('fs');

/**
 * Optimizar imagen para Anki
 * @param {string} imagePath - Ruta de la imagen original
 * @returns {Promise<Buffer>} - Buffer de la imagen optimizada
 */
async function optimizeImage(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Obtener metadata de la imagen
    const metadata = await sharp(imageBuffer).metadata();
    
    console.log(`Imagen original: ${metadata.width}x${metadata.height}, formato: ${metadata.format}`);
    
    // Configurar dimensiones máximas (Anki recomienda max 1920px)
    const maxWidth = 1200;
    const maxHeight = 1200;
    
    let processedImage = sharp(imageBuffer);
    
    // Redimensionar si es necesario
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      console.log(`Redimensionando imagen a max ${maxWidth}x${maxHeight}...`);
      processedImage = processedImage.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convertir y comprimir según el formato
    let optimizedBuffer;
    if (metadata.format === 'png') {
      optimizedBuffer = await processedImage
        .png({ quality: 80, compressionLevel: 8 })
        .toBuffer();
    } else {
      // Para JPG y otros formatos
      optimizedBuffer = await processedImage
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    }
    
    const originalSize = (imageBuffer.length / 1024).toFixed(2);
    const optimizedSize = (optimizedBuffer.length / 1024).toFixed(2);
    const reduction = (((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length) * 100).toFixed(1);
    
    console.log(`Optimización completada: ${originalSize}KB → ${optimizedSize}KB (${reduction}% reducción)`);
    
    return optimizedBuffer;
  } catch (error) {
    console.error('Error optimizando imagen:', error);
    // Si falla la optimización, retornar imagen original
    return fs.readFileSync(imagePath);
  }
}

/**
 * Obtener tamaño de imagen en KB
 */
function getImageSize(buffer) {
  return (buffer.length / 1024).toFixed(2);
}

module.exports = {
  optimizeImage,
  getImageSize
};

