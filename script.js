// Versione del software
const APP_VERSION = '1.6';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDRUq7PoqE2GxlZhui3Gm_305t5V-7ibpI",
    authDomain: "viabilita-ferrarese-a7b75.firebaseapp.com",
    databaseURL: "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "viabilita-ferrarese-a7b75",
    storageBucket: "viabilita-ferrarese-a7b75.firebasestorage.app",
    messagingSenderId: "470647422268",
    appId: "1:470647422268:web:0d9286b851d14473007239"
};

// Variabili Firebase
let db = null;
let markersRef = null;
let isFirebaseOnline = false;

// Inizializza Firebase (con fallback silenzioso se non disponibile)
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            markersRef = db.ref("markers");
            isFirebaseOnline = true;
            console.log('🔥 Firebase collegato — dati in tempo reale attivi');
        } else {
            console.warn('⚠️ Firebase SDK non disponibile — modalità locale');
        }
    } catch (e) {
        console.warn('⚠️ Firebase non raggiungibile — modalità locale:', e.message);
        db = null;
        markersRef = null;
        isFirebaseOnline = false;
    }
}

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
let activeSegments = {}; // Polyline rosse tra marker della stessa via
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
    // Prima inizializza Firebase
    initFirebase();

    map = L.map('map', {
        zoomControl: false,
        doubleClickZoom: false
    }).setView(FERRARA_COORDS, MAP_ZOOM);

    // Aggiungi controlli zoom in basso a destra
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

    const appVersionEl = document.getElementById('app-version');
    if (appVersionEl) {
        appVersionEl.textContent = `v${APP_VERSION}`;
    }
    console.log(`Viabilità Ferrara - Versione ${APP_VERSION}`);

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

// Reverse Geocoding: rileva automaticamente il nome della via dalle coordinate
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data && data.address) {
            // Nominatim restituisce road, pedestrian, path, ecc.
            return data.address.road ||
                   data.address.pedestrian ||
                   data.address.path ||
                   data.address.footway ||
                   null;
        }
    } catch (e) {
        console.warn('Reverse geocoding non disponibile:', e.message);
    }
    return null;
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
    card.addEventListener('click', async function () {
        if (!pendingLatLng) return;

        const type = this.getAttribute('data-type');
        const lat = pendingLatLng.lat;
        const lng = pendingLatLng.lng;

        // Chiede solo la nota (opzionale) — la via viene rilevata in automatico
        let note = prompt("Inserisci una nota per questa segnalazione (opzionale):");
        if (!note || note.trim() === "") {
            note = null;
        }

        // Aggiunge il marker subito (senza via, per non bloccare l'utente)
        addMarker(lat, lng, type, null, true, note, null, null);
        closeModal();

        // Rileva la via in background tramite reverse geocoding
        const street = await reverseGeocode(lat, lng);
        if (street) {
            // Aggiorna l'ultimo marker inserito con il nome della via
            const lastMarker = markersData[markersData.length - 1];
            if (lastMarker) {
                lastMarker.street = street;
                // Aggiorna Firebase
                if (isFirebaseOnline && markersRef && lastMarker.fbKey) {
                    markersRef.child(lastMarker.fbKey).update({ street: street });
                }
                saveToLocalStorage();
                updateRoadSegments();
                console.log(`📍 Via rilevata automaticamente: ${street}`);
            }
        }
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
// street: nome della via (opzionale), usato per disegnare i tratti rossi
function addMarker(lat, lng, type, id = null, save = true, note = null, fbKey = null, street = null) {
    const markerId = id || Date.now().toString();
    const config = ICONS[type];
    const ts = parseInt(markerId);
    const date = isNaN(ts) ? new Date().toLocaleString('it-IT') : new Date(ts).toLocaleString('it-IT');

    const marker = L.marker([lat, lng], {
        icon: createCustomIcon(type)
    }).addTo(map);

    // Contenuto Popup
    let popupContent = `
        <div class="popup-content">
            <h3>${config.label}</h3>
            <span class="popup-date">Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
    `;

    if (street) {
        popupContent += `<div class="user-note" style="background:#eff6ff; border-color:#3b82f6;"><strong>📍 Via:</strong> ${street}</div>`;
    }

    if (note) {
        popupContent += `<div class="user-note"><strong>Nota:</strong> ${note}</div>`;
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

    // Zoom al doppio click sull'icona
    marker.on('dblclick', function () {
        if (!isAdmin) {
            map.flyTo([lat, lng], 17);
        }
    });

    // Tooltip al passaggio del mouse
    let tooltipContent = `
        <div class="tooltip-content">
            <strong>${config.label}</strong><br>
            ${street ? `<span style="color:#3b82f6; font-weight:600;">📍 ${street}</span><br>` : ''}
            <span>Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
    `;
    if (note) {
        tooltipContent += `<br><span class="note-badge">📝 ${note}</span>`;
    }
    tooltipContent += `</div>`;

    marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -20] });

    activeLayers[markerId] = marker;

    if (save) {
        const markerObj = { id: markerId, lat, lng, type, note: note, fbKey: fbKey, street: street };
        markersData.push(markerObj);
        saveMarkerToFirebase(markerObj);
        saveToLocalStorage();
        // Aggiorna i tratti rossi dopo aver aggiunto
        updateRoadSegments();
    }
}

