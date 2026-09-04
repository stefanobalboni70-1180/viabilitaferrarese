// Coordinate di Ferrara
const FERRARA_COORDS = [44.8381, 11.6198];
const MAP_ZOOM = 11;

// Configurazione Icone
const ICONS = {
    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: '⛔', label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' }
};

// Stato dell'applicazione
let map;
let markersData = [];
let activeLayers = {};
let pendingLatLng = null;
let isAdmin = sessionStorage.getItem('ferrara_admin') === 'true';

// Elementi DOM
const modalOverlay = document.getElementById('marker-modal');
const closeModalBtn = document.getElementById('close-modal');
const optionCards = document.querySelectorAll('.option-card');

const loginModal = document.getElementById('login-modal');
const loginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('admin-logout-btn');
const closeLoginBtn = document.getElementById('close-login');
const submitLoginBtn = document.getElementById('submit-login');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const headerSubtitle = document.getElementById('header-subtitle');

const searchContainer = document.getElementById('admin-search-container');
const searchInput = document.getElementById('admin-search-input');
const searchBtn = document.getElementById('admin-search-btn');

// Aggiorna UI in base allo stato
function updateUI() {
    if (isAdmin) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        searchContainer.classList.remove('hidden');
        headerSubtitle.textContent = "Modalità Admin: fai DOPPIO CLICK sulla mappa per aggiungere una segnalazione";
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        searchContainer.classList.add('hidden');
        headerSubtitle.textContent = "Modalità Visualizzazione: clicca sui marker per i dettagli";
    }
    // Ridisegna i marker per mostrare/nascondere il tasto elimina
    refreshMarkers();
}

// Inizializzazione Mappa
function initMap() {
    map = L.map('map', {
        zoomControl: false, // Spostiamo i controlli
        doubleClickZoom: false // Disabilita lo zoom al doppio click per non disturbare l'inserimento
    }).setView(FERRARA_COORDS, MAP_ZOOM);

    // Aggiungi controlli zoom in basso a destra
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Layer mappa standard OpenStreetMap (totalmente gratuito e senza chiavi)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Evento doppio click sulla mappa (solo admin)
    map.on('dblclick', function (e) {
        if (!isAdmin) return;
        pendingLatLng = e.latlng;
        openModal();
    });

    loadMarkers();
    updateUI();
}

// --- LOGICA ADMIN ---
loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    passwordInput.value = '';
    loginError.classList.add('hidden');
    passwordInput.focus();
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.classList.add('hidden');
});

submitLoginBtn.addEventListener('click', attemptLogin);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
});

function attemptLogin() {
    // Password hardcoded semplice per demo (in produzione servirebbe un backend!)
    if (passwordInput.value === 'admin') {
        isAdmin = true;
        sessionStorage.setItem('ferrara_admin', 'true');
        loginModal.classList.add('hidden');
        updateUI();
    } else {
        loginError.classList.remove('hidden');
    }
}

logoutBtn.addEventListener('click', () => {
    isAdmin = false;
    sessionStorage.removeItem('ferrara_admin');
    updateUI();
});

// LOGICA RICERCA (Nominatim)
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.textContent = '...';
    searchBtn.disabled = true;

    try {
        // Aggiunge Ferrara per contestualizzare la ricerca
        const searchQuery = encodeURIComponent(query + ', Ferrara');
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 17); // Zoom livello 17
        } else {
            alert("Nessuna via trovata con questo nome.");
        }
    } catch (error) {
        console.error("Errore nella ricerca", error);
        alert("Errore durante la ricerca. Riprova più tardi.");
    } finally {
        searchBtn.textContent = 'Cerca';
        searchBtn.disabled = false;
    }
}

// Gestione Modale Inserimento
function openModal() {
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    pendingLatLng = null;
}

closeModalBtn.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Gestione Selezione Icona
optionCards.forEach(card => {
    card.addEventListener('click', function () {
        if (!pendingLatLng) return;

        const type = this.getAttribute('data-type');
        let note = prompt("Inserisci una nota per questa segnalazione (opzionale):");
        if (!note || note.trim() === "") {
            note = null;
        }
        addMarker(pendingLatLng.lat, pendingLatLng.lng, type, null, true, note);
        closeModal();
    });
});

