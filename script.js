// Versione del software
const APP_VERSION = '3.5.1';

// Icona SVG per "Divieto di transito con mano sbarrata" (Strada chiusa)
const ICON_STRADA_CHIUSA = '<svg class="sign-hand-barred" viewBox="0 0 32 32" width="22" height="22" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13.5" fill="#ffffff" stroke="#ef4444" stroke-width="2.8"/><g fill="#1e293b"><path d="M10 16c-.6 0-1-.4-1-1 0-.4.2-.8.5-1l1.5-1.2c.4-.3.9-.2 1.2.2.3.4.2.9-.2 1.2l-1 0.8v1z"/><rect x="12" y="10" width="1.8" height="6.5" rx="0.9"/><rect x="14.2" y="8.5" width="1.8" height="8" rx="0.9"/><rect x="16.4" y="9.2" width="1.8" height="7.3" rx="0.9"/><rect x="18.6" y="11" width="1.8" height="5.5" rx="0.9"/><path d="M11 15h9.5c.5 0 1 .4 1 1v1.5c0 2.8-2 5-5.2 5s-5.3-2.2-5.3-5V16c0-.6.5-1 1-1z"/></g><line x1="6.5" y1="6.5" x2="25.5" y2="25.5" stroke="#ef4444" stroke-width="2.8" stroke-linecap="round"/></svg>';

// Icona Immagine per "Sagra / Manifestazione" (Bandiere)
const ICON_SAGRA = '<img src="icon-sagra.png" class="sign-sagra-img" alt="Sagra / Manifestazione" style="width:22px; height:22px; object-fit:contain; vertical-align:middle; display:inline-block;" />';

// Funzione di sanificazione per prevenire attacchi XSS
function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

// --- CONFIGURAZIONE NOTIFICHE ESTERNE (Email & Telegram) ---
const NOTIFICATIONS_CONFIG = {
    email: {
        enabled: true,
        recipient: "stefano.balboni@ausl.fe.it",
        serviceUrl: "https://formsubmit.co/ajax/stefano.balboni@ausl.fe.it"
    },
    telegram: {
        enabled: true,
        // Bot Telegram @viabilita118_bot
        botToken: "8883272765:AAEQGOmpHUaQJwps2QHJgmkGBV2ibcIZw74",
        // ID numerico della chat di Stefano
        chatId: "80379687"
    }
};

// Variabili Firebase
let db = null;
let auth = null;
let markersRef = null;
let reportsRef = null;
let isFirebaseOnline = false;

// Inizializza Firebase (Database + Auth)
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            auth = firebase.auth();
            markersRef = db.ref("markers");
            reportsRef = db.ref("user_reports");
            isFirebaseOnline = true;
            console.log('🔥 Firebase collegato — database e auth attivi');

            // Ascolto dello stato di autenticazione dell'amministratore
            auth.onAuthStateChanged((user) => {
                isAdmin = !!user;
                console.log(`🔐 Stato Auth: ${isAdmin ? 'Amministratore (' + user.email + ')' : 'Utente pubblico'}`);
                if (isAdmin) {
                    initAdminReportsListener();
                } else {
                    stopAdminReportsListener();
                }
                updateUI();
            });
        } else {
            console.warn('⚠️ Firebase SDK non disponibile — modalità locale');
        }
    } catch (e) {
        console.warn('⚠️ Firebase non raggiungibile — modalità locale:', e.message);
        db = null;
        auth = null;
        markersRef = null;
        reportsRef = null;
        isFirebaseOnline = false;
    }
}

// Coordinate di Ferrara
const FERRARA_COORDS = [44.8381, 11.6198];
const MAP_ZOOM = 11;

// Configurazione Icone
const ICONS = {
    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: ICON_STRADA_CHIUSA, label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' },
    mercato: { emoji: '🛒', label: 'Mercato settimanale' },
    semaforo: { emoji: '🚦', label: 'Senso unico alternato' },
    sagra: { emoji: ICON_SAGRA, label: 'Sagra / Manifestazione' }
};

// Stato dell'applicazione
let map;
let markersData = [];
let userReportsData = []; // Segnalazioni ricevute dagli utenti (admin)
let activeLayers = {};
let activeSegments = {}; // Polyline rosse tra marker della stessa via
let pendingLatLng = null;
let isAdmin = false;
let userLocationMarker = null; // Marker posizione GPS dell'utente
let previewReportMarker = null; // Marker di anteprima per le segnalazioni admin

// Stato invio segnalazione utente
let isPickingPointOnMap = false;
let userReportSelectedLocation = null; // { lat, lng, street }
let userReportSelectedType = null;

// Stato Form Admin & Programmazione Temporale
let adminFilter = 'active'; // 'active' | 'upcoming' | 'expired' | 'all'
let editingMarkerId = null; // ID del marker in fase di modifica
let selectedAdminType = 'lavori';
let selectedScheduleMode = 'always'; // 'always' | 'window' | 'recurring'
let selectedRecurringDays = [1, 2, 3, 4, 5]; // Default: Lun-Ven

// Elementi DOM (Admin Markers Modal & Form)
const modalOverlay = document.getElementById('marker-modal');
const closeModalBtn = document.getElementById('close-modal');
const markerModalTitle = document.getElementById('marker-modal-title');
const adminOptionCards = document.querySelectorAll('#admin-options-grid .option-card');
const adminMarkerStreet = document.getElementById('admin-marker-street');
const adminMarkerNote = document.getElementById('admin-marker-note');
const schedTypeBtns = document.querySelectorAll('.sched-type-btn');
const schedWindowBlock = document.getElementById('sched-window-block');
const schedRecurringBlock = document.getElementById('sched-recurring-block');
const adminSchedStart = document.getElementById('admin-sched-start');
const adminSchedEnd = document.getElementById('admin-sched-end');
const adminSchedTimeStart = document.getElementById('admin-sched-time-start');
const adminSchedTimeEnd = document.getElementById('admin-sched-time-end');
const schedDaysPicker = document.getElementById('sched-days-picker');
const adminMarkerError = document.getElementById('admin-marker-error');
const adminSaveMarkerBtn = document.getElementById('admin-save-marker-btn');
const adminCancelMarkerBtn = document.getElementById('admin-cancel-marker-btn');

// Elementi DOM (Admin Auth)
const loginModal = document.getElementById('login-modal');
const loginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('admin-logout-btn');
const closeLoginBtn = document.getElementById('close-login');
const submitLoginBtn = document.getElementById('submit-login');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const headerSubtitle = document.getElementById('header-subtitle');

// Elementi DOM (Admin Ricerca & Filtri)
const searchContainer = document.getElementById('admin-search-container');
const searchInput = document.getElementById('admin-search-input');
const searchBtn = document.getElementById('admin-search-btn');
const filterPills = document.querySelectorAll('.filter-pill');
const filterCountActive = document.getElementById('filter-count-active');
const filterCountUpcoming = document.getElementById('filter-count-upcoming');
const filterCountExpired = document.getElementById('filter-count-expired');
const filterCountAll = document.getElementById('filter-count-all');

// Elementi DOM (Segnalazioni Utente)
const userReportBtn = document.getElementById('user-report-btn');
const userReportModal = document.getElementById('user-report-modal');
const closeUserReportModalBtn = document.getElementById('close-user-report-modal');
const reportLocGpsBtn = document.getElementById('report-loc-gps-btn');
const reportLocMapBtn = document.getElementById('report-loc-map-btn');
const reportStreetSearchInput = document.getElementById('report-street-search-input');
const reportStreetSearchBtn = document.getElementById('report-street-search-btn');
const reportSelectedLocationBox = document.getElementById('report-selected-location');
const reportLocName = document.getElementById('report-loc-name');
const reportLocCoords = document.getElementById('report-loc-coords');
const reportTypePills = document.querySelectorAll('#user-report-types .type-pill');
const reportNoteInput = document.getElementById('report-note-input');
const reportAuthorInput = document.getElementById('report-author-input');
const reportPhoneInput = document.getElementById('report-phone-input');
const userReportError = document.getElementById('user-report-error');
const submitUserReportBtn = document.getElementById('submit-user-report-btn');
const pickerBanner = document.getElementById('picker-banner');
const cancelPickerBtn = document.getElementById('cancel-picker-btn');

// Elementi DOM (Pannello Notifiche Admin)
const adminReportsBtn = document.getElementById('admin-reports-btn');
const adminReportsModal = document.getElementById('admin-reports-modal');
const closeAdminReportsModalBtn = document.getElementById('close-admin-reports-modal');
const adminReportsList = document.getElementById('admin-reports-list');
const reportsBadge = document.getElementById('reports-badge');
const adminReportsCount = document.getElementById('admin-reports-count');