// Salva un singolo marker su Firebase (se online)
function saveMarkerToFirebase(markerObj) {
    if (!isFirebaseOnline || !markersRef) return;
    const payload = {
        lat: markerObj.lat,
        lng: markerObj.lng,
        type: markerObj.type,
        timestamp: parseInt(markerObj.id),
        note: markerObj.note || null,
        street: markerObj.street || null
    };
    const newRef = markersRef.push(payload);
    markerObj.fbKey = newRef.key;
    saveToLocalStorage();
    console.log('✅ Marker salvato su Firebase:', newRef.key);
}

// Rimuovi marker (esposta globalmente per il bottone nel popup)
window.removeMarker = function (id) {
    const markerObj = markersData.find(m => m.id === id);

    if (activeLayers[id]) {
        map.removeLayer(activeLayers[id]);
        delete activeLayers[id];
    }

    if (isFirebaseOnline && markersRef && markerObj && markerObj.fbKey) {
        markersRef.child(markerObj.fbKey).remove()
            .then(() => console.log('🗑️ Marker rimosso da Firebase:', markerObj.fbKey))
            .catch(e => console.warn('Errore rimozione Firebase:', e.message));
    }

    markersData = markersData.filter(m => m.id !== id);
    saveToLocalStorage();
    // Aggiorna i tratti rossi dopo la rimozione
    updateRoadSegments();
}

// Aggiungi Nota
window.addNote = function (id) {
    const note = prompt("Inserisci un dettaglio per l'amministratore (es. La strada è stata riaperta stamattina):");
    if (note && note.trim() !== "") {
        const index = markersData.findIndex(m => m.id === id);
        if (index !== -1) {
            markersData[index].note = note;
            if (isFirebaseOnline && markersRef && markersData[index].fbKey) {
                markersRef.child(markersData[index].fbKey).update({ note: note });
            }
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
            const newNote = existingNote
                ? existingNote + " | ✅ Segnalato come RISOLTO"
                : "✅ Segnalato come RISOLTO";
            markersData[index].note = newNote;
            if (isFirebaseOnline && markersRef && markersData[index].fbKey) {
                markersRef.child(markersData[index].fbKey).update({ note: newNote });
            }
            saveToLocalStorage();
            refreshMarkers();
        }
    }
}

// -------------------------------------------------------
// GEOMETRIA STRADALE da OpenStreetMap tramite Overpass API
// Restituisce le coordinate esatte della strada per nome
// (segue la strada, non calcola un percorso di navigazione)
// -------------------------------------------------------

