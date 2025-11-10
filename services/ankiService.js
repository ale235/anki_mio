const axios = require('axios');

const ANKI_CONNECT_URL = 'http://localhost:8765';

/**
 * Enviar request a AnkiConnect
 */
async function invoke(action, params = {}, customTimeout = 30000) {
  const response = await axios.post(ANKI_CONNECT_URL, {
    action: action,
    version: 6,
    params: params
  }, {
    timeout: customTimeout,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  return response.data.result;
}

/**
 * Obtener versión de AnkiConnect
 */
async function getVersion() {
  return await invoke('version');
}

/**
 * Obtener lista de mazos
 */
async function getDeckNames() {
  return await invoke('deckNames');
}

/**
 * Crear un mazo si no existe
 */
async function createDeck(deckName) {
  return await invoke('createDeck', {
    deck: deckName
  });
}

/**
 * Guardar un archivo de medios en Anki
 */
async function storeMediaFile(filename, data) {
  // Usar timeout de 60 segundos para archivos de medios
  return await invoke('storeMediaFile', {
    filename: filename,
    data: data
  }, 60000);
}

/**
 * Agregar una nota/tarjeta a Anki
 */
async function addNote(deckName, front, back) {
  // Primero, asegurarse de que el mazo existe
  try {
    await createDeck(deckName);
  } catch (error) {
    // El mazo ya puede existir, continuar
  }

  const note = {
    deckName: deckName,
    modelName: 'Basic',
    fields: {
      Front: front,
      Back: back
    },
    options: {
      allowDuplicate: false
    },
    tags: ['auto-generated', 'image-import']
  };

  return await invoke('addNote', { note });
}

/**
 * Agregar nota con imagen adjunta
 */
async function addNoteWithImage(deckName, front, back, imageFilename, imageData) {
  try {
    await createDeck(deckName);
  } catch (error) {
    // El mazo ya puede existir
  }

  // Primero guardar la imagen en Anki
  await storeMediaFile(imageFilename, imageData);

  const note = {
    deckName: deckName,
    modelName: 'Basic',
    fields: {
      Front: front,
      Back: back
    },
    options: {
      allowDuplicate: false
    },
    tags: ['auto-generated', 'image-import']
  };

  return await invoke('addNote', { note });
}

module.exports = {
  getVersion,
  getDeckNames,
  createDeck,
  addNote,
  addNoteWithImage,
  storeMediaFile,
  invoke
};