// Mostra un messaggio Toast
function showToast(message, type = 'normal', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-box toast-${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// Aggiorna UI in base allo stato
function updateUI() {
    if (isAdmin) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        searchContainer.classList.remove('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.remove('hidden');
        headerSubtitle.textContent = "Modalità Admin: fai DOPPIO CLICK sulla mappa per aggiungere/programmare una segnalazione";
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        searchContainer.classList.add('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.add('hidden');
        headerSubtitle.textContent = "Modalità Visualizzazione: clicca sui marker per i dettagli";
    }
    // Ridisegna i marker
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
        openMarkerModal(e.latlng);
    });

    // Evento click sulla mappa (per selezione punto da parte dell'utente)
    map.on('click', async function (e) {
        if (isPickingPointOnMap) {
            isPickingPointOnMap = false;
            if (pickerBanner) pickerBanner.classList.add('hidden');

            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            userReportSelectedLocation = { lat, lng, street: null };

            openUserReportModal();
            updateSelectedLocationUI(lat, lng, "Rilevamento via in corso...");

            // Reverse geocoding automatico
            const street = await reverseGeocode(lat, lng);
            if (street) {
                userReportSelectedLocation.street = street;
                updateSelectedLocationUI(lat, lng, street);
            } else {
                updateSelectedLocationUI(lat, lng, "Punto selezionato su mappa");
            }
        }
    });

    const appVersionEl = document.getElementById('app-version');
    if (appVersionEl) {
        appVersionEl.textContent = `Versione ${APP_VERSION}`;
    }
    console.log(`Viabilità Ferrara - Versione ${APP_VERSION}`);

    loadMarkers();
    updateUI();
    initGeolocation();
}

// --- GEOLOCALIZZAZIONE ---

// Rileva se il dispositivo è mobile/touch
function isMobileDevice() {
    return ('ontouchstart' in window) || window.matchMedia('(max-width: 768px)').matches;
}

// Icona "punto blu" pulsante per la posizione utente
function createUserLocationIcon() {
    return L.divIcon({
        className: '',
        html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Centra la mappa sulla posizione GPS
// initialLoad = true  → vista panoramica 30km di raggio (all'apertura su mobile)
// initialLoad = false → zoom ravvicinato 15 (pulsante manuale)
function locateUser(showErrorAlert = true, initialLoad = false) {
    if (!navigator.geolocation) {
        if (showErrorAlert) alert('Il tuo browser non supporta la geolocalizzazione.');
        return;
    }

    const locateBtn = document.getElementById('locate-btn');
    if (locateBtn) {
        locateBtn.classList.add('locating');
        locateBtn.title = 'Ricerca in corso...';
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            if (initialLoad) {
                // Vista panoramica zoomata (+50%): calcola i bounds per un raggio di 5km (diametro 10km)
                // 1° lat ≈ 111 km; 1° lng ≈ 111 * cos(lat) km
                const RADIUS_KM = 5;
                const latDelta = RADIUS_KM / 111;
                const lngDelta = RADIUS_KM / (111 * Math.cos(latitude * Math.PI / 180));
                const bounds = [
                    [latitude - latDelta, longitude - lngDelta],
                    [latitude + latDelta, longitude + lngDelta]
                ];
                map.fitBounds(bounds, { animate: true, duration: 1.5, padding: [20, 20] });
            } else {
                // Zoom ravvicinato per il pulsante manuale
                map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.2 });
            }

            // Aggiorna o crea il marker posizione
            if (userLocationMarker) {
                userLocationMarker.setLatLng([latitude, longitude]);
            } else {
                userLocationMarker = L.marker([latitude, longitude], {
                    icon: createUserLocationIcon(),
                    zIndexOffset: 1000
                }).addTo(map)
                .bindPopup(`
                    <div class="popup-content">
                        <h3>📍 La tua posizione</h3>
                        <span class="popup-date">Precisione: ±${Math.round(accuracy)} m</span>
                    </div>
                `);
            }

            if (locateBtn) {
                locateBtn.classList.remove('locating');
                locateBtn.classList.add('located');
                locateBtn.title = 'Posizione trovata';
            }
        },
        (error) => {
            if (locateBtn) {
                locateBtn.classList.remove('locating', 'located');
                locateBtn.title = 'Vai alla mia posizione';
            }
            if (showErrorAlert) {
                const msg = {
                    1: 'Permesso di geolocalizzazione negato.',
                    2: 'Impossibile determinare la posizione.',
                    3: 'Timeout nella richiesta di posizione.'
                };
                alert(msg[error.code] || 'Errore di geolocalizzazione.');
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
}

// Inizializza la geolocalizzazione all'avvio
function initGeolocation() {
    if (!navigator.geolocation) return;

    // Su mobile: vista panoramica 30km di raggio, senza alert se rifiutato
    if (isMobileDevice()) {
        locateUser(false, true);
    }
}

// Listener pulsante "Vai alla mia posizione" → zoom ravvicinato 15
document.getElementById('locate-btn').addEventListener('click', () => locateUser(true, false));


// Email di sistema usata per l'autenticazione amministratore
const ADMIN_EMAIL = 'admin@viabilitaferrara.it';

loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    if (passwordInput) passwordInput.value = '';
    loginError.classList.add('hidden');
    if (passwordInput) passwordInput.focus();
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.classList.add('hidden');
});

submitLoginBtn.addEventListener('click', attemptLogin);
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
}

async function attemptLogin() {
    const password = passwordInput ? passwordInput.value : '';

    if (!password) {
        loginError.textContent = 'Inserisci la password.';
        loginError.classList.remove('hidden');
        return;
    }

    if (!auth) {
        loginError.textContent = 'Firebase Auth non disponibile al momento.';
        loginError.classList.remove('hidden');
        return;
    }

    submitLoginBtn.disabled = true;
    submitLoginBtn.textContent = 'Verifica in corso...';
    loginError.classList.add('hidden');

    try {
        await auth.signInWithEmailAndPassword(ADMIN_EMAIL, password);
        loginModal.classList.add('hidden');
        if (passwordInput) passwordInput.value = '';
    } catch (error) {
        console.error('Errore autenticazione:', error.code, error.message);
        let errorMsg = 'Password errata!';
        if (error.code === 'auth/user-not-found') {
            errorMsg = `Utente ${ADMIN_EMAIL} non ancora registrato su Firebase. Crealo nella console Firebase con password adminviabilita118.`;
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMsg = 'Password errata!';
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Troppi tentativi falliti. Riprova più tardi.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = 'Errore di connessione di rete.';
        }
        loginError.textContent = errorMsg;
        loginError.classList.remove('hidden');
    } finally {
        submitLoginBtn.disabled = false;
        submitLoginBtn.textContent = 'Accedi';
    }
}

logoutBtn.addEventListener('click', async () => {
    if (auth) {
        try {
            await auth.signOut();
            console.log('Disconnessione completata');
        } catch (e) {
            console.warn('Errore durante il logout:', e.message);
        }
    }
    isAdmin = false;
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
            // Nominatim restituisce road, highway, pedestrian, path, ecc.
            return data.address.road ||
                   data.address.highway ||
                   data.address.pedestrian ||
                   data.address.path ||
                   data.address.footway ||
                   data.address.cycleway ||
                   data.name ||
                   null;
        }
    } catch (e) {
        console.warn('Reverse geocoding non disponibile:', e.message);
    }
    return null;
}

// -------------------------------------------------------
// LOGICA PROGRAMMAZIONE TEMPORALE & VISIBILITÀ MARKER
// -------------------------------------------------------

// Calcola lo stato temporale del marker: 'active' | 'upcoming' | 'expired'
function getMarkerScheduleStatus(m, now = new Date()) {
    if (!m || !m.schedule || m.schedule.mode === 'always' || !m.schedule.mode) {
        return 'active';
    }

    if (m.schedule.mode === 'window') {
        const start = m.schedule.start ? new Date(m.schedule.start) : null;
        const end = m.schedule.end ? new Date(m.schedule.end) : null;

        if (start && now < start) return 'upcoming';
        if (end && now > end) return 'expired';
        return 'active';
    }

    if (m.schedule.mode === 'recurring') {
        const currentDay = now.getDay(); // 0 = Domenica, 1 = Lunedì, ...
        const days = (m.schedule.days || []).map(Number);
        if (days.length > 0 && !days.includes(currentDay)) {
            return 'upcoming';
        }

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let startMinutes = 0;
        if (m.schedule.timeStart) {
            const parts = m.schedule.timeStart.split(':').map(Number);
            startMinutes = parts[0] * 60 + (parts[1] || 0);
        }
        let endMinutes = 24 * 60 - 1;
        if (m.schedule.timeEnd) {
            const parts = m.schedule.timeEnd.split(':').map(Number);
            endMinutes = parts[0] * 60 + (parts[1] || 0);
        }

        if (currentMinutes < startMinutes) return 'upcoming';
        if (currentMinutes > endMinutes) return 'expired';
        return 'active';
    }

    return 'active';
}