// Collega segmenti OSM (ways) adiacenti in un unico percorso ordinato
function connectWays(ways, nodeCoords) {
    if (ways.length === 0) return [];
    if (ways.length === 1) {
        return ways[0].nodes.map(id => nodeCoords[id]).filter(Boolean);
    }

    // Concatena i segmenti abbinando gli endpoint
    let chain = [...ways[0].nodes];
    const remaining = [...ways.slice(1)];

    while (remaining.length > 0) {
        const tail = chain[chain.length - 1];
        const head = chain[0];
        let matched = false;

        for (let i = 0; i < remaining.length; i++) {
            const w = remaining[i];
            const wHead = w.nodes[0];
            const wTail = w.nodes[w.nodes.length - 1];

            if (wHead === tail) {
                chain = chain.concat(w.nodes.slice(1));
            } else if (wTail === tail) {
                chain = chain.concat([...w.nodes].reverse().slice(1));
            } else if (wHead === head) {
                chain = [...w.nodes].reverse().slice(0, -1).concat(chain);
            } else if (wTail === head) {
                chain = [...w.nodes].slice(0, -1).concat(chain);
            } else {
                continue;
            }
            remaining.splice(i, 1);
            matched = true;
            break;
        }
        if (!matched) break; // segmenti non connessi → interrompe
    }

    return chain.map(id => nodeCoords[id]).filter(Boolean);
}

