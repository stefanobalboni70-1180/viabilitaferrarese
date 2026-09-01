// ==========================================
// CONFIGURAZIONE FIREBASE FIRESTORE / REALTIME DB
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
    mercato: { emoji: '🛒', label: 'Mercato settimanale' },
    semaforo: { emoji: '🚦', label: 'Senso unico alternato' }
};

    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: '⛔', label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' },
    mercato: { emoji: '🛒', label: 'Mercato settimanale' },
    semaforo: { emoji: '🚦', label: 'Senso unico alternato' }
};
    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: '⛔', label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' },
    mercato: { emoji: '🛒', label: 'Mercato settimanale' },
    semaforo: { emoji: '🚦', label: 'Senso unico alternato' }

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
let roadSegmentLayers = [];
let pendingLatLng = null;
let isAdmin = sessionStorage.getItem('ferrara_admin') === 'true';
let streetGeocodeCache = {};
let currentRoadUpdateId = 0;

// Stato Geolocalizzazione Dispositivo / Telefono
let userLocationMarker = null;
let userLocationCircle = null;
let userCoords = null;
let isFirstLocationFix = true;

// Helper: fetch con timeout per evitare blocchi da file:// o rete lenta
function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout dopo ' + timeoutMs + 'ms')), timeoutMs)
        )
    ]);
}


// Riferimento a Firebase Realtime Database
let db = null;
let markersRef = null;
let isFirebaseOnline = false;

// Elementi DOM
const modalOverlay = document.getElementById('marker-modal');
const closeModalBtn = document.getElementById('close-modal');
const optionCards = document.querySelectorAll('.option-card');
const streetInput = document.getElementById('marker-street-input');
const streetDetectStatus = document.getElementById('street-detect-status');

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
const locateBtn = document.getElementById('locate-btn');

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
    // Recupera eventuale ultima posizione nota del cellulare per apertura istantanea nella zona dell'utente
    let initialCenter = FERRARA_COORDS;
    let initialZoom = MAP_ZOOM;
    const savedCoords = localStorage.getItem('last_user_coords');
    if (savedCoords) {
        try {
            const parsed = JSON.parse(savedCoords);
            if (Array.isArray(parsed) && parsed.length === 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
                initialCenter = parsed;
                initialZoom = 16;
            }
        } catch (e) {
            console.debug("Errore recupero coordinate salvate:", e);
        }
    }

    map = L.map('map', {
        zoomControl: false,
        doubleClickZoom: false
    }).setView(initialCenter, initialZoom);

    // Controlli zoom in basso a destra
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Layer mappa standard OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Evento Leaflet: posizione trovata nativamente (ottimale per smartphone)
    map.on('locationfound', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const accuracy = e.accuracy;
        userCoords = [lat, lng];
        localStorage.setItem('last_user_coords', JSON.stringify([lat, lng]));

        updateUserLocationMarker(lat, lng, accuracy);

        if (isFirstLocationFix) {
            map.setView([lat, lng], 16);
            isFirstLocationFix = false;
        }

        if (locateBtn) {
            locateBtn.classList.remove('locating');
            locateBtn.classList.add('active');
            locateBtn.title = "Centrato sulla tua posizione";
        }
    });

    map.on('locationerror', function (e) {
        console.warn("Posizione non rilevata automaticamente:", e.message);
        if (locateBtn) {
            locateBtn.classList.remove('locating');
            locateBtn.classList.remove('active');
        }
    });

    // Disattiva stato attivo del pulsante GPS se l'utente trascina manualmente la mappa
    map.on('dragstart', function () {
        if (locateBtn) {
            locateBtn.classList.remove('active');
        }
    });

    // Evento click sul pulsante "La mia posizione"
    if (locateBtn) {
        locateBtn.addEventListener('click', function () {
            locateUser(false);
        });
    }

    // Evento doppio click sulla mappa (solo admin)
    map.on('dblclick', async function (e) {
        if (!isAdmin) return;
        pendingLatLng = e.latlng;
        openModal();

        // Rilevamento automatico della via
        if (streetInput && streetDetectStatus) {
            streetInput.value = "";
            streetInput.placeholder = "Rilevamento via in corso...";
            streetDetectStatus.textContent = "🔍 Rilevamento...";
            streetDetectStatus.style.display = "inline-block";

            const detectedStreet = await reverseGeocodeStreet(e.latlng.lat, e.latlng.lng);
            streetInput.value = detectedStreet;
            streetDetectStatus.textContent = "✅ Rilevata";
        }
    });

    // Adatta la mappa ai cambi di orientamento e ridimensionamento tipici dei cellulari
    window.addEventListener('resize', () => map.invalidateSize());
    window.addEventListener('orientationchange', () => setTimeout(() => map.invalidateSize(), 300));

    initFirebase();
    startDataSync();
    updateUI();

    // Avvia la localizzazione istantanea del cellulare
    startMobileGeolocation();
}