// Determina se un marker deve essere mostrato sulla mappa
function isMarkerVisible(m, now = new Date()) {
    const status = getMarkerScheduleStatus(m, now);
    if (!isAdmin) {
        // Gli utenti normali / autisti vedono ESCLUSIVAMENTE gli eventi attivi adesso
        return status === 'active';
    }
    // Per l'amministratore, rispetta il filtro selezionato
    if (adminFilter === 'all') return true;
    if (adminFilter === 'active') return status === 'active';
    if (adminFilter === 'upcoming') return status === 'upcoming';
    if (adminFilter === 'expired') return status === 'expired';
    return status === 'active';
}

// Genera una descrizione leggibile della programmazione temporale
function formatScheduleDescription(schedule) {
    if (!schedule || schedule.mode === 'always' || !schedule.mode) {
        return null;
    }
    if (schedule.mode === 'window') {
        const fmt = (val) => {
            if (!val) return '';
            const d = new Date(val);
            if (isNaN(d.getTime())) return val;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };
        const startStr = fmt(schedule.start);
        const endStr = fmt(schedule.end);
        if (startStr && endStr) return `Dal ${startStr} al ${endStr}`;
        if (startStr) return `A partire dal ${startStr}`;
        if (endStr) return `Fino al ${endStr}`;
    }
    if (schedule.mode === 'recurring') {
        const dayNames = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Gio', 5: 'Ven', 6: 'Sab', 0: 'Dom' };
        const days = (schedule.days || []).map(d => dayNames[d] || d).join(', ');
        const timeStr = `${schedule.timeStart || '00:00'} - ${schedule.timeEnd || '23:59'}`;
        return `Ricorrente (${days || 'Tutti i giorni'}): ore ${timeStr}`;
    }
    return null;
}

// Badge HTML di stato temporale per Popup
function formatScheduleBadge(status) {
    if (status === 'active') {
        return `<span class="popup-schedule-badge active">🟢 Attivo adesso</span>`;
    } else if (status === 'upcoming') {
        return `<span class="popup-schedule-badge upcoming">⏳ In programma</span>`;
    } else if (status === 'expired') {
        return `<span class="popup-schedule-badge expired">⚪ Scaduto / Concluso</span>`;
    }
    return '';
}

// Aggiorna i conteggi dei filtri nell'interfaccia Admin
function updateFilterCounts() {
    const now = new Date();
    let countActive = 0;
    let countUpcoming = 0;
    let countExpired = 0;

    markersData.forEach(m => {
        const s = getMarkerScheduleStatus(m, now);
        if (s === 'active') countActive++;
        else if (s === 'upcoming') countUpcoming++;
        else if (s === 'expired') countExpired++;
    });

    if (filterCountActive) filterCountActive.textContent = countActive;
    if (filterCountUpcoming) filterCountUpcoming.textContent = countUpcoming;
    if (filterCountExpired) filterCountExpired.textContent = countExpired;
    if (filterCountAll) filterCountAll.textContent = markersData.length;
}

// Gestione click sui filtri Admin
filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
        filterPills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        adminFilter = this.getAttribute('data-filter') || 'active';
        refreshMarkers();
    });
});

// -------------------------------------------------------
// GESTIONE MODALE INSERIMENTO & MODIFICA (ADMIN)
// -------------------------------------------------------

function openMarkerModal(latlng = null, markerToEdit = null) {
    pendingLatLng = latlng;
    editingMarkerId = markerToEdit ? (markerToEdit.id || markerToEdit.fbKey) : null;

    if (adminMarkerError) adminMarkerError.classList.add('hidden');

    if (markerToEdit) {
        if (markerModalTitle) markerModalTitle.textContent = "✏️ Modifica Segnalazione (Admin)";
        if (adminSaveMarkerBtn) adminSaveMarkerBtn.textContent = "Salva Modifiche";
        selectedAdminType = markerToEdit.type || 'lavori';
        if (adminMarkerStreet) adminMarkerStreet.value = markerToEdit.street || '';
        if (adminMarkerNote) adminMarkerNote.value = markerToEdit.note || '';

        const sched = markerToEdit.schedule || { mode: 'always' };
        selectedScheduleMode = sched.mode || 'always';
        if (adminSchedStart) adminSchedStart.value = sched.start || '';
        if (adminSchedEnd) adminSchedEnd.value = sched.end || '';
        if (adminSchedTimeStart) adminSchedTimeStart.value = sched.timeStart || '06:00';
        if (adminSchedTimeEnd) adminSchedTimeEnd.value = sched.timeEnd || '14:00';
        selectedRecurringDays = sched.days ? sched.days.map(Number) : [1, 2, 3, 4, 5];
    } else {
        if (markerModalTitle) markerModalTitle.textContent = "Nuova Segnalazione (Admin)";
        if (adminSaveMarkerBtn) adminSaveMarkerBtn.textContent = "Salva Segnalazione";
        selectedAdminType = 'lavori';
        if (adminMarkerStreet) adminMarkerStreet.value = '';
        if (adminMarkerNote) adminMarkerNote.value = '';
        selectedScheduleMode = 'always';
        if (adminSchedStart) adminSchedStart.value = '';
        if (adminSchedEnd) adminSchedEnd.value = '';
        if (adminSchedTimeStart) adminSchedTimeStart.value = '06:00';
        if (adminSchedTimeEnd) adminSchedTimeEnd.value = '14:00';
        selectedRecurringDays = [1, 2, 3, 4, 5];

        // Rileva in automatico la via per precompilare il campo modificabile
        if (latlng) {
            reverseGeocode(latlng.lat, latlng.lng).then(street => {
                if (street && adminMarkerStreet && !adminMarkerStreet.value) {
                    adminMarkerStreet.value = street;
                }
            });
        }
    }

    // Aggiorna selezione tipo
    adminOptionCards.forEach(card => {
        card.classList.toggle('selected', card.getAttribute('data-type') === selectedAdminType);
    });

    // Aggiorna modalità programmazione
    schedTypeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === selectedScheduleMode);
    });
    if (schedWindowBlock) schedWindowBlock.classList.toggle('hidden', selectedScheduleMode !== 'window');
    if (schedRecurringBlock) schedRecurringBlock.classList.toggle('hidden', selectedScheduleMode !== 'recurring');

    // Aggiorna giorni ricorrenti
    if (schedDaysPicker) {
        const dayBtns = schedDaysPicker.querySelectorAll('.day-btn');
        dayBtns.forEach(btn => {
            const dayNum = parseInt(btn.getAttribute('data-day'));
            btn.classList.toggle('selected', selectedRecurringDays.includes(dayNum));
        });
    }

    if (modalOverlay) modalOverlay.classList.remove('hidden');
}

function closeMarkerModal() {
    if (modalOverlay) modalOverlay.classList.add('hidden');
    pendingLatLng = null;
    editingMarkerId = null;
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeMarkerModal);
if (adminCancelMarkerBtn) adminCancelMarkerBtn.addEventListener('click', closeMarkerModal);

if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            closeMarkerModal();
        }
    });
}

// Selezione del Tipo di Problema
adminOptionCards.forEach(card => {
    card.addEventListener('click', function () {
        adminOptionCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedAdminType = this.getAttribute('data-type');
    });
});

// Selezione del Tipo di Programmazione
schedTypeBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        schedTypeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedScheduleMode = this.getAttribute('data-mode');

        if (schedWindowBlock) schedWindowBlock.classList.toggle('hidden', selectedScheduleMode !== 'window');
        if (schedRecurringBlock) schedRecurringBlock.classList.toggle('hidden', selectedScheduleMode !== 'recurring');
    });
});

// Selezione Giorni Ricorrenti
if (schedDaysPicker) {
    const dayBtns = schedDaysPicker.querySelectorAll('.day-btn');
    dayBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const dayNum = parseInt(this.getAttribute('data-day'));
            if (selectedRecurringDays.includes(dayNum)) {
                selectedRecurringDays = selectedRecurringDays.filter(d => d !== dayNum);
                this.classList.remove('selected');
            } else {
                selectedRecurringDays.push(dayNum);
                this.classList.add('selected');
            }
        });
    });
}

