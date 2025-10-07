/** @type {string | null} */
let currentDomain = null;

/** @type {Object<string, HTMLElement>} */
const elements = {
    domain: document.getElementById('domain'),
    addBtn: document.getElementById('addBtn'),
    notesList: document.getElementById('notesList'),
    editorModal: document.getElementById('editorModal'),
    modalDomain: document.getElementById('modalDomain'),
    noteText: document.getElementById('noteText'),
    saveNote: document.getElementById('saveNote'),
    cancelNote: document.getElementById('cancelNote')
};

// ---------------------------
// Utilities
// ---------------------------

/**
 * Extracts domain from URL
 * @param {string} url
 * @returns {string}
 */
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return 'unknown-domain';
    }
}

/**
 * Loads current domain from active tab
 * @returns {Promise<void>}
 */
async function loadCurrentDomain() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length && tabs[0].url) {
        currentDomain = getDomainFromUrl(tabs[0].url);
    } else {
        currentDomain = 'unknown';
    }
}

// ---------------------------
// Rendering helpers
// ---------------------------

function createNoteMeta(ts) {
    const meta = document.createElement('div');
    meta.className = 'noteMeta';
    meta.textContent = new Date(ts).toLocaleString();
    return meta;
}

function createNotePreview(data) {
    const preview = document.createElement('div');
    preview.className = 'notePreview';
    preview.textContent = window.SecureUtils.decode(data);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggleTextBtn';
    toggleBtn.textContent = 'Показати більше';
    toggleBtn.style.display = 'none';

    toggleBtn.addEventListener('click', () => {
        const isExpanded = preview.classList.toggle('expanded');
        toggleBtn.textContent = isExpanded ? 'Згорнути' : 'Показати більше';
    });

    requestAnimationFrame(() => {
        if (preview.scrollHeight > preview.clientHeight) {
            toggleBtn.style.display = 'inline-block';
        }
    });

    const container = document.createElement('div');
    container.appendChild(preview);
    container.appendChild(toggleBtn);
    return container;
}

function createNoteActions(noteId) {
    const actions = document.createElement('div');
    actions.className = 'noteActions';

    const deleteBtn = document.createElement('button');
    deleteBtn.title = 'Видалити';
    deleteBtn.textContent = '🗑';
    deleteBtn.classList.add('deleteNote');
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Видалити цей нотаток?')) {
            await deleteNote(noteId);
        }
    });

    actions.appendChild(deleteBtn);
    return actions;
}

/**
 * Creates DOM element for a single note
 * @param {{id: string, ts: string, data: string}} note
 * @returns {HTMLElement}
 */
function createNoteElement(note) {
    const item = document.createElement('div');
    item.className = 'noteItem';

    const left = document.createElement('div');
    left.style.flex = '1';

    left.appendChild(createNoteMeta(note.ts));
    left.appendChild(createNotePreview(note.data));

    item.appendChild(left);
    item.appendChild(createNoteActions(note.id));

    return item;
}


function renderEmptyState() {
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = 'Ще немає нотатків для цього домену...';
    emptyMsg.classList.add('noteEmpty');
    elements.notesList.appendChild(emptyMsg);
}

/**
 * Renders notes for current domain
 * @returns {Promise<void>}
 */
async function renderNotes() {
    if (!currentDomain) return;

    const key = `secureNotes:${currentDomain}`;
    const { [key]: notes = [] } = await chrome.storage.local.get(key);
    elements.notesList.innerHTML = '';

    if (!notes.length) {
        renderEmptyState();
        return;
    }

    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        elements.notesList.appendChild(noteElement);
    });
}

// ---------------------------
// Modal and state handling
// ---------------------------

function showModal() {
    elements.noteText.value = '';
    updateSaveButtonState();
    elements.editorModal.classList.remove('hidden');
}

function hideModal() {
    elements.editorModal.classList.add('hidden');
}

function showError(message) {
    errorEl = document.createElement('div');
    errorEl.classList.add('noteError');
    elements.noteText.parentNode.appendChild(errorEl);
    errorEl.textContent = message;
}

function updateSaveButtonState() {
    const text = elements.noteText.value.trim();
    elements.saveNote.disabled = text === '';
}


// ---------------------------
// CRUD actions
// ---------------------------

/**
 * Saves a new note
 * @returns {Promise<void>}
 */
async function saveNote() {
    const text = elements.noteText.value.trim();
    if (!text) {
        showError('Нотаток не може бути пустим.');
        return;
    }

    const note = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: window.SecureUtils.nowISO(),
        data: window.SecureUtils.encode(text)
    };

    try {
        const key = `secureNotes:${currentDomain}`;
        const { [key]: notes = [] } = await chrome.storage.local.get(key);
        notes.unshift(note);
        await chrome.storage.local.set({ [key]: notes });
        hideModal();
        await renderNotes();
    } catch (err) {
        console.error('Save failed:', err);
        alert('Не можливо зберегти файл');
    }
}

/**
 * Deletes a note by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
async function deleteNote(id) {
    const key = `secureNotes:${currentDomain}`;
    const { [key]: notes = [] } = await chrome.storage.local.get(key);
    const filtered = notes.filter(note => note.id !== id);
    await chrome.storage.local.set({ [key]: filtered });
    await renderNotes();
}

// ---------------------------
// Initialization
// ---------------------------

/**
 * Initializes the popup
 * @returns {Promise<void>}
 */
async function initialize() {
    try {
        await loadCurrentDomain();
        elements.domain.textContent = currentDomain || 'unknown';
        elements.modalDomain.textContent = currentDomain || 'unknown';
        await renderNotes();
    } catch (err) {
        console.error('Popup initialization failed:', err);
        elements.notesList.textContent = 'Initialization error';
    }
}

function bindEventListeners() {
    elements.addBtn.addEventListener('click', showModal);
    elements.cancelNote.addEventListener('click', hideModal);
    elements.saveNote.addEventListener('click', saveNote);
    elements.noteText.addEventListener('input', updateSaveButtonState);
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && currentDomain && changes[`secureNotes:${currentDomain}`]) {
            renderNotes();
        }
    });
}

bindEventListeners();
initialize();