// Crea l'icona custom per Leaflet
function createCustomIcon(type) {
    const config = ICONS[type];
    return L.divIcon({
        className: 'custom-icon-wrapper',
        html: `<div class="custom-marker ${type}">${config.emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
}

// Aggiungi un marker (e salvalo se nuovo)
function addMarker(lat, lng, type, id = null, save = true, note = null) {
    const markerId = id || Date.now().toString();
    const config = ICONS[type];
    const date = new Date(parseInt(markerId)).toLocaleString('it-IT');

    const marker = L.marker([lat, lng], {
        icon: createCustomIcon(type)
    }).addTo(map);

    // Contenuto Popup
    let popupContent = `
        <div class="popup-content">
            <h3>${config.label}</h3>
            <span class="popup-date">Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
    `;

    if (note) {
        popupContent += `<div class="user-note"><strong>Nota utente:</strong> ${note}</div>`;
    }

    // Mostra il tasto elimina se admin, altrimenti opzioni per visualizzatori
    if (isAdmin) {
        popupContent += `<button class="delete-btn" onclick="removeMarker('${markerId}')">Risolto / Rimuovi</button>`;
    } else {
        if (!note || !note.includes("RISOLTO")) {
            popupContent += `<button class="note-btn" onclick="reportResolved('${markerId}')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); margin-bottom: 8px;">Segnala come risolto</button>`;
        }
        if (!note) {
            popupContent += `<button class="note-btn" onclick="addNote('${markerId}')">Segnala variazione</button>`;
        }
    }

    popupContent += `</div>`;

    marker.bindPopup(popupContent);

    // Zoom al doppio click sull'icona
    marker.on('dblclick', function () {
        if (!isAdmin) {
            map.flyTo([lat, lng], 17);
        }
    });

    // Dettagli al passaggio del mouse (Tooltip)
    let tooltipContent = `
        <div class="tooltip-content">
            <strong>${config.label}</strong><br>
            <span>Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
    `;
    if (note) {
        tooltipContent += `<br><span class="note-badge">📝 Nota: ${note}</span>`;
    }
    tooltipContent += `</div>`;

    marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -20] });

    activeLayers[markerId] = marker;

    if (save) {
        markersData.push({ id: markerId, lat, lng, type, note: note });
        saveToLocalStorage();
    }
}

// Rimuovi marker (esposta globalmente per il bottone nel popup)
window.removeMarker = function (id) {
    // Rimuovi dalla mappa
    if (activeLayers[id]) {
        map.removeLayer(activeLayers[id]);
        delete activeLayers[id];
    }

    // Rimuovi dallo store
    markersData = markersData.filter(m => m.id !== id);
    saveToLocalStorage();
}

// Aggiungi Nota (esposta globalmente per il bottone nel popup del visualizzatore)
window.addNote = function (id) {
    const note = prompt("Inserisci un dettaglio per l'amministratore (es. La strada è stata riaperta stamattina):");
    if (note && note.trim() !== "") {
        const index = markersData.findIndex(m => m.id === id);
        if (index !== -1) {
            markersData[index].note = note;
            saveToLocalStorage();
            refreshMarkers();
        }
    }
}

// Segnala come Risolto
window.reportResolved = function (id) {
    if (confirm("Vuoi segnalare che questo problema è stato risolto e la strada è libera?")) {
        const index = markersData.findIndex(m => m.id === id);
        if (index !== -1) {
            const existingNote = markersData[index].note;
            if (existingNote) {
                markersData[index].note = existingNote + " | ✅ Segnalato come RISOLTO";
            } else {
                markersData[index].note = "✅ Segnalato come RISOLTO";
            }
            saveToLocalStorage();
            refreshMarkers();
        }
    }
}

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('ferrara_viabilita_markers', JSON.stringify(markersData));
}

function loadMarkers() {
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    if (saved) {
        try {
            markersData = JSON.parse(saved);
            markersData.forEach(m => {
                addMarker(m.lat, m.lng, m.type, m.id, false, m.note);
            });
        } catch (e) {
            console.error("Errore nel caricamento dei marker", e);
            markersData = [];
        }
    }
}

// Ridisegna i marker (es. quando cambia lo stato admin)
function refreshMarkers() {
    // Rimuove tutti i marker dalla mappa
    for (let id in activeLayers) {
        map.removeLayer(activeLayers[id]);
    }
    activeLayers = {};

    // Li ricarica
    markersData.forEach(m => {
        addMarker(m.lat, m.lng, m.type, m.id, false, m.note);
    });
}

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initMap);