// Salvataggio Segnalazione Admin
if (adminSaveMarkerBtn) {
    adminSaveMarkerBtn.addEventListener('click', async () => {
        if (!selectedAdminType) {
            if (adminMarkerError) {
                adminMarkerError.textContent = "Seleziona il tipo di problema.";
                adminMarkerError.classList.remove('hidden');
            }
            return;
        }

        let scheduleObj = { mode: selectedScheduleMode };

        if (selectedScheduleMode === 'window') {
            const startVal = adminSchedStart ? adminSchedStart.value : null;
            const endVal = adminSchedEnd ? adminSchedEnd.value : null;

            if (startVal && endVal && new Date(startVal) > new Date(endVal)) {
                if (adminMarkerError) {
                    adminMarkerError.textContent = "La data di fine deve essere successiva alla data di inizio.";
                    adminMarkerError.classList.remove('hidden');
                }
                return;
            }

            scheduleObj.start = startVal || null;
            scheduleObj.end = endVal || null;
        } else if (selectedScheduleMode === 'recurring') {
            scheduleObj.days = selectedRecurringDays;
            scheduleObj.timeStart = adminSchedTimeStart ? adminSchedTimeStart.value : '06:00';
            scheduleObj.timeEnd = adminSchedTimeEnd ? adminSchedTimeEnd.value : '14:00';
        }

        const customStreet = adminMarkerStreet ? adminMarkerStreet.value.trim() : '';
        const note = adminMarkerNote ? adminMarkerNote.value.trim().slice(0, 500) : null;

        if (editingMarkerId) {
            // Modifica marker esistente
            const markerIdx = markersData.findIndex(m => String(m.id) === String(editingMarkerId) || String(m.fbKey) === String(editingMarkerId));
            if (markerIdx !== -1) {
                const currentMarker = markersData[markerIdx];
                currentMarker.type = selectedAdminType;
                currentMarker.note = note || null;
                currentMarker.schedule = scheduleObj;
                if (customStreet !== '') {
                    currentMarker.street = customStreet;
                }

                if (isFirebaseOnline && markersRef && currentMarker.fbKey) {
                    markersRef.child(currentMarker.fbKey).update({
                        type: selectedAdminType,
                        note: note || null,
                        schedule: scheduleObj,
                        street: currentMarker.street || null
                    }).catch(e => console.warn('Errore aggiornamento Firebase:', e.message));
                }

                saveToLocalStorage();
                closeMarkerModal();
                refreshMarkers();
                updateRoadSegments();
                showToast("✅ Segnalazione modificata con successo!", "success");
            }
        } else {
            // Creazione nuovo marker
            if (!pendingLatLng) {
                closeMarkerModal();
                return;
            }
            const lat = pendingLatLng.lat;
            const lng = pendingLatLng.lng;

            addMarker(lat, lng, selectedAdminType, null, true, note || null, null, customStreet || null, scheduleObj);
            closeMarkerModal();
            showToast("✅ Segnalazione inserita!", "success");

            // Se la via non è stata inserita a mano, rileva automaticamente in background
            if (!customStreet) {
                const street = await reverseGeocode(lat, lng);
                if (street) {
                    const lastMarker = markersData[markersData.length - 1];
                    if (lastMarker) {
                        lastMarker.street = street;
                        if (isFirebaseOnline && markersRef && lastMarker.fbKey) {
                            markersRef.child(lastMarker.fbKey).update({ street: street });
                        }
                        saveToLocalStorage();
                        updateRoadSegments();
                        console.log(`📍 Via rilevata automaticamente: ${street}`);
                    }
                }
            }
        }
    });
}

// Crea l'icona custom per Leaflet con supporto visivo a stati temporali in Admin
function createCustomIcon(type, status = 'active') {
    const config = ICONS[type] || { emoji: '📍', label: 'Segnalazione' };
    const statusClass = (isAdmin && status !== 'active') ? status : '';
    return L.divIcon({
        className: 'custom-icon-wrapper',
        html: `<div class="custom-marker ${type} ${statusClass}">${config.emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
}

// Aggiungi un marker alla mappa
function addMarker(lat, lng, type, id = null, save = true, note = null, fbKey = null, street = null, schedule = null) {
    const markerId = id || Date.now().toString();
    const config = ICONS[type] || { emoji: '📍', label: 'Segnalazione' };
    const ts = parseInt(markerId);
    const date = isNaN(ts) ? new Date().toLocaleString('it-IT') : new Date(ts).toLocaleString('it-IT');

    const markerObj = {
        id: markerId,
        lat,
        lng,
        type,
        note: note || null,
        fbKey: fbKey || null,
        street: street || null,
        schedule: schedule || null
    };

    const status = getMarkerScheduleStatus(markerObj);
    const visible = isMarkerVisible(markerObj);

    if (visible) {
        const marker = L.marker([lat, lng], {
            icon: createCustomIcon(type, status)
        }).addTo(map);

        const safeLabel = escapeHtml(config.label);
        const safeStreet = escapeHtml(street);
        const safeNote = escapeHtml(note);
        const safeId = escapeHtml(markerId);
        const scheduleDesc = formatScheduleDescription(schedule);

        // Contenuto Popup
        let popupContent = `
            <div class="popup-content">
                ${isAdmin ? formatScheduleBadge(status) : ''}
                <h3>${safeLabel}</h3>
                <span class="popup-date">Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
        `;

        if (scheduleDesc) {
            popupContent += `<div class="user-note" style="background:#f8fafc; border-color:#94a3b8;"><strong>⏱️ Orario:</strong> ${escapeHtml(scheduleDesc)}</div>`;
        }

        if (safeStreet) {
            popupContent += `<div class="user-note" style="background:#eff6ff; border-color:#3b82f6;"><strong>📍 Via:</strong> ${safeStreet}</div>`;
        }

        if (safeNote) {
            popupContent += `<div class="user-note"><strong>Nota:</strong> ${safeNote}</div>`;
        }

        if (isAdmin) {
            popupContent += `
                <button class="edit-btn" onclick="editMarker('${safeId}')">✏️ Modifica / Programma</button>
                <button class="delete-btn" onclick="removeMarker('${safeId}')">Risolto / Rimuovi</button>
            `;
        } else {
            if (!note || !note.includes("RISOLTO")) {
                popupContent += `<button class="note-btn" onclick="reportResolved('${safeId}')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); margin-bottom: 8px;">Segnala come risolto</button>`;
            }
            if (!note) {
                popupContent += `<button class="note-btn" onclick="addNote('${safeId}')">Segnala variazione</button>`;
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
                <strong>${safeLabel}</strong><br>
                ${safeStreet ? `<span style="color:#3b82f6; font-weight:600;">📍 ${safeStreet}</span><br>` : ''}
                ${scheduleDesc ? `<span style="color:#64748b;">⏱️ ${escapeHtml(scheduleDesc)}</span><br>` : ''}
                <span>Segnalato il: ${id ? date : new Date().toLocaleString('it-IT')}</span>
        `;
        if (safeNote) {
            tooltipContent += `<br><span class="note-badge">📝 ${safeNote}</span>`;
        }
        tooltipContent += `</div>`;

        marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -20] });

        activeLayers[markerId] = marker;
    }

    if (save) {
        markersData.push(markerObj);
        saveMarkerToFirebase(markerObj);
        saveToLocalStorage();
        updateFilterCounts();
        updateRoadSegments();
    }
}

// Modifica marker (esposta globalmente per il bottone nel popup)
window.editMarker = function (id) {
    const markerObj = markersData.find(m => String(m.id) === String(id) || String(m.fbKey) === String(id));
    if (markerObj) {
        openMarkerModal({ lat: markerObj.lat, lng: markerObj.lng }, markerObj);
    }
};

// Salva un singolo marker su Firebase (se online)
function saveMarkerToFirebase(markerObj) {
    if (!isFirebaseOnline || !markersRef) return;
    const payload = {
        lat: markerObj.lat,
        lng: markerObj.lng,
        type: markerObj.type,
        timestamp: parseInt(markerObj.id) || Date.now(),
        note: markerObj.note || null,
        street: markerObj.street || null,
        schedule: markerObj.schedule || null
    };
    const newRef = markersRef.push(payload);
    markerObj.fbKey = newRef.key;
    saveToLocalStorage();
    console.log('✅ Marker salvato su Firebase:', newRef.key);
}

