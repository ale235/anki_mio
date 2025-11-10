# 🎴 Generador de Tarjetas Anki desde Imágenes

Sistema para convertir imágenes en tarjetas de Anki automáticamente usando OCR o entrada manual.

## 📋 Requisitos Previos

1. **Node.js** (v14 o superior)
2. **Anki** instalado en tu computadora
3. **AnkiConnect** - Plugin de Anki para permitir comunicación externa

## 🔧 Instalación

### 1. Instalar AnkiConnect en Anki

1. Abre Anki
2. Ve a **Tools → Add-ons → Get Add-ons**
3. Ingresa el código: `2055492159`
4. Reinicia Anki

### 2. Configurar el proyecto

```bash
# Instalar dependencias
npm install
```

### 3. Iniciar el servidor

```bash
# Modo normal
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## 🚀 Uso

1. **Abre Anki** en tu computadora (debe estar abierto para que funcione)
2. Accede a `http://localhost:3000` en tu navegador
3. Verifica que el indicador muestre "Conectado a Anki"
4. Sube una imagen:
   - Arrastra y suelta una imagen
   - O haz clic para seleccionar una imagen
5. Selecciona el mazo de destino
6. Elige el método:
   - **Con OCR**: Extrae texto automáticamente de la imagen
   - **Manual**: Ingresa manualmente el frente y reverso de la tarjeta
7. Haz clic en "Crear Tarjeta en Anki"

## ✨ Características

- 📸 **Subida de imágenes** por drag & drop o selección
- 🔍 **OCR automático** para extraer texto de imágenes (español e inglés)
- 📝 **Modo manual** para personalizar completamente las tarjetas
- 🎯 **Selección de mazo** - Elige a qué mazo agregar las tarjetas
- 🖼️ **Imágenes embebidas** - Las imágenes se incluyen en las tarjetas
- ✅ **Verificación de conexión** - Indica si Anki está conectado
- 🏷️ **Auto-etiquetado** - Las tarjetas se etiquetan automáticamente

## 🛠️ API Endpoints

- `POST /api/upload-image` - Sube imagen y crea tarjeta
- `GET /api/decks` - Obtiene lista de mazos disponibles
- `GET /api/anki-status` - Verifica conexión con Anki

## 📁 Estructura del Proyecto

```
anki_mio/
├── public/
│   ├── index.html      # Frontend
│   └── app.js          # Lógica del cliente
├── services/
│   ├── ankiService.js  # Comunicación con AnkiConnect
│   └── ocrService.js   # Procesamiento OCR
├── uploads/            # Archivos temporales (auto-generado)
├── server.js           # Servidor Express
├── package.json
├── .env
└── README.md
```

## ⚠️ Solución de Problemas

### "Anki no conectado"
- Asegúrate de que Anki esté abierto
- Verifica que AnkiConnect esté instalado (código: 2055492159)
- Reinicia Anki después de instalar AnkiConnect

### "Error al crear tarjeta"
- Verifica que el mazo seleccionado exista
- Asegúrate de que la imagen sea válida
- Revisa la consola del servidor para más detalles

### El OCR no funciona bien
- Usa imágenes con texto claro y legible
- Evita imágenes borrosas o con bajo contraste
- Considera usar el modo manual para mayor precisión

## 🔐 Configuración Avanzada

Edita el archivo `.env` para cambiar configuraciones:

```
PORT=3000
ANKI_CONNECT_URL=http://localhost:8765
```

## 📝 Notas

- Las imágenes se procesan temporalmente y se eliminan después
- Las tarjetas creadas se etiquetan con: `auto-generated`, `image-import`
- El OCR soporta español e inglés simultáneamente
- Las tarjetas usan el modelo "Basic" de Anki por defecto

## 🤝 Contribuir

Siéntete libre de reportar issues o sugerir mejoras!

## 📄 Licencia

MIT