// Recupera la geometria reale della strada tramite Overpass API
// Fallback: OSRM routing se Overpass non risponde
async function getStreetGeometry(streetName, markerCoords) {
    try {
        // Bounding box intorno ai marker con padding
        const lats = markerCoords.map(c => c[0]);
        const lngs = markerCoords.map(c => c[1]);
        const pad = 0.02; // ~2km di margine attorno ai marker
        const s = (Math.min(...lats) - pad).toFixed(6);
        const w = (Math.min(...lngs) - pad).toFixed(6);
        const n = (Math.max(...lats) + pad).toFixed(6);
        const e = (Math.max(...lngs) + pad).toFixed(6);

        const query = `[out:json][timeout:10];way["name"="${streetName}"](${s},${w},${n},${e});(._;>;);out body;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await response.json();

        // Mappa ID nodo → [lat, lon]
        const nodeCoords = {};
        data.elements.filter(el => el.type === 'node').forEach(n => {
            nodeCoords[n.id] = [n.lat, n.lon];
        });

        const ways = data.elements.filter(el => el.type === 'way');
        if (ways.length === 0) {
            console.warn(`Nessuna via trovata su OSM per: "${streetName}" — uso OSRM come fallback`);
            return null; // fallback a OSRM
        }

        const path = connectWays(ways, nodeCoords);
        console.log(`🗺️ Geometria OSM ottenuta per "${streetName}": ${path.length} nodi`);
        return path.length >= 2 ? path : null;

    } catch (e) {
        console.warn(`Overpass non disponibile per "${streetName}":`, e.message);
        return null; // fallback a OSRM
    }
}

// OSRM: usato solo come fallback se Overpass non risponde
async function getRouteGeometryFallback(lat1, lng1, lat2, lng2) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        }
    } catch (e) {
        console.warn('OSRM fallback non disponibile:', e.message);
    }
    return [[lat1, lng1], [lat2, lng2]]; // linea retta come ultimo resort
}

// -------------------------------------------------------
// TRATTI STRADALI ROSSI (geometria reale da OSM)
// Per ogni via con ≥2 marker, disegna il tracciato esatto
// -------------------------------------------------------
async function updateRoadSegments() {
    // 1. Rimuovi le vecchie polyline dalla mappa
    for (let streetName in activeSegments) {
        map.removeLayer(activeSegments[streetName]);
    }
    activeSegments = {};

    // 2. Raggruppa i marker per nome via
    const groups = {};
    markersData.forEach(m => {
        if (!m.street || m.street.trim() === '') return;
        const key = m.street.trim().toLowerCase();
        if (!groups[key]) {
            groups[key] = { streetName: m.street.trim(), coords: [] };
        }
        groups[key].coords.push([m.lat, m.lng]);
    });

    // 3. Per ogni gruppo con ≥2 marker, ottieni il tracciato della strada
    for (let key in groups) {
        const group = groups[key];
        if (group.coords.length < 2) continue;

        // Prima prova: geometria esatta da OSM (Overpass)
        let routeCoords = await getStreetGeometry(group.streetName, group.coords);

        // Fallback: OSRM routing tra coppie consecutive
        if (!routeCoords) {
            let fullRoute = [];
            for (let i = 0; i < group.coords.length - 1; i++) {
                const [lat1, lng1] = group.coords[i];
                const [lat2, lng2] = group.coords[i + 1];
                const segment = await getRouteGeometryFallback(lat1, lng1, lat2, lng2);
                fullRoute = fullRoute.length > 0
                    ? fullRoute.concat(segment.slice(1))
                    : segment;
            }
            routeCoords = fullRoute;
        }

        if (!routeCoords || routeCoords.length < 2) continue;

        const polyline = L.polyline(routeCoords, {
            color: '#dc2626',
            weight: 5,
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(map);

        polyline.bindTooltip(`🔴 ${group.streetName}`, {
            permanent: false,
            direction: 'center',
            className: 'road-segment-tooltip'
        });

        activeSegments[key] = polyline;
    }

    console.log(`🔴 Tratti aggiornati: ${Object.keys(activeSegments).length} via/e`);
}

// Local Storage (cache locale / fallback offline)
function saveToLocalStorage() {
    localStorage.setItem('ferrara_viabilita_markers', JSON.stringify(markersData));
}

// Carica marker: da Firebase se online con aggiornamento in TEMPO REALE,
// altrimenti fallback a localStorage
function loadMarkers() {
    if (isFirebaseOnline && markersRef) {
        // .on('value') rimane in ascolto continuo: ogni modifica su Firebase
        // aggiorna automaticamente la mappa su tutti i dispositivi connessi
        markersRef.on('value', function (snapshot) {
            markersData = [];
            for (let id in activeLayers) {
                map.removeLayer(activeLayers[id]);
            }
            activeLayers = {};

            const data = snapshot.val();
            if (data) {
                Object.entries(data).forEach(([fbKey, m]) => {
                    const localId = m.timestamp ? m.timestamp.toString() : fbKey;
                    const markerObj = {
                        id: localId,
                        lat: m.lat,
                        lng: m.lng,
                        type: m.type,
                        note: m.note || null,
                        fbKey: fbKey,
                        street: m.street || null
                    };
                    markersData.push(markerObj);
                    addMarker(m.lat, m.lng, m.type, localId, false, m.note || null, fbKey, m.street || null);
                });
                saveToLocalStorage();
                console.log(`📍 ${markersData.length} marker caricati/aggiornati in tempo reale da Firebase`);
            }

            // Ridisegna i tratti stradali rossi dopo ogni aggiornamento
            updateRoadSegments();

        }, function (error) {
            console.warn('Firebase read error, fallback locale:', error.message);
            loadFromLocalStorage();
        });
    } else {
        loadFromLocalStorage();
    }
}

// Carica i marker dal localStorage (fallback offline)
function loadFromLocalStorage() {
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    if (saved) {
        try {
            markersData = JSON.parse(saved);
            markersData.forEach(m => {
                addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null);
            });
            console.log(`📍 Caricati ${markersData.length} marker da localStorage (offline)`);
        } catch (e) {
            console.error("Errore nel caricamento dei marker", e);
            markersData = [];
        }
    }
    updateRoadSegments();
}

// Ridisegna i marker (es. quando cambia lo stato admin)
function refreshMarkers() {
    for (let id in activeLayers) {
        map.removeLayer(activeLayers[id]);
    }
    activeLayers = {};

    markersData.forEach(m => {
        addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null);
    });

    // Ridisegna anche i tratti rossi
    updateRoadSegments();
}

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initMap);