// --- GEOLOCALIZZAZIONE UTENTE (GPS / Coordinate Telefono) ---

function startMobileGeolocation() {
    if (locateBtn) {
        locateBtn.classList.add('locating');
    }

    // 1. Localizzazione nativa Leaflet con setView e watch (specifica per dispositivi mobili)
    map.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
        watch: true
    });

    // 2. Chiamata diretta Geolocation API per risposta immediata su tutti i browser
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                userCoords = [lat, lng];
                localStorage.setItem('last_user_coords', JSON.stringify([lat, lng]));

                updateUserLocationMarker(lat, lng, accuracy);

                if (isFirstLocationFix) {
                    map.setView([lat, lng], 16);
                    isFirstLocationFix = false;
                }

                if (locateBtn) {
                    locateBtn.classList.remove('locating');
                    locateBtn.classList.add('active');
                }
            },
            (error) => {
                console.warn("getCurrentPosition iniziale:", error.message);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
    }
}

function locateUser(isInitial = false) {
    if (!navigator.geolocation) {
        if (!isInitial) {
            alert("La geolocalizzazione non è supportata dal tuo browser o dispositivo.");
        }
        return;
    }

    if (locateBtn) {
        locateBtn.classList.add('locating');
        locateBtn.title = "Localizzazione in corso...";
    }

    // Se abbiamo già le coordinate recenti, centriamo immediatamente la visuale
    if (userCoords) {
        map.flyTo(userCoords, 16, {
            animate: true,
            duration: 1.2
        });
        if (locateBtn) {
            locateBtn.classList.remove('locating');
            locateBtn.classList.add('active');
            locateBtn.title = "Centrato sulla tua posizione";
        }
    }

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            userCoords = [lat, lng];
            localStorage.setItem('last_user_coords', JSON.stringify([lat, lng]));

            updateUserLocationMarker(lat, lng, accuracy);

            map.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.2
            });

            if (locateBtn) {
                locateBtn.classList.remove('locating');
                locateBtn.classList.add('active');
                locateBtn.title = "Centrato sulla tua posizione";
            }
        },
        (error) => {
            console.warn("Geolocalizzazione manuale:", error.message);
            if (locateBtn) {
                locateBtn.classList.remove('locating');
                locateBtn.classList.remove('active');
                locateBtn.title = "La mia posizione";
            }
            if (!isInitial) {
                let errorMsg = "Impossibile rilevare la posizione GPS del dispositivo.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Permesso di geolocalizzazione negato. Abilita la posizione nelle impostazioni del dispositivo o browser.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Segnale GPS non disponibile al momento.";
                } else if (error.code === error.TIMEOUT) {
                    errorMsg = "Tempo di richiesta della posizione scaduto. Riprova.";
                }
                alert(errorMsg);
            }
        },
        geoOptions
    );
}