// Rimuovi marker (esposta globalmente per il bottone nel popup)
window.removeMarker = function (id) {
    const markerObj = markersData.find(m => String(m.id) === String(id) || String(m.fbKey) === String(id));
    const fbKeyToDelete = (markerObj && markerObj.fbKey) ? markerObj.fbKey : id;

    // Rimuovi visivamente subito dalla mappa
    if (activeLayers[id]) {
        map.removeLayer(activeLayers[id]);
        delete activeLayers[id];
    }
    if (markerObj && markerObj.id && activeLayers[markerObj.id]) {
        map.removeLayer(activeLayers[markerObj.id]);
        delete activeLayers[markerObj.id];
    }

    if (isFirebaseOnline && markersRef && fbKeyToDelete) {
        markersRef.child(fbKeyToDelete).remove()
            .then(() => {
                console.log('🗑️ Marker rimosso da Firebase:', fbKeyToDelete);
            })
            .catch(e => {
                console.error('Errore rimozione Firebase:', e);
                alert('Impossibile eliminare da Firebase: ' + e.message + '\n\nAssicurati di aver pubblicato le regole aggiornate sulla console Firebase.');
            });
    }

    markersData = markersData.filter(m => String(m.id) !== String(id) && String(m.fbKey) !== String(id));
    saveToLocalStorage();
    updateFilterCounts();
    updateRoadSegments();
};

// Aggiungi Nota
window.addNote = function (id) {
    let note = prompt("Inserisci un dettaglio per l'amministratore (es. La strada è stata riaperta stamattina):");
    if (note && note.trim() !== "") {
        note = note.trim().slice(0, 500);
        const index = markersData.findIndex(m => String(m.id) === String(id) || String(m.fbKey) === String(id));
        if (index !== -1) {
            markersData[index].note = note;
            const fbKey = markersData[index].fbKey || id;
            if (isFirebaseOnline && markersRef && fbKey) {
                markersRef.child(fbKey).update({ note: note })
                    .catch(e => console.warn('Errore aggiornamento nota Firebase:', e.message));
            }
            saveToLocalStorage();
            refreshMarkers();
        }
    }
};

// Segnala come Risolto
window.reportResolved = function (id) {
    if (confirm("Vuoi segnalare che questo problema è stato risolto e la strada è libera?")) {
        const index = markersData.findIndex(m => String(m.id) === String(id) || String(m.fbKey) === String(id));
        if (index !== -1) {
            const existingNote = markersData[index].note || '';
            let newNote = existingNote
                ? existingNote + " | ✅ Segnalato come RISOLTO"
                : "✅ Segnalato come RISOLTO";
            newNote = newNote.slice(0, 500);
            markersData[index].note = newNote;
            const fbKey = markersData[index].fbKey || id;
            if (isFirebaseOnline && markersRef && fbKey) {
                markersRef.child(fbKey).update({ note: newNote })
                    .catch(e => console.warn('Errore aggiornamento stato Firebase:', e.message));
            }
            saveToLocalStorage();
            refreshMarkers();
        }
    }
};

// -------------------------------------------------------
// GEOMETRIA STRADALE da OpenStreetMap (OSRM Driving Engine)
// Segue fedelmente tutte le curve e i tratti della strada (Statali, Tangenziali e vie cittadine)
// - Cache persistente locale v4 (istantaneo ai successivi caricamenti)
// - Risoluzione tramite motore automobilistico ad alta precisione
// -------------------------------------------------------

let streetGeomCache = {};
try {
    const cached = localStorage.getItem('ferrara_street_cache_v5');
    if (cached) streetGeomCache = JSON.parse(cached);
} catch (e) {
    streetGeomCache = {};
}

function saveStreetGeomCache() {
    try {
        localStorage.setItem('ferrara_street_cache_v5', JSON.stringify(streetGeomCache));
    } catch (e) { }
}

// Normalizza i nomi delle strade per collegare segnalazioni appartenenti alla stessa arteria/statale
function normalizeStreetKey(name) {
    if (!name || typeof name !== 'string') return '';
    let s = name.toLowerCase().trim();
    // Normalizza abbreviazioni di strade statali e provinciali
    s = s.replace(/\bs\.?s\.?\s*16\b/g, 'ss16');
    s = s.replace(/\bs\.?s\.?\s*309\b/g, 'ss309');
    s = s.replace(/\bs\.?s\.?\s*64\b/g, 'ss64');
    s = s.replace(/\bs\.?p\.?\s*/g, 'sp');
    // Rimuovi prefissi generici
    s = s.replace(/^(strada statale|strada provinciale|strada|via|viale|corso|piazza|piazzale|vicolo|largo|borgo)\s+/g, '');
    // Riconoscimento speciale per arterie principali e statali
    if (s.includes('adriatica') || s.includes('ss16')) return 'statale_adriatica';
    if (s.includes('romea') || s.includes('ss309')) return 'statale_romea';
    if (s.includes('porrettana') || s.includes('ss64')) return 'statale_porrettana';
    return s.replace(/[^a-z0-9]/g, '');
}

// Helper per scaricare il tracciato e gli step da endpoint OSRM
async function fetchOsrmRouteWithSteps(url, isReverse = false) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (response.ok) {
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                let coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                if (isReverse) coords = coords.reverse();
                return {
                    coords: coords,
                    distance: route.distance || 0,
                    steps: (route.legs && route.legs[0] && route.legs[0].steps) ? route.legs[0].steps : []
                };
            }
        }
    } catch (e) { }
    return null;
}

// Calcola il percorso reale tra due punti massimizzando la fedeltà alla strada richiesta
// (evita che strade locali come Via Ruffetta vengano deviate erroneamente su provinciali/SP4)
async function routeBetweenPoints(lat1, lng1, lat2, lng2, targetStreetName = '') {
    const normTarget = normalizeStreetKey(targetStreetName);

    // Esegui query concorrenti sui diversi motori e profili
    const candidatesPromises = [
        fetchOsrmRouteWithSteps(`https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`),
        fetchOsrmRouteWithSteps(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`),
        fetchOsrmRouteWithSteps(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`),
        fetchOsrmRouteWithSteps(`https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, true),
        fetchOsrmRouteWithSteps(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, true),
        fetchOsrmRouteWithSteps(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`)
    ];

    const results = (await Promise.all(candidatesPromises)).filter(r => r && r.coords && r.coords.length >= 2);

    if (results.length === 0) {
        return [[lat1, lng1], [lat2, lng2]];
    }

    if (normTarget && normTarget.length >= 3) {
        let bestCandidate = null;
        let maxMatchedDist = -1;
        let bestRatio = -1;

        for (const candidate of results) {
            let matchedDist = 0;
            for (const step of candidate.steps) {
                const normStep = normalizeStreetKey(step.name || '');
                if (normStep && (normStep.includes(normTarget) || normTarget.includes(normStep))) {
                    matchedDist += step.distance;
                }
            }
            const ratio = matchedDist / Math.max(candidate.distance, 1);

            if (matchedDist > maxMatchedDist || (matchedDist === maxMatchedDist && ratio > bestRatio)) {
                maxMatchedDist = matchedDist;
                bestRatio = ratio;
                bestCandidate = candidate;
            }
        }

        if (bestCandidate && maxMatchedDist > 0) {
            return bestCandidate.coords;
        }
    }

    // Se non ci sono nomi corrispondenti, usa il percorso più diretto/corto
    results.sort((a, b) => a.distance - b.distance);
    return results[0].coords;
}

