const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const uploadForm = document.getElementById('uploadForm');
const deckSelect = document.getElementById('deckSelect');
const useOCRCheckbox = document.getElementById('useOCR');
const ocrLanguageGroup = document.getElementById('ocrLanguageGroup');
const ocrLanguageSelect = document.getElementById('ocrLanguage');
const manualFields = document.getElementById('manualFields');
const submitBtn = document.getElementById('submitBtn');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const statusIndicator = document.getElementById('statusIndicator');

let selectedFile = null;

// Verificar estado de Anki al cargar
checkAnkiStatus();
loadDecks();

// Manejar clic en área de upload
uploadArea.addEventListener('click', () => {
    imageInput.click();
});

// Manejar selección de archivo
imageInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
});

// ===== NUEVA FUNCIONALIDAD: Pegar desde portapapeles =====
// Detectar pegado en toda la página
document.addEventListener('paste', async (e) => {
    e.preventDefault();

    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();

            if (blob) {
                // Mostrar indicación visual
                uploadArea.style.borderColor = '#28a745';
                uploadArea.style.background = '#e8f5e9';

                setTimeout(() => {
                    uploadArea.style.borderColor = '';
                    uploadArea.style.background = '';
                }, 500);

                // Crear un archivo a partir del blob
                const file = new File([blob], `pasted-image-${Date.now()}.png`, {
                    type: blob.type
                });

                handleFile(file);
                showMessage('✅ Imagen pegada desde el portapapeles', 'success');
                break;
            }
        }
    }
});

// Mostrar hint visual cuando el usuario enfoca la ventana
let pasteHintTimeout;
window.addEventListener('focus', () => {
    clearTimeout(pasteHintTimeout);
    pasteHintTimeout = setTimeout(() => {
        if (!selectedFile) {
            uploadArea.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                uploadArea.style.animation = '';
            }, 500);
        }
    }, 100);
});

// Agregar animación CSS para el hint visual
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);
// ===== FIN NUEVA FUNCIONALIDAD =====

// Toggle entre OCR y manual
useOCRCheckbox.addEventListener('change', () => {
    if (useOCRCheckbox.checked) {
        manualFields.classList.add('hidden');
        ocrLanguageGroup.style.display = 'block';
    } else {
        manualFields.classList.remove('hidden');
        ocrLanguageGroup.style.display = 'none';
    }
});

// Manejar archivo seleccionado
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showMessage('Por favor selecciona una imagen válida', 'error');
        return;
    }

    selectedFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

// Submit form
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        showMessage('Por favor selecciona una imagen', 'error');
        return;
    }

    const deckName = deckSelect.value;
    if (!deckName) {
        showMessage('Por favor selecciona un mazo', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('deckName', deckName);
    formData.append('useOCR', useOCRCheckbox.checked);

    if (useOCRCheckbox.checked) {
        // Agregar idioma seleccionado para OCR
        formData.append('ocrLanguage', ocrLanguageSelect.value);
    } else {
        const front = document.getElementById('frontInput').value;
        const back = document.getElementById('backInput').value;

        if (!front || !back) {
            showMessage('Por favor completa el frente y reverso de la tarjeta', 'error');
            return;
        }

        formData.append('front', front);
        formData.append('back', back);
    }

    // Mostrar loading
    loading.style.display = 'block';
    submitBtn.disabled = true;
    message.style.display = 'none';

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('✅ Tarjeta creada exitosamente en Anki!', 'success');
            resetForm();
        } else {
            showMessage(`❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Error de conexión: ${error.message}`, 'error');
    } finally {
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Verificar estado de Anki
async function checkAnkiStatus() {
    try {
        const response = await fetch('/api/anki-status');
        const data = await response.json();

        if (data.connected) {
            statusIndicator.className = 'status-indicator connected';
            statusIndicator.innerHTML = `
                <div class="status-dot green"></div>
                <span>✓ Conectado a Anki (versión ${data.version})</span>
            `;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator disconnected';
        statusIndicator.innerHTML = `
            <div class="status-dot red"></div>
            <span>✗ Anki no conectado. Abre Anki e instala AnkiConnect</span>
        `;
    }
}

// Cargar mazos disponibles
async function loadDecks() {
    try {
        const response = await fetch('/api/decks');
        const data = await response.json();

        deckSelect.innerHTML = '<option value="">Selecciona un mazo...</option>';

        data.decks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck;
            option.textContent = deck;
            deckSelect.appendChild(option);
        });

        // Seleccionar "Default" si existe
        if (data.decks.includes('Default')) {
            deckSelect.value = 'Default';
        }
    } catch (error) {
        deckSelect.innerHTML = '<option value="">Error al cargar mazos</option>';
        console.error('Error cargando mazos:', error);
    }
}

// Mostrar mensaje
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';

    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// Reset form
function resetForm() {
    selectedFile = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
    document.getElementById('frontInput').value = '';
    document.getElementById('backInput').value = '';
    submitBtn.disabled = true;
}