// Crea o aggiorna il marker con effetto pulsante della posizione dell'utente
function updateUserLocationMarker(lat, lng, accuracy) {
    const customUserIcon = L.divIcon({
        className: 'user-gps-marker-wrapper',
        html: `
            <div class="user-gps-container">
                <div class="user-gps-pulse"></div>
                <div class="user-gps-dot"></div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });

    if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
    } else {
        userLocationMarker = L.marker([lat, lng], {
            icon: customUserIcon,
            zIndexOffset: 1000 // Sempre in primo piano sopra gli altri marker
        }).addTo(map);

        userLocationMarker.bindPopup(`
            <div class="user-location-popup">
                📍 <strong>La tua posizione</strong>
                <span>Precisione GPS: circa ±${Math.round(accuracy || 10)}m</span>
            </div>
        `);
    }

    // Cerchio che illustra il raggio di precisione del GPS
    if (accuracy && accuracy < 2000) {
        if (userLocationCircle) {
            userLocationCircle.setLatLng([lat, lng]);
            userLocationCircle.setRadius(accuracy);
        } else {
            userLocationCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 4'
            }).addTo(map);
            userLocationCircle.bringToBack();
        }
    }
}

// --- REVERSE GEOCODING PER RILEVAMENTO VIA ---
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function reverseGeocodeStreet(lat, lng) {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (streetGeocodeCache[key]) {
        return streetGeocodeCache[key];
    }

    // Rispetta il rate limit di Nominatim (1 req/sec)
    await delay(1100);

    try {
        const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'it'
            }
        }, 5000);
        if (!response.ok) {
            console.warn("Nominatim response not ok:", response.status);
            return "Via non specificata";
        }
        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.pedestrian || addr.cycleway || addr.footway || addr.path || addr.square || addr.neighbourhood || addr.suburb || data.name || "Via non specificata";
            streetGeocodeCache[key] = street;
            return street;
        }
    } catch (err) {
        console.warn("Errore reverse geocoding:", err);
    }
    return "Via non specificata";
}

// Normalizza nome via per confronto e raggruppamento
function normalizeStreet(street) {
    if (!street) return "";
    return street.toLowerCase().trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ");
}

// --- SINCRONIZZAZIONE DATI (Realtime Database o LocalStorage) ---
function startDataSync() {
    if (markersRef) {
        // Ascolto in tempo reale da Firebase Realtime Database
        markersRef.on("value", async (snapshot) => {
            for (let id in activeLayers) {
                map.removeLayer(activeLayers[id]);
            }
            activeLayers = {};
            markersData = [];

            const data = snapshot.val();
            if (data) {
                const keys = Object.keys(data);
                for (const key of keys) {
                    const item = data[key];
                    const markerObj = { id: key, ...item };
                    markersData.push(markerObj);
                    renderMarker(item.lat, item.lng, item.type, key, item.note, item.timestamp, item.street);
                }

                // Risolvi eventuali marker legacy privi di via
                resolveMissingStreets();
            } else {
                updateRoadSegments();
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

async function loadLocalStorageMarkers() {
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    if (saved) {
        try {
            markersData = JSON.parse(saved);
            markersData.forEach(m => {
                renderMarker(m.lat, m.lng, m.type, m.id, m.note, m.timestamp, m.street);
            });
            resolveMissingStreets();
        } catch (e) {
            console.error("Errore caricamento da localStorage", e);
            markersData = [];
            updateRoadSegments();
        }
    } else {
        updateRoadSegments();
    }
}

// Risolve la via per segnalazioni storiche che non avevano il campo salvato
async function resolveMissingStreets() {
    let hasResolved = false;
    for (let m of markersData) {
        if (!m.street || m.street === "Via non specificata") {
            const street = await reverseGeocodeStreet(m.lat, m.lng);
            if (street && street !== "Via non specificata") {
                m.street = street;
                hasResolved = true;
                if (markersRef && m.id) {
                    markersRef.child(m.id).update({ street: street }).catch(() => {});
                }
            }
        }
    }
    if (hasResolved && !markersRef) {
        saveToLocalStorage();
    }
    updateRoadSegments();
}

function saveToLocalStorage() {
    localStorage.setItem('ferrara_viabilita_markers', JSON.stringify(markersData));
}

// --- LOGICA TRACCIAMENTO TRATTI ROSSI SULLA STESSA VIA ---

// Calcola la distanza in linea d'aria in metri tra due coordinate geografiche (formula di Haversine)
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // raggio terrestre medio in metri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calcola la distanza cumulativa in linea retta tra una sequenza di marker
function getDirectMarkersDistance(markers) {
    let total = 0;
    for (let i = 0; i < markers.length - 1; i++) {
        total += getHaversineDistance(markers[i].lat, markers[i].lng, markers[i + 1].lat, markers[i + 1].lng);
    }
    return total;
}

// Ordina una serie di punti geografici in sequenza lungo la strada (distanza minima consecutiva)
function sortPointsAlongRoute(markers) {
    if (markers.length <= 2) return markers;

    let remaining = [...markers];
    let sorted = [];

    // Trova il punto iniziale (latitudine minima)
    let firstIdx = 0;
    for (let i = 1; i < remaining.length; i++) {
        if (remaining[i].lat < remaining[firstIdx].lat) {
            firstIdx = i;
        }
    }
    sorted.push(remaining.splice(firstIdx, 1)[0]);

    // Costruisce la catena del vicino più prossimo per collegare i punti nel percorso più breve
    while (remaining.length > 0) {
        const current = sorted[sorted.length - 1];
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const d = Math.hypot(remaining[i].lat - current.lat, remaining[i].lng - current.lng);
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }
        sorted.push(remaining.splice(nearestIdx, 1)[0]);
    }
    return sorted;
}

// Disegna la polilinea rossa solida e netta (senza sfumatura)
function drawRedRoadLine(latLngs, streetName, markerCount) {
    const layerGroup = L.layerGroup();

    // Linea rossa solida e netta
    const mainLine = L.polyline(latLngs, {
        color: '#dc2626',
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'road-segment-main'
    });

    const tooltipText = `⛔ <strong>${streetName}</strong><br>Tratto con ${markerCount} segnalazioni`;
    mainLine.bindTooltip(tooltipText, {
        sticky: true,
        className: 'road-tooltip'
    });

    layerGroup.addLayer(mainLine);
    layerGroup.addTo(map);

    // Mantieni la linea sotto ai marker
    mainLine.bringToBack();

    roadSegmentLayers.push(layerGroup);
}

// Aggiorna i segmenti stradali per tutte le vie con 2 o più icone
async function updateRoadSegments() {
    const updateId = ++currentRoadUpdateId;

    // Rimuovi layer precedenti
    roadSegmentLayers.forEach(layer => map.removeLayer(layer));
    roadSegmentLayers = [];

    // Raggruppa i marker per via normalizzata
    const streetGroups = {};
    markersData.forEach(marker => {
        if (!marker.street || marker.street.trim() === "" || marker.street === "Via non specificata") return;
        const norm = normalizeStreet(marker.street);
        if (!streetGroups[norm]) {
            streetGroups[norm] = {
                displayName: marker.street,
                markers: []
            };
        }
        streetGroups[norm].markers.push(marker);
    });

    // Per ogni gruppo con almeno 2 icone, calcola la distanza più corta ed evidenzia esclusivamente quel tratto
    for (const normKey in streetGroups) {
        if (updateId !== currentRoadUpdateId) return; // annulla se è intervenuto un nuovo update

        const group = streetGroups[normKey];
        if (group.markers.length >= 2) {
            const sortedMarkers = sortPointsAlongRoute(group.markers);
            const directDist = getDirectMarkersDistance(sortedMarkers);
            const straightLatLngs = sortedMarkers.map(m => [m.lat, m.lng]);

            const coordsStr = sortedMarkers.map(m => `${m.lng},${m.lat}`).join(';');
            const footUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coordsStr}?overview=full&geometries=geojson`;
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

            let chosenLatLngs = straightLatLngs;

            try {
                // Tentativo 1: router pedonale OSM (privo di vincoli di sensi unici automobilistici)
                let res = await fetchWithTimeout(footUrl, {}, 3500).catch(() => null);
                let json = res && res.ok ? await res.json() : null;

                // Tentativo 2: OSRM di fallback
                if (!json || !json.routes || json.routes.length === 0) {
                    res = await fetchWithTimeout(osrmUrl, {}, 3500).catch(() => null);
                    json = res && res.ok ? await res.json() : null;
                }

                if (updateId !== currentRoadUpdateId) return;

                if (json && json.routes && json.routes.length > 0 && json.routes[0].geometry) {
                    const route = json.routes[0];
                    const routeDist = route.distance;

                    // Se il percorso restituito dal navigatore fa un giro largo su altre vie (distanza > 35% di quella diretta),
                    // rifiutiamo la deviazione e utilizziamo il collegamento più corto diretto tra i punti di quella specifica via.
                    const maxAllowedDistance = Math.max(directDist * 1.35, directDist + 30);

                    if (routeDist <= maxAllowedDistance && route.geometry.coordinates.length > 1) {
                        chosenLatLngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
                    } else {
                        // Deviazione su altre strade evitata: usiamo la distanza diretta più corta
                        chosenLatLngs = straightLatLngs;
                    }
                }
            } catch (err) {
                console.warn("Routing non disponibile per " + group.displayName + ", uso collegamento diretto più corto:", err);
                chosenLatLngs = straightLatLngs;
            }

            if (updateId === currentRoadUpdateId) {
                drawRedRoadLine(chosenLatLngs, group.displayName, group.markers.length);
            }
        }
    }
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
        const street = streetInput ? streetInput.value.trim() : null;
        createMarkerData(pendingLatLng.lat, pendingLatLng.lng, type, note, street);
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
function createMarkerData(lat, lng, type, note = null, street = null) {
    const timestamp = Date.now();
    const markerPayload = {
        lat: lat,
        lng: lng,
        type: type,
        note: note || null,
        street: street || null,
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
        renderMarker(lat, lng, type, markerId, note, timestamp, street);
        updateRoadSegments();
    }
}

// Rendering grafico del marker sulla mappa
function renderMarker(lat, lng, type, id, note = null, timestamp = null, street = null) {
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
            ${street ? `<div class="popup-street">📍 ${street}</div>` : ''}
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
            ${street ? `<div class="tooltip-street">📍 ${street}</div>` : ''}
            <strong>${config.label}</strong>
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
        updateRoadSegments();
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
        renderMarker(m.lat, m.lng, m.type, m.id, m.note, m.timestamp, m.street);
    });

    updateRoadSegments();
}

// Avvia l'applicazione
document.addEventListener('DOMContentLoaded', initMap);