// Recupera la geometria reale dell'intera tratta stradale
async function getStreetGeometry(streetName, markerCoords) {
    const cacheKey = `${normalizeStreetKey(streetName) || streetName.toLowerCase()}_${markerCoords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
    if (streetGeomCache[cacheKey]) {
        return streetGeomCache[cacheKey];
    }

    try {
        let fullRoute = [];
        for (let i = 0; i < markerCoords.length - 1; i++) {
            const [lat1, lng1] = markerCoords[i];
            const [lat2, lng2] = markerCoords[i + 1];
            const segment = await routeBetweenPoints(lat1, lng1, lat2, lng2, streetName);
            if (segment && segment.length >= 2) {
                fullRoute = fullRoute.length > 0 ? fullRoute.concat(segment.slice(1)) : segment;
            }
        }
        if (fullRoute.length >= 2) {
            streetGeomCache[cacheKey] = fullRoute;
            saveStreetGeomCache();
            return fullRoute;
        }
    } catch (e) {
        console.warn('Errore calcolo geometria stradale:', e.message);
    }

    return markerCoords;
}

// Calcola distanza in metri tra due coordinate geografiche (formula Haversine)
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raggio terrestre in metri
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Ordina i punti all'interno di un cluster stradale lungo la traiettoria più naturale
function orderPointsInCluster(pts) {
    if (pts.length <= 2) return pts;
    let maxDist = -1;
    let startIdx = 0;
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const d = calculateDistanceMeters(pts[i][0], pts[i][1], pts[j][0], pts[j][1]);
            if (d > maxDist) {
                maxDist = d;
                startIdx = i;
            }
        }
    }
    const ordered = [pts[startIdx]];
    const unvisited = pts.filter((_, idx) => idx !== startIdx);
    while (unvisited.length > 0) {
        const last = ordered[ordered.length - 1];
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < unvisited.length; i++) {
            const d = calculateDistanceMeters(last[0], last[1], unvisited[i][0], unvisited[i][1]);
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }
        ordered.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    return ordered;
}

// Raggruppa i punti della stessa via in cluster indipendenti se distanti tra loro (> 3.5 km)
function clusterStreetPoints(points, maxDistanceMeters = 3500) {
    if (points.length <= 2) return [points];
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < points.length; i++) {
        if (visited.has(i)) continue;
        const currentCluster = [points[i]];
        visited.add(i);
        const queue = [points[i]];

        while (queue.length > 0) {
            const p1 = queue.shift();
            for (let j = 0; j < points.length; j++) {
                if (!visited.has(j)) {
                    const p2 = points[j];
                    if (calculateDistanceMeters(p1[0], p1[1], p2[0], p2[1]) <= maxDistanceMeters) {
                        visited.add(j);
                        currentCluster.push(p2);
                        queue.push(p2);
                    }
                }
            }
        }
        clusters.push(currentCluster);
    }
    return clusters.map(c => orderPointsInCluster(c));
}

// -------------------------------------------------------
// TRATTI STRADALI ROSSI
// Rendering istantaneo con aggiornamento parallelo fluido
// Include solo marker visibili e attivi, gestendo tratti indipendenti
// -------------------------------------------------------
async function updateRoadSegments() {
    // 1. Raggruppa i marker per via normalizzata (solo quelli visibili e attivi adesso)
    const rawGroups = {};
    markersData.forEach(m => {
        if (!m.street || m.street.trim() === '') return;
        if (!isMarkerVisible(m)) return;
        if (getMarkerScheduleStatus(m) !== 'active') return;

        const normKey = normalizeStreetKey(m.street);
        const key = normKey || m.street.trim().toLowerCase();
        if (!rawGroups[key]) {
            rawGroups[key] = { streetName: m.street.trim(), coords: [] };
        }
        rawGroups[key].coords.push([m.lat, m.lng]);
    });

    // 2. Suddivide ogni via in cluster indipendenti (es. due tratti distinti sulla stessa statale)
    const validSegments = {};
    Object.keys(rawGroups).forEach(key => {
        const group = rawGroups[key];
        const clusters = clusterStreetPoints(group.coords, 3500);
        clusters.forEach((clustCoords, clustIdx) => {
            if (clustCoords.length >= 2) {
                const segKey = `${key}_seg_${clustIdx}`;
                validSegments[segKey] = {
                    streetName: group.streetName,
                    coords: clustCoords
                };
            }
        });
    });

    // 3. Rimuovi le polyline non più presenti
    for (let segKey in activeSegments) {
        if (!validSegments[segKey]) {
            map.removeLayer(activeSegments[segKey]);
            delete activeSegments[segKey];
        }
    }

    // 4. Disegna subito le linee sulla mappa (cache o coordinate dirette)
    const segKeys = Object.keys(validSegments);
    segKeys.forEach(segKey => {
        const segment = validSegments[segKey];
        const cacheKey = `${normalizeStreetKey(segment.streetName) || segment.streetName.toLowerCase()}_${segment.coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
        const initialCoords = streetGeomCache[cacheKey] || segment.coords;

        if (!activeSegments[segKey]) {
            const polyline = L.polyline(initialCoords, {
                color: '#dc2626',
                weight: 5,
                opacity: 1,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(map);

            polyline.bindTooltip(`🔴 ${escapeHtml(segment.streetName)}`, {
                permanent: false,
                direction: 'center',
                className: 'road-segment-tooltip'
            });

            activeSegments[segKey] = polyline;
        } else {
            activeSegments[segKey].setLatLngs(initialCoords);
        }
    });

    // 5. Passo asincrono parallelo: affina il tracciato con le curve reali OSRM
    await Promise.all(segKeys.map(async (segKey) => {
        const segment = validSegments[segKey];
        const routeCoords = await getStreetGeometry(segment.streetName, segment.coords);
        if (routeCoords && routeCoords.length >= 2 && activeSegments[segKey]) {
            activeSegments[segKey].setLatLngs(routeCoords);
        }
    }));
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
                        street: m.street || null,
                        schedule: m.schedule || null
                    };
                    markersData.push(markerObj);
                    addMarker(m.lat, m.lng, m.type, localId, false, m.note || null, fbKey, m.street || null, m.schedule || null);
                });
                saveToLocalStorage();
                console.log(`📍 ${markersData.length} marker caricati/aggiornati in tempo reale da Firebase`);
            }

            updateFilterCounts();
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
                addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null, m.schedule || null);
            });
            console.log(`📍 Caricati ${markersData.length} marker da localStorage (offline)`);
        } catch (e) {
            console.error("Errore nel caricamento dei marker", e);
            markersData = [];
        }
    }
    updateFilterCounts();
    updateRoadSegments();
}

// Ridisegna i marker (es. quando cambia lo stato admin o filtro o timer)
function refreshMarkers() {
    for (let id in activeLayers) {
        map.removeLayer(activeLayers[id]);
    }
    activeLayers = {};

    markersData.forEach(m => {
        addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null, m.schedule || null);
    });

    updateFilterCounts();
    updateRoadSegments();
}

// -------------------------------------------------------
// GESTIONE SEGNALAZIONI UTENTE (Invio Notifiche)
// -------------------------------------------------------

function openUserReportModal() {
    if (userReportModal) {
        userReportModal.classList.remove('hidden');
    }
}

function closeUserReportModal() {
    if (userReportModal) {
        userReportModal.classList.add('hidden');
    }
}

function resetUserReportForm() {
    userReportSelectedLocation = null;
    userReportSelectedType = null;
    if (reportSelectedLocationBox) reportSelectedLocationBox.classList.add('hidden');
    if (reportStreetSearchInput) reportStreetSearchInput.value = '';
    if (reportNoteInput) reportNoteInput.value = '';
    if (reportAuthorInput) reportAuthorInput.value = '';
    if (reportPhoneInput) reportPhoneInput.value = '';
    if (userReportError) userReportError.classList.add('hidden');
    
    reportTypePills.forEach(pill => pill.classList.remove('selected'));
    if (reportLocGpsBtn) reportLocGpsBtn.classList.remove('active');
    if (reportLocMapBtn) reportLocMapBtn.classList.remove('active');
}

function updateSelectedLocationUI(lat, lng, streetName) {
    if (!reportSelectedLocationBox) return;
    reportSelectedLocationBox.classList.remove('hidden');
    if (reportLocName) {
        reportLocName.textContent = streetName ? `📍 ${streetName}` : '📍 Posizione selezionata';
    }
    if (reportLocCoords) {
        reportLocCoords.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

// Apertura modale segnalazione da parte dell'utente
if (userReportBtn) {
    userReportBtn.addEventListener('click', () => {
        resetUserReportForm();
        openUserReportModal();
    });
}

// Chiusura modale segnalazione
if (closeUserReportModalBtn) {
    closeUserReportModalBtn.addEventListener('click', () => {
        closeUserReportModal();
    });
}

if (userReportModal) {
    userReportModal.addEventListener('click', (e) => {
        if (e.target === userReportModal) {
            closeUserReportModal();
        }
    });
}

// Selezione Posizione con GPS
if (reportLocGpsBtn) {
    reportLocGpsBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocalizzazione non supportata dal tuo browser.');
            return;
        }

        reportLocGpsBtn.textContent = '📍 Ricerca GPS in corso...';
        reportLocGpsBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                userReportSelectedLocation = { lat: latitude, lng: longitude, street: null };
                
                reportLocGpsBtn.textContent = '📍 Posizione attuale (GPS)';
                reportLocGpsBtn.disabled = false;
                reportLocGpsBtn.classList.add('active');
                if (reportLocMapBtn) reportLocMapBtn.classList.remove('active');

                updateSelectedLocationUI(latitude, longitude, "Rilevamento via in corso...");

                const street = await reverseGeocode(latitude, longitude);
                if (street) {
                    userReportSelectedLocation.street = street;
                    updateSelectedLocationUI(latitude, longitude, street);
                } else {
                    updateSelectedLocationUI(latitude, longitude, "La tua posizione attuale");
                }
            },
            (error) => {
                reportLocGpsBtn.textContent = '📍 Posizione attuale (GPS)';
                reportLocGpsBtn.disabled = false;
                alert('Impossibile ottenere la posizione GPS: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    });
}

// Selezione Posizione cliccando sulla mappa
if (reportLocMapBtn) {
    reportLocMapBtn.addEventListener('click', () => {
        closeUserReportModal();
        isPickingPointOnMap = true;
        if (pickerBanner) pickerBanner.classList.remove('hidden');
    });
}

// Annulla selezione su mappa
if (cancelPickerBtn) {
    cancelPickerBtn.addEventListener('click', () => {
        isPickingPointOnMap = false;
        if (pickerBanner) pickerBanner.classList.add('hidden');
        openUserReportModal();
    });
}

// Cerca via nella modale segnalazione
if (reportStreetSearchBtn && reportStreetSearchInput) {
    const handleStreetSearch = async () => {
        const query = reportStreetSearchInput.value.trim();
        if (!query) return;

        reportStreetSearchBtn.disabled = true;
        reportStreetSearchBtn.textContent = '...';

        try {
            const searchQuery = encodeURIComponent(query + ', Ferrara');
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                const displayName = data[0].display_name.split(',')[0];

                userReportSelectedLocation = { lat, lng: lon, street: displayName };
                updateSelectedLocationUI(lat, lon, displayName);
                if (reportLocGpsBtn) reportLocGpsBtn.classList.remove('active');
                if (reportLocMapBtn) reportLocMapBtn.classList.remove('active');
            } else {
                alert("Nessuna via trovata a Ferrara con questo nome.");
            }
        } catch (e) {
            console.error("Errore ricerca via:", e);
            alert("Errore durante la ricerca della via.");
        } finally {
            reportStreetSearchBtn.disabled = false;
            reportStreetSearchBtn.textContent = 'Cerca';
        }
    };

    reportStreetSearchBtn.addEventListener('click', handleStreetSearch);
    reportStreetSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleStreetSearch();
        }
    });
}

