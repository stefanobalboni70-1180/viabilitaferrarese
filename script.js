// ==========================================
// CONFIGURAZIONE FIREBASE FIRESTORE
// ==========================================
// Inserisci qui le tue credenziali da Firebase Console:
// (Project Overview -> Impostazioni Progetto -> Le tue app -> Web App)
const firebaseConfig = {
    apiKey: "AIzaSyDRUq7PoqE2GxlZhui3Gm_305t5V-7ibpI",
    authDomain: "viabilita-ferrarese-a7b75.firebaseapp.com",
    databaseURL: "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "viabilita-ferrarese-a7b75",
    storageBucket: "viabilita-ferrarese-a7b75.firebasestorage.app",
    messagingSenderId: "470647422268",
    appId: "1:470647422268:web:0d9286b851d14473007239",
    measurementId: "G-V0TRPZPJFK"
};

// Coordinate di Ferrara
const FERRARA_COORDS = [44.8381, 11.6198];
const MAP_ZOOM = 13;

// Configurazione Icone
const ICONS = {
    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: '⛔', label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' },
    mercato: { emoji: '🛒', label: 'Mercato settimanale' }
};

// Stato dell'applicazione
let map;
let markersData = [];
let activeLayers = {};
let pendingLatLng = null;
let isAdmin = sessionStorage.getItem('ferrara_admin') === 'true';

// Riferimento a Firebase Realtime Database
let db = null;
let markersRef = null;
let isFirebaseOnline = false;

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
const syncBadge = document.getElementById('sync-badge');

const searchContainer = document.getElementById('admin-search-container');
const searchInput = document.getElementById('admin-search-input');
const searchBtn = document.getElementById('admin-search-btn');

// Aggiorna indicatore stato Sync
function updateSyncBadge(online, text) {
    if (!syncBadge) return;
    syncBadge.className = 'sync-badge ' + (online ? 'online' : 'offline');
    syncBadge.textContent = text || (online ? '🟢 Cloud Sincronizzato' : '🟡 Modalità Locale');
}

// Inizializzazione Firebase Realtime Database
function initFirebase() {
    const isConfigured = firebaseConfig.projectId && !firebaseConfig.projectId.includes("INSERISCI_QUI");
    
    if (isConfigured && typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            markersRef = db.ref("markers");
            isFirebaseOnline = true;
            updateSyncBadge(true, '🟢 Cloud Sincronizzato');
            console.log("🔥 Firebase Realtime Database collegato con successo!");
        } catch (e) {
            console.warn("Impossibile connettere Firebase:", e);
            db = null;
            markersRef = null;
            isFirebaseOnline = false;
            updateSyncBadge(false, '🟡 Modalità Locale');
        }
    } else {
        db = null;
        markersRef = null;
        isFirebaseOnline = false;
        updateSyncBadge(false, '🟡 Modalità Locale');
    }
}

// Aggiorna UI in base allo stato Admin
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
    refreshMarkers();
}

// Inizializzazione Mappa
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        doubleClickZoom: false
    }).setView(FERRARA_COORDS, MAP_ZOOM);

    // Controlli zoom in basso a destra
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Layer mappa standard OpenStreetMap
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

    initFirebase();
    startDataSync();
    updateUI();
}

// --- SINCRONIZZAZIONE DATI (Realtime Database o LocalStorage) ---
function startDataSync() {
    if (markersRef) {
        // Ascolto in tempo reale da Firebase Realtime Database
        markersRef.on("value", (snapshot) => {
            // Svuota i marker attualmente visualizzati
            for (let id in activeLayers) {
                map.removeLayer(activeLayers[id]);
            }
            activeLayers = {};
            markersData = [];

            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach((key) => {
                    const item = data[key];
                    markersData.push({ id: key, ...item });
                    renderMarker(item.lat, item.lng, item.type, key, item.note, item.timestamp);
                });
            }
            updateSyncBadge(true, '🟢 Cloud Sincronizzato');
        }, (error) => {
            console.error("Errore Realtime Database:", error);
            updateSyncBadge(false, '⚠️ Errore Cloud - Uso Locale');
            loadLocalStorageMarkers();
        });
    } else {
        loadLocalStorageMarkers();
    }
}

function loadLocalStorageMarkers() {
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    if (saved) {
        try {
            markersData = JSON.parse(saved);
            markersData.forEach(m => {
                renderMarker(m.lat, m.lng, m.type, m.id, m.note, m.timestamp);
            });
        } catch (e) {
            console.error("Errore caricamento da localStorage", e);
            markersData = [];
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('ferrara_viabilita_markers', JSON.stringify(markersData));
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
        const searchQuery = encodeURIComponent(query + ', Ferrara');
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 17);
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
        createMarkerData(pendingLatLng.lat, pendingLatLng.lng, type, note);
        closeModal();
    });
});