// Selezione del tipo di problema
reportTypePills.forEach(pill => {
    pill.addEventListener('click', function () {
        reportTypePills.forEach(p => p.classList.remove('selected'));
        this.classList.add('selected');
        userReportSelectedType = this.getAttribute('data-type');
        if (userReportError) userReportError.classList.add('hidden');
    });
});

// Invio effettivo della segnalazione
if (submitUserReportBtn) {
    submitUserReportBtn.addEventListener('click', async () => {
        if (!userReportSelectedLocation) {
            if (userReportError) {
                userReportError.textContent = "Seleziona prima la posizione (GPS, mappa o ricerca via).";
                userReportError.classList.remove('hidden');
            }
            return;
        }

        if (!userReportSelectedType) {
            if (userReportError) {
                userReportError.textContent = "Seleziona il tipo di problema riscontrato.";
                userReportError.classList.remove('hidden');
            }
            return;
        }

        const author = reportAuthorInput ? reportAuthorInput.value.trim().slice(0, 100) : '';
        if (!author) {
            if (userReportError) {
                userReportError.textContent = "Inserisci il tuo Nome e Cognome (campo obbligatorio).";
                userReportError.classList.remove('hidden');
            }
            if (reportAuthorInput) reportAuthorInput.focus();
            return;
        }

        const phone = reportPhoneInput ? reportPhoneInput.value.trim().slice(0, 30) : null;
        const note = reportNoteInput ? reportNoteInput.value.trim().slice(0, 500) : null;

        submitUserReportBtn.disabled = true;
        submitUserReportBtn.textContent = "Invio in corso...";

        const reportData = {
            lat: userReportSelectedLocation.lat,
            lng: userReportSelectedLocation.lng,
            street: userReportSelectedLocation.street || null,
            type: userReportSelectedType,
            note: note || null,
            author: author,
            phone: phone || null,
            timestamp: Date.now(),
            status: 'pending'
        };

        try {
            if (isFirebaseOnline && reportsRef) {
                await reportsRef.push(reportData);
                console.log("📢 Segnalazione inviata con successo a Firebase!");
            } else {
                // Fallback locale in caso di assenza temporanea di rete
                let offlineReports = [];
                try {
                    const cached = localStorage.getItem('ferrara_user_reports_offline');
                    if (cached) offlineReports = JSON.parse(cached);
                } catch (e) { }
                offlineReports.push({ ...reportData, id: 'local_' + Date.now() });
                localStorage.setItem('ferrara_user_reports_offline', JSON.stringify(offlineReports));
                console.log("📢 Segnalazione salvata in cache locale.");
            }

            // Invia notifiche esterne asincrone all'amministratore (Email + Telegram)
            sendEmailNotification(reportData);
            sendTelegramNotification(reportData);

            closeUserReportModal();
            resetUserReportForm();
            showToast("📢 Segnalazione inviata con successo! Sarà revisionata dall'amministratore.", "success", 4500);

        } catch (error) {
            console.error("Errore durante l'invio della segnalazione:", error);
            if (userReportError) {
                userReportError.textContent = "Errore durante l'invio: " + error.message;
                userReportError.classList.remove('hidden');
            }
        } finally {
            submitUserReportBtn.disabled = false;
            submitUserReportBtn.textContent = "Invia Segnalazione";
        }
    });
}

// -------------------------------------------------------
// INOLTRO NOTIFICHE ESTERNE (EMAIL & TELEGRAM)
// -------------------------------------------------------

// Invio notifica email gratuita all'amministratore
async function sendEmailNotification(reportData) {
    if (!NOTIFICATIONS_CONFIG.email.enabled || !NOTIFICATIONS_CONFIG.email.recipient) return;

    try {
        const typeConfig = ICONS[reportData.type] || { label: reportData.type, emoji: '📍' };
        const gmapsLink = `https://www.google.com/maps?q=${reportData.lat},${reportData.lng}`;
        const dateStr = new Date(reportData.timestamp).toLocaleString('it-IT');

        const payload = {
            _subject: `🚨 [Viabilità 118] Segnalazione: ${typeConfig.label} - ${reportData.street || 'Ferrara'}`,
            _template: "table",
            _captcha: "false",
            "Tipo Segnalazione": `${typeConfig.emoji} ${typeConfig.label}`,
            "Indirizzo / Luogo": reportData.street || "Posizione su mappa",
            "Coordinate GPS": `${reportData.lat.toFixed(5)}, ${reportData.lng.toFixed(5)}`,
            "Dettagli / Note": reportData.note || "Nessuna nota aggiuntiva",
            "Segnalato da": reportData.author || "Utente (non specificato)",
            "Telefono / Contatto": reportData.phone || "Non fornito",
            "Data e Ora": dateStr,
            "Mappa Google": gmapsLink
        };

        const res = await fetch(NOTIFICATIONS_CONFIG.email.serviceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log("📧 Notifica email inoltrata a:", NOTIFICATIONS_CONFIG.email.recipient);
        } else {
            console.warn("⚠️ Servizio email risposta:", res.status);
        }
    } catch (err) {
        console.warn("⚠️ Invio notifica email non riuscito (non bloccante):", err.message);
    }
}

// Funzione helper per sanificare il testo inviato a Telegram
function escapeTelegramHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Invio notifica istantanea su Telegram (+393485220435)
async function sendTelegramNotification(reportData) {
    if (!NOTIFICATIONS_CONFIG.telegram.enabled || !NOTIFICATIONS_CONFIG.telegram.botToken || !NOTIFICATIONS_CONFIG.telegram.chatId) {
        return;
    }

    try {
        const typeConfig = ICONS[reportData.type] || { label: reportData.type, emoji: '📍' };
        const gmapsLink = `https://www.google.com/maps?q=${reportData.lat},${reportData.lng}`;
        const dateStr = new Date(reportData.timestamp).toLocaleString('it-IT');

        const safeStreet = escapeTelegramHtml(reportData.street) || 'Posizione indicata su mappa';
        const safeNote = escapeTelegramHtml(reportData.note) || 'Nessuna nota aggiuntiva';
        const safeAuthor = escapeTelegramHtml(reportData.author) || 'Utente / Cittadino';
        const safePhone = escapeTelegramHtml(reportData.phone);
        const safeLabel = escapeTelegramHtml(typeConfig.label);

        const message = `🚨 <b>NUOVA SEGNALAZIONE VIABILITÀ 118</b>\n\n` +
            `🔹 <b>Tipo:</b> ${safeLabel}\n` +
            `📍 <b>Luogo:</b> ${safeStreet}\n` +
            `📝 <b>Note:</b> ${safeNote}\n` +
            `👤 <b>Inviata da:</b> ${safeAuthor}\n` +
            (safePhone ? `📞 <b>Telefono:</b> ${safePhone}\n` : '') +
            `🕒 <b>Data:</b> ${dateStr}\n\n` +
            `🗺️ <a href="${gmapsLink}">Visualizza su Google Maps</a>`;

        const url = `https://api.telegram.org/bot${NOTIFICATIONS_CONFIG.telegram.botToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: NOTIFICATIONS_CONFIG.telegram.chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });

        if (res.ok) {
            console.log("📱 Notifica Telegram inviata con successo!");
        } else {
            const errBody = await res.text();
            console.warn("⚠️ Risposta API Telegram:", res.status, errBody);
        }
    } catch (err) {
        console.warn("⚠️ Invio notifica Telegram non riuscito:", err.message);
    }
}

// -------------------------------------------------------
// GESTIONE NOTIFICHE AMMINISTRATORE
// -------------------------------------------------------

let reportsListenerActive = false;

function initAdminReportsListener() {
    if (!isFirebaseOnline || !reportsRef || reportsListenerActive) return;

    reportsListenerActive = true;
    reportsRef.on('value', (snapshot) => {
        userReportsData = [];
        const data = snapshot.val();

        if (data) {
            Object.entries(data).forEach(([key, val]) => {
                userReportsData.push({
                    id: key,
                    ...val
                });
            });
            // Ordina dalla più recente alla meno recente
            userReportsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }

        updateReportsBadge();
        renderAdminReportsList();
    }, (err) => {
        console.warn("Errore lettura notifiche admin:", err.message);
    });
}

function stopAdminReportsListener() {
    if (reportsRef && reportsListenerActive) {
        reportsRef.off();
        reportsListenerActive = false;
    }
    userReportsData = [];
    updateReportsBadge();
}

function updateReportsBadge() {
    const count = userReportsData.length;
    if (reportsBadge) {
        reportsBadge.textContent = count;
        reportsBadge.classList.toggle('pulse', count > 0);
    }
    if (adminReportsCount) {
        adminReportsCount.textContent = count === 1 ? '1 nuova' : `${count} nuove`;
    }
}

function renderAdminReportsList() {
    if (!adminReportsList) return;

    if (userReportsData.length === 0) {
        adminReportsList.innerHTML = `
            <div class="empty-reports-msg">
                <span>🎉</span>
                <p>Nessuna nuova segnalazione ricevuta dagli utenti.</p>
            </div>
        `;
        return;
    }

    adminReportsList.innerHTML = userReportsData.map(r => {
        const config = ICONS[r.type] || { emoji: '📍', label: 'Segnalazione' };
        const safeType = escapeHtml(config.label);
        const safeEmoji = config.emoji;
        const safeStreet = escapeHtml(r.street);
        const safeNote = escapeHtml(r.note);
        const safeAuthor = escapeHtml(r.author);
        const safePhone = escapeHtml(r.phone);
        const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleString('it-IT') : 'Data non specificata';
        const safeId = escapeHtml(r.id);

        return `
            <div class="report-card" id="card-${safeId}">
                <div class="report-card-header">
                    <div class="report-card-type">
                        <span>${safeEmoji}</span>
                        <strong>${safeType}</strong>
                    </div>
                    <span class="report-card-time">🕒 ${dateStr}</span>
                </div>

                ${safeStreet ? `<span class="report-card-street">📍 ${safeStreet}</span>` : `<span class="report-card-street">📍 Lat: ${r.lat.toFixed(4)}, Lng: ${r.lng.toFixed(4)}</span>`}

                ${safeNote ? `<div class="report-card-note"><strong>Dettagli:</strong> ${safeNote}</div>` : ''}
                ${safeAuthor ? `<div class="report-card-author">👤 Inviato da: <strong>${safeAuthor}</strong>${safePhone ? ` &bull; 📞 <a href="tel:${safePhone}" style="color:#3b82f6; text-decoration:none;">${safePhone}</a>` : ''}</div>` : ''}

                <div class="report-card-actions">
                    <button class="btn-card-view" onclick="previewReportOnMap('${safeId}')">👁️ Mostra su Mappa</button>
                    <button class="btn-card-approve" onclick="approveReport('${safeId}')">✅ Inserisci nella Mappa</button>
                    <button class="btn-card-reject" onclick="rejectReport('${safeId}')">🗑️ Scarta</button>
                </div>
            </div>
        `;
    }).join('');
}

// Mostra la modale notifiche admin
if (adminReportsBtn) {
    adminReportsBtn.addEventListener('click', () => {
        if (adminReportsModal) {
            renderAdminReportsList();
            adminReportsModal.classList.remove('hidden');
        }
    });
}

// Chiudi modale notifiche admin
if (closeAdminReportsModalBtn) {
    closeAdminReportsModalBtn.addEventListener('click', () => {
        if (adminReportsModal) adminReportsModal.classList.add('hidden');
    });
}

if (adminReportsModal) {
    adminReportsModal.addEventListener('click', (e) => {
        if (e.target === adminReportsModal) {
            adminReportsModal.classList.add('hidden');
        }
    });
}

// Mostra anteprima segnalazione su mappa
window.previewReportOnMap = function (reportId) {
    const report = userReportsData.find(r => r.id === reportId);
    if (!report) return;

    if (adminReportsModal) {
        adminReportsModal.classList.add('hidden');
    }

    if (previewReportMarker) {
        map.removeLayer(previewReportMarker);
    }

    map.flyTo([report.lat, report.lng], 17, { animate: true, duration: 1.2 });

    const config = ICONS[report.type] || { emoji: '📍', label: 'Segnalazione' };
    const safeType = escapeHtml(config.label);
    const safeStreet = escapeHtml(report.street);
    const safeNote = escapeHtml(report.note);
    const safeAuthor = escapeHtml(report.author);
    const safePhone = escapeHtml(report.phone);
    const safeId = escapeHtml(report.id);

    previewReportMarker = L.marker([report.lat, report.lng], {
        icon: createCustomIcon(report.type)
    }).addTo(map);

    let popupContent = `
        <div class="popup-content">
            <span style="background:#f59e0b; color:white; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:999px;">🔔 SEGNALAZIONE DA REVISIONARE</span>
            <h3>${config.emoji} ${safeType}</h3>
            ${safeStreet ? `<div class="user-note" style="background:#eff6ff; border-color:#3b82f6;"><strong>📍 Via:</strong> ${safeStreet}</div>` : ''}
            ${safeNote ? `<div class="user-note"><strong>Nota:</strong> ${safeNote}</div>` : ''}
            ${safeAuthor ? `<div class="user-note" style="background:#f8fafc; border-color:#94a3b8;"><strong>👤 Inviato da:</strong> ${safeAuthor}${safePhone ? ` &bull; 📞 <a href="tel:${safePhone}" style="color:#3b82f6; text-decoration:none;">${safePhone}</a>` : ''}</div>` : ''}
            <div style="display:flex; gap:6px; width:100%; margin-top:4px;">
                <button class="primary-btn" style="flex:1; padding:6px; font-size:0.8rem; background:#10b981;" onclick="approveReport('${safeId}')">✅ Inserisci</button>
                <button class="delete-btn" style="flex:1; padding:6px; font-size:0.8rem;" onclick="rejectReport('${safeId}')">🗑️ Scarta</button>
            </div>
        </div>
    `;

    previewReportMarker.bindPopup(popupContent).openPopup();
};

// Approva segnalazione utente e inserisci nella mappa come marker ufficiale
window.approveReport = function (reportId) {
    const report = userReportsData.find(r => r.id === reportId);
    if (!report) return;

    if (previewReportMarker) {
        map.removeLayer(previewReportMarker);
        previewReportMarker = null;
    }

    // Aggiungi subito come marker ufficiale
    addMarker(report.lat, report.lng, report.type, null, true, report.note, null, report.street, report.schedule || null);

    // Rimuovi da user_reports su Firebase
    if (isFirebaseOnline && reportsRef) {
        reportsRef.child(reportId).remove()
            .then(() => {
                console.log("✅ Segnalazione approvata e rimossa dalla coda pendenti:", reportId);
            })
            .catch(e => {
                console.warn("Errore rimozione segnalazione approvata:", e.message);
            });
    }

    userReportsData = userReportsData.filter(r => r.id !== reportId);
    updateReportsBadge();
    renderAdminReportsList();
    showToast("✅ Segnalazione approvata e inserita nella mappa!", "success", 4000);
};

// Scarta / Elimina segnalazione
window.rejectReport = function (reportId) {
    if (!confirm("Vuoi scartare ed eliminare questa segnalazione?")) return;

    if (previewReportMarker) {
        map.removeLayer(previewReportMarker);
        previewReportMarker = null;
    }

    if (isFirebaseOnline && reportsRef) {
        reportsRef.child(reportId).remove()
            .then(() => {
                console.log("🗑️ Segnalazione eliminata:", reportId);
            })
            .catch(e => {
                console.warn("Errore eliminazione segnalazione:", e.message);
            });
    }

    userReportsData = userReportsData.filter(r => r.id !== reportId);
    updateReportsBadge();
    renderAdminReportsList();
    showToast("Segnalazione scartata.", "normal", 3000);
};

// Controllo temporale periodico (ogni 30 secondi): aggiorna automaticamente comparsa e scomparsa delle icone
setInterval(() => {
    refreshMarkers();
}, 30000);

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initMap);