// Crea l'icona custom per Leaflet
function createCustomIcon(type) {
    const config = ICONS[type] || { emoji: '📍', label: 'Segnalazione' };
    return L.divIcon({
        className: 'custom-icon-wrapper',
        html: `<div class="custom-marker ${type}">${config.emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
}

// Aggiungi un nuovo marker al Database o LocalStorage
function createMarkerData(lat, lng, type, note = null) {
    const timestamp = Date.now();
    const markerPayload = {
        lat: lat,
        lng: lng,
        type: type,
        note: note || null,
        timestamp: timestamp
    };

    if (markersRef) {
        // Salvataggio su Firebase Realtime Database
        markersRef.push(markerPayload).catch((err) => {
            console.error("Errore salvataggio marker su Realtime Database:", err);
            alert("Errore nel salvataggio sul cloud. Verificare le regole di Firebase.");
        });
    } else {
        // Salvataggio Locale
        const markerId = timestamp.toString();
        markersData.push({ id: markerId, ...markerPayload });
        saveToLocalStorage();
        renderMarker(lat, lng, type, markerId, note, timestamp);
    }
}

// Rendering grafico del marker sulla mappa
function renderMarker(lat, lng, type, id, note = null, timestamp = null) {
    const markerId = id || Date.now().toString();
    const config = ICONS[type] || { emoji: '📍', label: 'Segnalazione' };
    const dateFormatted = timestamp ? new Date(timestamp).toLocaleString('it-IT') : new Date().toLocaleString('it-IT');

    // Rimuovi eventuale layer precedente con stesso ID
    if (activeLayers[markerId]) {
        map.removeLayer(activeLayers[markerId]);
    }

    const marker = L.marker([lat, lng], {
        icon: createCustomIcon(type)
    }).addTo(map);

    // Contenuto Popup
    let popupContent = `
        <div class="popup-content">
            <h3>${config.label}</h3>
            <span class="popup-date">Segnalato il: ${dateFormatted}</span>
    `;

    if (note) {
        popupContent += `<div class="user-note"><strong>Nota utente:</strong> ${note}</div>`;
    }

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

    // Zoom al doppio click
    marker.on('dblclick', function () {
        if (!isAdmin) {
            map.flyTo([lat, lng], 17);
        }
    });

    // Tooltip al passaggio del mouse
    let tooltipContent = `
        <div class="tooltip-content">
            <strong>${config.label}</strong><br>
            <span>Segnalato il: ${dateFormatted}</span>
    `;
    if (note) {
        tooltipContent += `<br><span class="note-badge">📝 Nota: ${note}</span>`;
    }
    tooltipContent += `</div>`;

    marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -20] });

    activeLayers[markerId] = marker;
}

// Rimuovi marker
window.removeMarker = function (id) {
    if (markersRef) {
        markersRef.child(id).remove().catch(err => {
            console.error("Errore rimozione da Realtime Database:", err);
            alert("Errore durante l'eliminazione dal cloud.");
        });
    } else {
        if (activeLayers[id]) {
            map.removeLayer(activeLayers[id]);
            delete activeLayers[id];
        }
        markersData = markersData.filter(m => m.id !== id);
        saveToLocalStorage();
    }
};

// Aggiungi Nota
window.addNote = function (id) {
    const note = prompt("Inserisci un dettaglio per l'amministratore (es. La strada è stata riaperta):");
    if (note && note.trim() !== "") {
        if (markersRef) {
            markersRef.child(id).update({ note: note }).catch(err => {
                console.error("Errore aggiornamento nota su Realtime Database:", err);
            });
        } else {
            const index = markersData.findIndex(m => m.id === id);
            if (index !== -1) {
                markersData[index].note = note;
                saveToLocalStorage();
                refreshMarkers();
            }
        }
    }
};

// Segnala come Risolto
window.reportResolved = function (id) {
    if (confirm("Vuoi segnalare che questo problema è stato risolto e la strada è libera?")) {
        const marker = markersData.find(m => m.id === id);
        const existingNote = marker ? marker.note : "";
        const updatedNote = existingNote ? `${existingNote} | ✅ Segnalato come RISOLTO` : "✅ Segnalato come RISOLTO";

        if (markersRef) {
            markersRef.child(id).update({ note: updatedNote }).catch(err => {
                console.error("Errore salvataggio risolto su Realtime Database:", err);
            });
        } else {
            const index = markersData.findIndex(m => m.id === id);
            if (index !== -1) {
                markersData[index].note = updatedNote;
                saveToLocalStorage();
                refreshMarkers();
            }
        }
    }
};

// Ridisegna i marker (es. al cambio admin/logout)
function refreshMarkers() {
    for (let id in activeLayers) {
        map.removeLayer(activeLayers[id]);
    }
    activeLayers = {};

    markersData.forEach(m => {
        renderMarker(m.lat, m.lng, m.type, m.id, m.note, m.timestamp);
    });
}

// Avvia l'applicazione
document.addEventListener('DOMContentLoaded', initMap);
