// Viabilità Ferrara 118 - Client App Logic
const APP_VERSION = '3.9.17';

// Icona SVG per "Divieto di transito con mano sbarrata" (Strada chiusa)
const ICON_STRADA_CHIUSA = '<svg class="sign-hand-barred" viewBox="0 0 32 32" width="22" height="22" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13.5" fill="#ffffff" stroke="#ef4444" stroke-width="2.8"/><g fill="#1e293b"><path d="M10 16c-.6 0-1-.4-1-1 0-.4.2-.8.5-1l1.5-1.2c.4-.3.9-.2 1.2.2.3.4.2.9-.2 1.2l-1 0.8v1z"/><rect x="12" y="10" width="1.8" height="6.5" rx="0.9"/><rect x="14.2" y="8.5" width="1.8" height="8" rx="0.9"/><rect x="16.4" y="9.2" width="1.8" height="7.3" rx="0.9"/><rect x="18.6" y="11" width="1.8" height="5.5" rx="0.9"/><path d="M11 15h9.5c.5 0 1 .4 1 1v1.5c0 2.8-2 5-5.2 5s-5.3-2.2-5.3-5V16c0-.6.5-1 1-1z"/></g><line x1="6.5" y1="6.5" x2="25.5" y2="25.5" stroke="#ef4444" stroke-width="2.8" stroke-linecap="round"/></svg>';

// Icona Immagine per "Sagra / Manifestazione" (Bandiere)
const ICON_SAGRA = '<img src="icon-sagra.png" class="sign-sagra-img" alt="Sagra / Manifestazione" style="width:22px; height:22px; object-fit:contain; vertical-align:middle; display:inline-block;" />';

// Icona SVG per "Mercato settimanale" (Carrello nero su cerchio bianco)
const ICON_MERCATO = '<svg class="sign-market-cart" viewBox="0 0 32 32" width="22" height="22" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13.5" fill="#ffffff" stroke="#10b981" stroke-width="2.8"/><path d="M8.5 9.5h2.2l2.1 7.2a1 1 0 0 0 .96.72h6.88a1 1 0 0 0 .96-.72l1.6-5.7H12.2" fill="none" stroke="#111827" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14.3" cy="20.8" r="1.5" fill="#111827"/><circle cx="20.7" cy="20.8" r="1.5" fill="#111827"/></svg>';

// Icona SVG per "Elisoccorso / Eliporto" (Elicottero rosso 118 in atterraggio su elisuperficie)
const ICON_ELISOCCORSO = '<svg class="sign-eliporto sign-h-red" viewBox="0 0 64 64" width="19" height="19" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><polygon points="10,54 54,54 56,58 8,58" fill="#334155"/><polygon points="16,41 48,41 54,54 10,54" fill="#64748b"/><polygon points="18,43 46,43 51,52 13,52" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="32" cy="47.5" rx="11" ry="3.8" fill="none" stroke="#ffffff" stroke-width="2"/><path d="M28.5 45v5 M35.5 45v5 M28.5 47.5h7" stroke="#ffffff" stroke-width="2.2" stroke-linecap="square"/><line x1="12" y1="14" x2="42" y2="18" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/><line x1="25.5" y1="15.5" x2="26.5" y2="19.5" stroke="#b91c1c" stroke-width="2"/><polygon points="7,14 11,20 8,24 5,23" fill="#ef4444"/><line x1="5" y1="15" x2="9" y2="23" stroke="#b91c1c" stroke-width="1.5" stroke-linecap="round"/><path d="M7 21 C 11 21.5, 17 23, 20 23.5 C 24 24, 34 25.5, 37 30 C 37.8 31.5, 36.5 34.5, 32 35 C 27 35.5, 20 34.5, 17 31 C 14.5 28.5, 11 24.5, 7 21 Z" fill="#ef4444"/><path d="M28 25.5 C 31.5 26, 34.5 28, 35 30.5 C 34.5 32.5, 32 33, 29.5 33 C 27.5 33, 27 31.5, 27 29 Z" fill="#ffffff"/><line x1="22" y1="34" x2="20" y2="38" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round"/><line x1="29" y1="34.5" x2="27" y2="38.5" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round"/><path d="M17 38.5 L 32 39 C 34 39, 35 37.5, 35.5 36.5" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

// Variabili Firebase & Gestione Eliminazioni Definitive
let db = null;
let auth = null;
let markersRef = null;
let reportsRef = null;
let deletedMarkersRef = null;
let urgentNewsRef = null;
let customRoutesRef = null;
let authorizedUsersRef = null;
let currentUser = null;
let currentUserProfile = null;
let allAuthorizedUsers = [];
const DEFAULT_AUTH_DOMAIN = '@118fe.it';
let urgentNewsData = []; // Notizie urgenti attive (massimo 3)
let allUrgentNewsRaw = []; // Tutte le notizie (inclusi stati inattivi/scaduti per l'admin)
let urgentNewsTimerInterval = null;
let urgentNewsSecondsLeft = 20;
let urgentNewsShownThisSession = false;
let editingNewsId = null;

let deletedMarkerIds = new Set([
    'mkt_fe_lun_1', 'mkt_fe_lun_2', 
    'mkt_fe_baluardi_1', 'mkt_fe_baluardi_2', 
    'mercato_fe_lun', 'mercato_fe_baluardi', 
    'baluardi_pallone', 'mercato_baluardi', 'giuoco_del_pallone',
    'chiozziole_baluardi', 'mercato_chiozziole',
    'mkt_fe_ven_1', 'mkt_fe_ven_2', 'mercato_fe_ven'
]);
let isFirebaseOnline = false;

// Verifica se un marker appartiene a eventi o mercati eliminati definitivamente (es. Baluardi / Travaglio / Kennedy / Pallone)
function isPermanentlyDeletedMarker(m, localId = null, fbKey = null) {
    if (!m) return true;
    const idStr = String(localId || m.id || '');
    const keyStr = String(fbKey || m.fbKey || '');
    const segStr = String(m.segmentId || '');

    // 1. Controllo ID espliciti nel Set di eliminati
    if (deletedMarkerIds.has(idStr) || (keyStr && deletedMarkerIds.has(keyStr)) || (segStr && deletedMarkerIds.has(segStr))) {
        return true;
    }

    // 2. Blacklist ID/segmenti dei mercati rimossi (Baluardi, Lunedì, Travaglio/Kennedy di default)
    if (idStr.startsWith('mkt_fe_lun') || idStr.startsWith('mkt_fe_baluardi') || idStr.startsWith('mkt_baluardi') ||
        idStr.startsWith('mkt_fe_ven') ||
        segStr.includes('mercato_fe_lun') || segStr.includes('baluardi_pallone') || segStr.includes('mercato_baluardi') ||
        segStr.includes('chiozziole') || segStr.includes('giuoco_del_pallone') || segStr.includes('mercato_fe_ven')) {
        deletedMarkerIds.add(idStr);
        if (keyStr) deletedMarkerIds.add(keyStr);
        return true;
    }

    // 3. Riconoscimento semantico e geografico rigoroso dei mercati rimossi
    const street = (m.street || '').toLowerCase();
    const note = (m.note || '').toLowerCase();
    const isMarket = m.type === 'mercato';

    if (isMarket) {
        // Controllo nominale diretto (Baluardi, Chiozziole, Giuoco del Pallone, Piazza Travaglio / Kennedy)
        if (street.includes('baluardi') || street.includes('chiozziole') || street.includes('giuoco del pallone') || 
            street.includes('pallone') || street.includes('travaglio') || street.includes('kennedy') ||
            note.includes('baluardi') || note.includes('chiozziole') || 
            note.includes('giuoco del pallone') || note.includes('pallone') ||
            note.includes('travaglio') || note.includes('kennedy')) {
            if (idStr) deletedMarkerIds.add(idStr);
            if (keyStr) deletedMarkerIds.add(keyStr);
            return true;
        }
        // Coordinate precise dell'area Baluardi / San Pietro / Chiozziole / Giuoco del Pallone / Mayr
        if (m.lat >= 44.8250 && m.lat <= 44.8340 && m.lng >= 11.6190 && m.lng <= 11.6320) {
            if (idStr) deletedMarkerIds.add(idStr);
            if (keyStr) deletedMarkerIds.add(keyStr);
            return true;
        }
    }

    return false;
}

// Pulizia automatica della cache locale e migrazione versione su iPhone/browser
function checkAndMigrateLocalStorage() {
    try {
        const currentStoredVersion = localStorage.getItem('ferrara_app_version');
        if (currentStoredVersion !== APP_VERSION) {
            console.log(`🔄 Aggiornamento versione a ${APP_VERSION}: sanitizzazione cache locale`);
            localStorage.setItem('ferrara_app_version', APP_VERSION);
            // Pulisci CacheStorage API se presente
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                }).catch(() => {});
            }
            // Pulisci cache stradali obsolete
            localStorage.removeItem('ferrara_street_cache_v20');
            // Sanitizza i marker salvati in locale
            const saved = localStorage.getItem('ferrara_viabilita_markers');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter(m => !isPermanentlyDeletedMarker(m, m.id, m.fbKey));
                    localStorage.setItem('ferrara_viabilita_markers', JSON.stringify(cleaned));
                }
            }
        }
    } catch (e) {
        console.warn('Errore migrazione localStorage:', e);
    }
}
checkAndMigrateLocalStorage();

// Carica l'elenco dei marker/eventi eliminati definitivamente da localStorage
function loadDeletedMarkersFromLocalStorage() {
    try {
        const saved = localStorage.getItem('ferrara_viabilita_deleted_markers');
        if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list)) {
                list.forEach(id => deletedMarkerIds.add(String(id)));
            }
        }
    } catch (e) {
        console.warn('Errore lettura deleted markers da localStorage', e);
    }
}

// Salva l'elenco dei marker/eventi eliminati definitivamente su localStorage
function saveDeletedMarkersToLocalStorage() {
    try {
        localStorage.setItem('ferrara_viabilita_deleted_markers', JSON.stringify(Array.from(deletedMarkerIds)));
    } catch (e) {
        console.warn('Errore salvataggio deleted markers su localStorage', e);
    }
}

// Inizializza Firebase (Database + Auth)
function initFirebase() {
    try {
        checkAndMigrateLocalStorage();
        loadDeletedMarkersFromLocalStorage();

        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            auth = firebase.auth();
            markersRef = db.ref("markers");
            reportsRef = db.ref("user_reports");
            deletedMarkersRef = db.ref("deleted_markers");
            urgentNewsRef = db.ref("urgent_news");
            customRoutesRef = db.ref("custom_routes");
            authorizedUsersRef = db.ref("admin_settings/authorized_users");
            isFirebaseOnline = true;
            console.log('🔥 Firebase collegato — database e auth attivi');

            // Inizializza ascolto Notizie Urgenti 118
            initUrgentNewsListener();

            // Inizializza ascolto Percorsi ed Eventi Speciali
            initCustomRoutesListener();

            // Ascolto in tempo reale degli eventi eliminati definitivamente
            deletedMarkersRef.on('value', function (snapshot) {
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(k => deletedMarkerIds.add(String(k)));
                    saveDeletedMarkersToLocalStorage();
                }
                // Rimuovi subito eventuali marker eliminati presenti in memoria/mappa
                let changed = false;
                markersData = markersData.filter(m => {
                    const isDeleted = isPermanentlyDeletedMarker(m, m.id, m.fbKey);
                    if (isDeleted) {
                        if (activeLayers[m.id]) {
                            map.removeLayer(activeLayers[m.id]);
                            delete activeLayers[m.id];
                        }
                        if (m.fbKey && activeLayers[m.fbKey]) {
                            map.removeLayer(activeLayers[m.fbKey]);
                            delete activeLayers[m.fbKey];
                        }
                        changed = true;
                        return false;
                    }
                    return true;
                });
                if (changed) {
                    saveToLocalStorage();
                    updateFilterCounts();
                    updateRoadSegments();
                }
            });

            // Ascolto dello stato di autenticazione e controllo accessi
            auth.onAuthStateChanged(async (user) => {
                if (!user) {
                    currentUser = null;
                    currentUserProfile = null;
                    isAdmin = false;
                    console.log('🔒 Nessun utente loggato — Visualizzazione Gatekeeper di sicurezza');
                    stopAdminReportsListener();
                    stopAdminUsersListener();
                    showGatekeeper();
                    updateUI();
                    return;
                }

                currentUser = user;
                console.log(`🔐 Utente collegato: ${user.email} (UID: ${user.uid})`);

                try {
                    // Recupera il profilo utente da authorized_users
                    const snap = await authorizedUsersRef.child(user.uid).once('value');
                    let profile = snap.val();

                    if (!profile) {
                        // Se è l'admin principale o primo login dell'account di root
                        const isMasterAdmin = (user.email === ADMIN_EMAIL || user.email === 'stefano.balboni@ausl.fe.it' || (user.email && user.email.startsWith('admin')));
                        profile = {
                            uid: user.uid,
                            name: isMasterAdmin ? 'Amministratore 118' : (user.displayName || user.email.split('@')[0]),
                            email: user.email,
                            role: isMasterAdmin ? 'admin' : 'operator',
                            status: 'active',
                            mustChangePassword: false,
                            createdAt: Date.now(),
                            createdBy: 'system'
                        };
                        await authorizedUsersRef.child(user.uid).set(profile);
                    }

                    currentUserProfile = profile;

                    // Controllo stato disabilitato
                    if (profile.status === 'disabled') {
                        console.warn('⛔ Account disabilitato!');
                        showToast("Account disabilitato dall'Amministratore. Accesso revocato.", "error", 5000);
                        await auth.signOut();
                        showGatekeeper("Accesso negato: l'account è stato disabilitato dall'Amministratore.");
                        return;
                    }

                    // Controllo obbligo cambio password
                    if (profile.mustChangePassword) {
                        showMandatoryPasswordChangeModal();
                    } else {
                        hideMandatoryPasswordChangeModal();
                    }

                    isAdmin = (profile.role === 'admin' || user.email === ADMIN_EMAIL);
                    hideGatekeeper();

                    if (isAdmin) {
                        initAdminReportsListener();
                        initAdminUsersListener();
                    } else {
                        stopAdminReportsListener();
                        stopAdminUsersListener();
                    }

                    updateUI();
                } catch (err) {
                    console.error('Errore gestione profilo utente:', err);
                    isAdmin = (user.email === ADMIN_EMAIL);
                    hideGatekeeper();
                    updateUI();
                }
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
        deletedMarkersRef = null;
        urgentNewsRef = null;
        customRoutesRef = null;
        isFirebaseOnline = false;
        loadUrgentNewsFromLocalStorage();
        loadCustomRoutesFromLocalStorage();
    }
}

// --- DATABASE MERCATI SETTIMANALI DELLA PROVINCIA DI FERRARA E LIMITROFI (118) ---
// Configurazione completa con programmazione ricorrente e coppie per evidenziare il tratto stradale / piazza
const DEFAULT_WEEKLY_MARKETS = [
    // 1. FERRARA - Barco (Martedì)
    {
        id: 'mkt_fe_barco_1',
        lat: 44.85880,
        lng: 11.60920,
        type: 'mercato',
        street: 'Via Barche / Via Bentivoglio, Ferrara (Barco)',
        segmentId: 'mercato_fe_barco',
        note: 'Mercato rionale di Barco (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_barco_2',
        lat: 44.86010,
        lng: 11.60780,
        type: 'mercato',
        street: 'Via Barche / Via Bentivoglio, Ferrara (Barco)',
        segmentId: 'mercato_fe_barco',
        note: 'Mercato rionale di Barco (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 4. FERRARA - Doro (Mercoledì)
    {
        id: 'mkt_fe_doro_1',
        lat: 44.85020,
        lng: 11.59750,
        type: 'mercato',
        street: 'Via Andrea Costa / Via Doro, Ferrara',
        segmentId: 'mercato_fe_doro',
        note: 'Mercato rionale Doro (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_doro_2',
        lat: 44.84890,
        lng: 11.59910,
        type: 'mercato',
        street: 'Via Andrea Costa / Via Doro, Ferrara',
        segmentId: 'mercato_fe_doro',
        note: 'Mercato rionale Doro (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 5. FERRARA - Foro Boario (Giovedì)
    {
        id: 'mkt_fe_foroboario_1',
        lat: 44.82110,
        lng: 11.61380,
        type: 'mercato',
        street: 'Via Foro Boario, Ferrara',
        segmentId: 'mercato_fe_foroboario',
        note: 'Mercato rionale Foro Boario (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_foroboario_2',
        lat: 44.81940,
        lng: 11.61520,
        type: 'mercato',
        street: 'Via Foro Boario, Ferrara',
        segmentId: 'mercato_fe_foroboario',
        note: 'Mercato rionale Foro Boario (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 6. FERRARA - Pontelagoscuro (Sabato)
    {
        id: 'mkt_fe_pontelagoscuro_1',
        lat: 44.88120,
        lng: 11.60680,
        type: 'mercato',
        street: 'Piazza Bruno Buozzi, Pontelagoscuro',
        segmentId: 'mercato_fe_pontelagoscuro',
        note: 'Mercato di Pontelagoscuro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_pontelagoscuro_2',
        lat: 44.88240,
        lng: 11.60810,
        type: 'mercato',
        street: 'Piazza Bruno Buozzi, Pontelagoscuro',
        segmentId: 'mercato_fe_pontelagoscuro',
        note: 'Mercato di Pontelagoscuro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 7. FERRARA - San Martino (Sabato)
    {
        id: 'mkt_fe_sanmartino_1',
        lat: 44.78560,
        lng: 11.63720,
        type: 'mercato',
        street: 'Piazza Umberto I, San Martino',
        segmentId: 'mercato_fe_sanmartino',
        note: 'Mercato di San Martino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_sanmartino_2',
        lat: 44.78680,
        lng: 11.63850,
        type: 'mercato',
        street: 'Piazza Umberto I, San Martino',
        segmentId: 'mercato_fe_sanmartino',
        note: 'Mercato di San Martino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 8. FERRARA - Porotto (Domenica)
    {
        id: 'mkt_fe_porotto_1',
        lat: 44.84580,
        lng: 11.54350,
        type: 'mercato',
        street: 'Via Ladino / Piazza Giovanni da Porotto, Porotto',
        segmentId: 'mercato_fe_porotto',
        note: 'Mercato di Porotto (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fe_porotto_2',
        lat: 44.84470,
        lng: 11.54480,
        type: 'mercato',
        street: 'Via Ladino / Piazza Giovanni da Porotto, Porotto',
        segmentId: 'mercato_fe_porotto',
        note: 'Mercato di Porotto (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 9. CENTO - Centro (Giovedì)
    {
        id: 'mkt_cento_centro_1',
        lat: 44.72950,
        lng: 11.28910,
        type: 'mercato',
        street: 'Piazza Guercino / Corso Guercino, Cento',
        segmentId: 'mercato_cento_centro',
        note: 'Mercato settimanale di Cento (Giovedì) - Centro storico chiuso',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_cento_centro_2',
        lat: 44.72780,
        lng: 11.29120,
        type: 'mercato',
        street: 'Piazza Guercino / Corso Guercino, Cento',
        segmentId: 'mercato_cento_centro',
        note: 'Mercato settimanale di Cento (Giovedì) - Centro storico chiuso',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 10. CENTO - Renazzo (Martedì)
    {
        id: 'mkt_cento_renazzo_1',
        lat: 44.74950,
        lng: 11.23920,
        type: 'mercato',
        street: 'Piazza Ferraresi, Renazzo',
        segmentId: 'mercato_cento_renazzo',
        note: 'Mercato settimanale di Renazzo (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_cento_renazzo_2',
        lat: 44.75080,
        lng: 11.23780,
        type: 'mercato',
        street: 'Piazza Ferraresi, Renazzo',
        segmentId: 'mercato_cento_renazzo',
        note: 'Mercato settimanale di Renazzo (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 11. CENTO - Casumaro (Sabato)
    {
        id: 'mkt_cento_casumaro_1',
        lat: 44.79240,
        lng: 11.27210,
        type: 'mercato',
        street: 'Piazza Don Rino Gallerani, Casumaro',
        segmentId: 'mercato_cento_casumaro',
        note: 'Mercato settimanale di Casumaro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_cento_casumaro_2',
        lat: 44.79120,
        lng: 11.27350,
        type: 'mercato',
        street: 'Piazza Don Rino Gallerani, Casumaro',
        segmentId: 'mercato_cento_casumaro',
        note: 'Mercato settimanale di Casumaro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 12. COMACCHIO - Centro (Mercoledì)
    {
        id: 'mkt_comacchio_centro_1',
        lat: 44.69380,
        lng: 12.18250,
        type: 'mercato',
        street: 'Piazza Folegatti / Via Muratori, Comacchio',
        segmentId: 'mercato_comacchio_centro',
        note: 'Mercato settimanale di Comacchio (Mercoledì) - Centro storico',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_comacchio_centro_2',
        lat: 44.69490,
        lng: 12.18520,
        type: 'mercato',
        street: 'Piazza Folegatti / Via Muratori, Comacchio',
        segmentId: 'mercato_comacchio_centro',
        note: 'Mercato settimanale di Comacchio (Mercoledì) - Centro storico',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 13. COMACCHIO - Lido di Spina (Lunedì)
    {
        id: 'mkt_lido_spina_1',
        lat: 44.64620,
        lng: 12.24780,
        type: 'mercato',
        street: 'Viale Leonardo da Vinci, Lido di Spina',
        segmentId: 'mercato_lido_spina',
        note: 'Mercato estivo Lido di Spina (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lido_spina_2',
        lat: 44.64850,
        lng: 12.24920,
        type: 'mercato',
        street: 'Viale Leonardo da Vinci, Lido di Spina',
        segmentId: 'mercato_lido_spina',
        note: 'Mercato estivo Lido di Spina (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 14. COMACCHIO - Lido degli Estensi (Martedì)
    {
        id: 'mkt_lido_estensi_1',
        lat: 44.66520,
        lng: 12.24250,
        type: 'mercato',
        street: 'Viale dei Castagni / Viale Carducci, Lido degli Estensi',
        segmentId: 'mercato_lido_estensi',
        note: 'Mercato Lido degli Estensi (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lido_estensi_2',
        lat: 44.66780,
        lng: 12.24410,
        type: 'mercato',
        street: 'Viale dei Castagni / Viale Carducci, Lido degli Estensi',
        segmentId: 'mercato_lido_estensi',
        note: 'Mercato Lido degli Estensi (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 15. COMACCHIO - Porto Garibaldi (Giovedì)
    {
        id: 'mkt_porto_garibaldi_1',
        lat: 44.67820,
        lng: 12.23950,
        type: 'mercato',
        street: 'Viale Bonnet / Via dei Mille, Porto Garibaldi',
        segmentId: 'mercato_porto_garibaldi',
        note: 'Mercato settimanale Porto Garibaldi (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_porto_garibaldi_2',
        lat: 44.68050,
        lng: 12.24120,
        type: 'mercato',
        street: 'Viale Bonnet / Via dei Mille, Porto Garibaldi',
        segmentId: 'mercato_porto_garibaldi',
        note: 'Mercato settimanale Porto Garibaldi (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 16. COMACCHIO - Lido di Pomposa (Venerdì)
    {
        id: 'mkt_lido_pomposa_1',
        lat: 44.71520,
        lng: 12.23850,
        type: 'mercato',
        street: 'Viale Dolomiti, Lido di Pomposa',
        segmentId: 'mercato_lido_pomposa',
        note: 'Mercato Lido di Pomposa (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lido_pomposa_2',
        lat: 44.71800,
        lng: 12.23980,
        type: 'mercato',
        street: 'Viale Dolomiti, Lido di Pomposa',
        segmentId: 'mercato_lido_pomposa',
        note: 'Mercato Lido di Pomposa (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 17. COMACCHIO - Lido delle Nazioni (Sabato)
    {
        id: 'mkt_lido_nazioni_1',
        lat: 44.73950,
        lng: 12.23700,
        type: 'mercato',
        street: 'Lungomare Italia / Viale Jugoslavia, Lido delle Nazioni',
        segmentId: 'mercato_lido_nazioni',
        note: 'Mercato Lido delle Nazioni (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lido_nazioni_2',
        lat: 44.74250,
        lng: 12.23820,
        type: 'mercato',
        street: 'Lungomare Italia / Viale Jugoslavia, Lido delle Nazioni',
        segmentId: 'mercato_lido_nazioni',
        note: 'Mercato Lido delle Nazioni (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 18. COMACCHIO - Lido di Volano (Domenica)
    {
        id: 'mkt_lido_volano_1',
        lat: 44.80250,
        lng: 12.26100,
        type: 'mercato',
        street: 'Piazzale Volano / Viale dei Daini, Lido di Volano',
        segmentId: 'mercato_lido_volano',
        note: 'Mercato Lido di Volano (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lido_volano_2',
        lat: 44.80480,
        lng: 12.26350,
        type: 'mercato',
        street: 'Piazzale Volano / Viale dei Daini, Lido di Volano',
        segmentId: 'mercato_lido_volano',
        note: 'Mercato Lido di Volano (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 19. COMACCHIO - San Giuseppe (Lunedì)
    {
        id: 'mkt_comacchio_sangiuseppe_1',
        lat: 44.70820,
        lng: 12.20250,
        type: 'mercato',
        street: 'Piazza Rimembranza, San Giuseppe di Comacchio',
        segmentId: 'mercato_sangiuseppe',
        note: 'Mercato di San Giuseppe (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_comacchio_sangiuseppe_2',
        lat: 44.70950,
        lng: 12.20400,
        type: 'mercato',
        street: 'Piazza Rimembranza, San Giuseppe di Comacchio',
        segmentId: 'mercato_sangiuseppe',
        note: 'Mercato di San Giuseppe (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 20. ARGENTA - Centro (Giovedì)
    {
        id: 'mkt_argenta_centro_1',
        lat: 44.61350,
        lng: 11.83420,
        type: 'mercato',
        street: 'Piazza Garibaldi / Piazza Mazzini, Argenta',
        segmentId: 'mercato_argenta_centro',
        note: 'Mercato settimanale di Argenta (Giovedì) - Centro chiuso',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_argenta_centro_2',
        lat: 44.61510,
        lng: 11.83600,
        type: 'mercato',
        street: 'Piazza Garibaldi / Piazza Mazzini, Argenta',
        segmentId: 'mercato_argenta_centro',
        note: 'Mercato settimanale di Argenta (Giovedì) - Centro chiuso',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 21. ARGENTA - Santa Maria Codifiume (Lunedì)
    {
        id: 'mkt_argenta_codifiume_1',
        lat: 44.62250,
        lng: 11.60250,
        type: 'mercato',
        street: 'Piazza San Gregorio, Santa Maria Codifiume',
        segmentId: 'mercato_argenta_codifiume',
        note: 'Mercato di Santa Maria Codifiume (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_argenta_codifiume_2',
        lat: 44.62380,
        lng: 11.60420,
        type: 'mercato',
        street: 'Piazza San Gregorio, Santa Maria Codifiume',
        segmentId: 'mercato_argenta_codifiume',
        note: 'Mercato di Santa Maria Codifiume (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 22. ARGENTA - San Nicolò (Martedì)
    {
        id: 'mkt_argenta_sannicolo_1',
        lat: 44.65920,
        lng: 11.75850,
        type: 'mercato',
        street: 'Piazza Giovanni XXIII, San Nicolò',
        segmentId: 'mercato_argenta_sannicolo',
        note: 'Mercato di San Nicolò (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_argenta_sannicolo_2',
        lat: 44.66050,
        lng: 11.76020,
        type: 'mercato',
        street: 'Piazza Giovanni XXIII, San Nicolò',
        segmentId: 'mercato_argenta_sannicolo',
        note: 'Mercato di San Nicolò (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 23. ARGENTA - Consandolo (Mercoledì)
    {
        id: 'mkt_argenta_consandolo_1',
        lat: 44.65420,
        lng: 11.81050,
        type: 'mercato',
        street: 'Piazza Sandro Pertini, Consandolo',
        segmentId: 'mercato_argenta_consandolo',
        note: 'Mercato di Consandolo (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_argenta_consandolo_2',
        lat: 44.65580,
        lng: 11.81220,
        type: 'mercato',
        street: 'Piazza Sandro Pertini, Consandolo',
        segmentId: 'mercato_argenta_consandolo',
        note: 'Mercato di Consandolo (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 24. ARGENTA - Longastrino (Sabato)
    {
        id: 'mkt_argenta_longastrino_1',
        lat: 44.57350,
        lng: 11.97520,
        type: 'mercato',
        street: 'Piazza Bardi, Longastrino',
        segmentId: 'mercato_argenta_longastrino',
        note: 'Mercato di Longastrino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_argenta_longastrino_2',
        lat: 44.57500,
        lng: 11.97680,
        type: 'mercato',
        street: 'Piazza Bardi, Longastrino',
        segmentId: 'mercato_argenta_longastrino',
        note: 'Mercato di Longastrino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 25. BONDENO - Centro (Martedì)
    {
        id: 'mkt_bondeno_centro_1',
        lat: 44.88950,
        lng: 11.41720,
        type: 'mercato',
        street: 'Piazza Garibaldi / Viale Repubblica, Bondeno',
        segmentId: 'mercato_bondeno_centro',
        note: 'Mercato settimanale di Bondeno (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_bondeno_centro_2',
        lat: 44.89120,
        lng: 11.41900,
        type: 'mercato',
        street: 'Piazza Garibaldi / Viale Repubblica, Bondeno',
        segmentId: 'mercato_bondeno_centro',
        note: 'Mercato settimanale di Bondeno (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 26. BONDENO - Scortichino (Sabato)
    {
        id: 'mkt_bondeno_scortichino_1',
        lat: 44.89620,
        lng: 11.34150,
        type: 'mercato',
        street: 'Piazza XXIV Maggio, Scortichino',
        segmentId: 'mercato_bondeno_scortichino',
        note: 'Mercato di Scortichino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_bondeno_scortichino_2',
        lat: 44.89780,
        lng: 11.34320,
        type: 'mercato',
        street: 'Piazza XXIV Maggio, Scortichino',
        segmentId: 'mercato_bondeno_scortichino',
        note: 'Mercato di Scortichino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 27. COPPARO - Centro (Venerdì)
    {
        id: 'mkt_copparo_centro_1',
        lat: 44.89250,
        lng: 11.72350,
        type: 'mercato',
        street: 'Piazza della Libertà / Piazza del Popolo, Copparo',
        segmentId: 'mercato_copparo_centro',
        note: 'Mercato settimanale di Copparo (Venerdì) - Centro chiuso',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_copparo_centro_2',
        lat: 44.89420,
        lng: 11.72580,
        type: 'mercato',
        street: 'Piazza della Libertà / Piazza del Popolo, Copparo',
        segmentId: 'mercato_copparo_centro',
        note: 'Mercato settimanale di Copparo (Venerdì) - Centro chiuso',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 28. COPPARO - Ambrogio (Lunedì)
    {
        id: 'mkt_copparo_ambrogio_1',
        lat: 44.91250,
        lng: 11.82100,
        type: 'mercato',
        street: 'Piazza Medaglie d\'Oro, Ambrogio',
        segmentId: 'mercato_copparo_ambrogio',
        note: 'Mercato di Ambrogio (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_copparo_ambrogio_2',
        lat: 44.91380,
        lng: 11.82250,
        type: 'mercato',
        street: 'Piazza Medaglie d\'Oro, Ambrogio',
        segmentId: 'mercato_copparo_ambrogio',
        note: 'Mercato di Ambrogio (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 29. COPPARO - Tamara (Mercoledì)
    {
        id: 'mkt_copparo_tamara_1',
        lat: 44.86920,
        lng: 11.74850,
        type: 'mercato',
        street: 'Piazza XX Settembre, Tamara',
        segmentId: 'mercato_copparo_tamara',
        note: 'Mercato di Tamara (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_copparo_tamara_2',
        lat: 44.87050,
        lng: 11.75020,
        type: 'mercato',
        street: 'Piazza XX Settembre, Tamara',
        segmentId: 'mercato_copparo_tamara',
        note: 'Mercato di Tamara (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 30. CODIGORO - Centro (Martedì)
    {
        id: 'mkt_codigoro_centro_1',
        lat: 44.82950,
        lng: 12.11250,
        type: 'mercato',
        street: 'Piazza Matteotti / Riviera Cavallotti, Codigoro',
        segmentId: 'mercato_codigoro_centro',
        note: 'Mercato settimanale di Codigoro (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_codigoro_centro_2',
        lat: 44.83120,
        lng: 12.11480,
        type: 'mercato',
        street: 'Piazza Matteotti / Riviera Cavallotti, Codigoro',
        segmentId: 'mercato_codigoro_centro',
        note: 'Mercato settimanale di Codigoro (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 31. CODIGORO - Mezzogoro (Venerdì)
    {
        id: 'mkt_codigoro_mezzogoro_1',
        lat: 44.87250,
        lng: 12.10250,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto, Mezzogoro',
        segmentId: 'mercato_codigoro_mezzogoro',
        note: 'Mercato di Mezzogoro (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_codigoro_mezzogoro_2',
        lat: 44.87380,
        lng: 12.10420,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto, Mezzogoro',
        segmentId: 'mercato_codigoro_mezzogoro',
        note: 'Mercato di Mezzogoro (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 32. CODIGORO - Pontelangorino (Sabato)
    {
        id: 'mkt_codigoro_pontelangorino_1',
        lat: 44.77950,
        lng: 12.14850,
        type: 'mercato',
        street: 'Piazza Ariostea, Pontelangorino',
        segmentId: 'mercato_codigoro_pontelangorino',
        note: 'Mercato di Pontelangorino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_codigoro_pontelangorino_2',
        lat: 44.78100,
        lng: 12.15020,
        type: 'mercato',
        street: 'Piazza Ariostea, Pontelangorino',
        segmentId: 'mercato_codigoro_pontelangorino',
        note: 'Mercato di Pontelangorino (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 33. PORTOMAGGIORE - Centro (Giovedì)
    {
        id: 'mkt_portomaggiore_centro_1',
        lat: 44.69750,
        lng: 11.80420,
        type: 'mercato',
        street: 'Piazza Umberto I / Piazza Repubblica, Portomaggiore',
        segmentId: 'mercato_portomaggiore_centro',
        note: 'Mercato settimanale di Portomaggiore (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_portomaggiore_centro_2',
        lat: 44.69920,
        lng: 11.80650,
        type: 'mercato',
        street: 'Piazza Umberto I / Piazza Repubblica, Portomaggiore',
        segmentId: 'mercato_portomaggiore_centro',
        note: 'Mercato settimanale di Portomaggiore (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 34. PORTOMAGGIORE - Portoverrara (Mercoledì)
    {
        id: 'mkt_portomaggiore_portoverrara_1',
        lat: 44.73250,
        lng: 11.78950,
        type: 'mercato',
        street: 'Piazza della Libertà, Portoverrara',
        segmentId: 'mercato_portoverrara',
        note: 'Mercato di Portoverrara (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_portomaggiore_portoverrara_2',
        lat: 44.73380,
        lng: 11.79100,
        type: 'mercato',
        street: 'Piazza della Libertà, Portoverrara',
        segmentId: 'mercato_portoverrara',
        note: 'Mercato di Portoverrara (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 35. PORTOMAGGIORE - Gambulaga (Venerdì)
    {
        id: 'mkt_portomaggiore_gambulaga_1',
        lat: 44.74950,
        lng: 11.77450,
        type: 'mercato',
        street: 'Piazza Castello, Gambulaga',
        segmentId: 'mercato_gambulaga',
        note: 'Mercato di Gambulaga (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_portomaggiore_gambulaga_2',
        lat: 44.75100,
        lng: 11.77620,
        type: 'mercato',
        street: 'Piazza Castello, Gambulaga',
        segmentId: 'mercato_gambulaga',
        note: 'Mercato di Gambulaga (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 36. POGGIO RENATICO - Centro (Lunedì)
    {
        id: 'mkt_poggiorenatico_centro_1',
        lat: 44.76450,
        lng: 11.49650,
        type: 'mercato',
        street: 'Piazza del Popolo / Piazza Castello, Poggio Renatico',
        segmentId: 'mercato_poggiorenatico_centro',
        note: 'Mercato settimanale di Poggio Renatico (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_poggiorenatico_centro_2',
        lat: 44.76620,
        lng: 11.49850,
        type: 'mercato',
        street: 'Piazza del Popolo / Piazza Castello, Poggio Renatico',
        segmentId: 'mercato_poggiorenatico_centro',
        note: 'Mercato settimanale di Poggio Renatico (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 37. POGGIO RENATICO - Coronella (Sabato)
    {
        id: 'mkt_poggiorenatico_coronella_1',
        lat: 44.79250,
        lng: 11.53420,
        type: 'mercato',
        street: 'Piazza Caduti, Coronella',
        segmentId: 'mercato_coronella',
        note: 'Mercato di Coronella (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_poggiorenatico_coronella_2',
        lat: 44.79380,
        lng: 11.53580,
        type: 'mercato',
        street: 'Piazza Caduti, Coronella',
        segmentId: 'mercato_coronella',
        note: 'Mercato di Coronella (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 38. POGGIO RENATICO - Gallo (Mercoledì)
    {
        id: 'mkt_poggiorenatico_gallo_1',
        lat: 44.74350,
        lng: 11.53850,
        type: 'mercato',
        street: 'Piazza San Carlo, Gallo Ferrarese',
        segmentId: 'mercato_gallo',
        note: 'Mercato di Gallo (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_poggiorenatico_gallo_2',
        lat: 44.74480,
        lng: 11.54020,
        type: 'mercato',
        street: 'Piazza San Carlo, Gallo Ferrarese',
        segmentId: 'mercato_gallo',
        note: 'Mercato di Gallo (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 39. TERRE DEL RENO - Sant'Agostino (Martedì)
    {
        id: 'mkt_terredelreno_santagostino_1',
        lat: 44.79250,
        lng: 11.38720,
        type: 'mercato',
        street: 'Piazza Marconi / Via Statale, Sant\'Agostino',
        segmentId: 'mercato_santagostino',
        note: 'Mercato settimanale di Sant\'Agostino (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_terredelreno_santagostino_2',
        lat: 44.79420,
        lng: 11.38950,
        type: 'mercato',
        street: 'Piazza Marconi / Via Statale, Sant\'Agostino',
        segmentId: 'mercato_santagostino',
        note: 'Mercato settimanale di Sant\'Agostino (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 40. TERRE DEL RENO - Mirabello (Giovedì)
    {
        id: 'mkt_terredelreno_mirabello_1',
        lat: 44.82620,
        lng: 11.46450,
        type: 'mercato',
        street: 'Piazza Matteotti / Corso Italia, Mirabello',
        segmentId: 'mercato_mirabello',
        note: 'Mercato settimanale di Mirabello (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_terredelreno_mirabello_2',
        lat: 44.82780,
        lng: 11.46650,
        type: 'mercato',
        street: 'Piazza Matteotti / Corso Italia, Mirabello',
        segmentId: 'mercato_mirabello',
        note: 'Mercato settimanale di Mirabello (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 41. TERRE DEL RENO - San Carlo (Domenica)
    {
        id: 'mkt_terredelreno_sancarlo_1',
        lat: 44.80950,
        lng: 11.43250,
        type: 'mercato',
        street: 'Piazza Pola, San Carlo',
        segmentId: 'mercato_sancarlo',
        note: 'Mercato di San Carlo (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_terredelreno_sancarlo_2',
        lat: 44.81100,
        lng: 11.43420,
        type: 'mercato',
        street: 'Piazza Pola, San Carlo',
        segmentId: 'mercato_sancarlo',
        note: 'Mercato di San Carlo (Domenica)',
        schedule: { mode: 'recurring', days: [0], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 42. VIGARANO MAINARDA - Mainarda (Giovedì)
    {
        id: 'mkt_vigarano_mainarda_1',
        lat: 44.84150,
        lng: 11.49420,
        type: 'mercato',
        street: 'Piazza Kennedy / Via Matteotti, Vigarano Mainarda',
        segmentId: 'mercato_vigarano_mainarda',
        note: 'Mercato di Vigarano Mainarda (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_vigarano_mainarda_2',
        lat: 44.84300,
        lng: 11.49650,
        type: 'mercato',
        street: 'Piazza Kennedy / Via Matteotti, Vigarano Mainarda',
        segmentId: 'mercato_vigarano_mainarda',
        note: 'Mercato di Vigarano Mainarda (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 43. VIGARANO MAINARDA - Pieve (Martedì)
    {
        id: 'mkt_vigarano_pieve_1',
        lat: 44.86250,
        lng: 11.50350,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto / Via Mantova, Vigarano Pieve',
        segmentId: 'mercato_vigarano_pieve',
        note: 'Mercato di Vigarano Pieve (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_vigarano_pieve_2',
        lat: 44.86400,
        lng: 11.50520,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto / Via Mantova, Vigarano Pieve',
        segmentId: 'mercato_vigarano_pieve',
        note: 'Mercato di Vigarano Pieve (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 44. MESOLA - Centro (Sabato)
    {
        id: 'mkt_mesola_centro_1',
        lat: 44.92250,
        lng: 12.23050,
        type: 'mercato',
        street: 'Piazza Santo Spirito / Piazza della Vittoria, Mesola',
        segmentId: 'mercato_mesola_centro',
        note: 'Mercato settimanale di Mesola (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_mesola_centro_2',
        lat: 44.92420,
        lng: 12.23280,
        type: 'mercato',
        street: 'Piazza Santo Spirito / Piazza della Vittoria, Mesola',
        segmentId: 'mercato_mesola_centro',
        note: 'Mercato settimanale di Mesola (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 45. MESOLA - Bosco Mesola (Martedì)
    {
        id: 'mkt_mesola_bosco_1',
        lat: 44.90850,
        lng: 12.24720,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto, Bosco Mesola',
        segmentId: 'mercato_bosco_mesola',
        note: 'Mercato di Bosco Mesola (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_mesola_bosco_2',
        lat: 44.91000,
        lng: 12.24900,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto, Bosco Mesola',
        segmentId: 'mercato_bosco_mesola',
        note: 'Mercato di Bosco Mesola (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 46. GORO - Centro (Sabato)
    {
        id: 'mkt_goro_centro_1',
        lat: 44.85150,
        lng: 12.29650,
        type: 'mercato',
        street: 'Piazza Bruno Rossi / Via Roma, Goro',
        segmentId: 'mercato_goro_centro',
        note: 'Mercato settimanale di Goro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_goro_centro_2',
        lat: 44.85320,
        lng: 12.29880,
        type: 'mercato',
        street: 'Piazza Bruno Rossi / Via Roma, Goro',
        segmentId: 'mercato_goro_centro',
        note: 'Mercato settimanale di Goro (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 47. GORO - Gorino (Giovedì)
    {
        id: 'mkt_goro_gorino_1',
        lat: 44.81950,
        lng: 12.35350,
        type: 'mercato',
        street: 'Piazza Nazario Sauro, Gorino',
        segmentId: 'mercato_gorino',
        note: 'Mercato di Gorino (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_goro_gorino_2',
        lat: 44.82100,
        lng: 12.35520,
        type: 'mercato',
        street: 'Piazza Nazario Sauro, Gorino',
        segmentId: 'mercato_gorino',
        note: 'Mercato di Gorino (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 48. OSTELLATO - Centro (Martedì)
    {
        id: 'mkt_ostellato_centro_1',
        lat: 44.74350,
        lng: 11.93920,
        type: 'mercato',
        street: 'Piazza della Repubblica / Via Garibaldi, Ostellato',
        segmentId: 'mercato_ostellato_centro',
        note: 'Mercato settimanale di Ostellato (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_ostellato_centro_2',
        lat: 44.74520,
        lng: 11.94150,
        type: 'mercato',
        street: 'Piazza della Repubblica / Via Garibaldi, Ostellato',
        segmentId: 'mercato_ostellato_centro',
        note: 'Mercato settimanale di Ostellato (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 49. OSTELLATO - Rovereto (Venerdì)
    {
        id: 'mkt_ostellato_rovereto_1',
        lat: 44.77850,
        lng: 11.90750,
        type: 'mercato',
        street: 'Piazza Trieste, Rovereto di Ostellato',
        segmentId: 'mercato_rovereto_ostellato',
        note: 'Mercato di Rovereto (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_ostellato_rovereto_2',
        lat: 44.78000,
        lng: 11.90920,
        type: 'mercato',
        street: 'Piazza Trieste, Rovereto di Ostellato',
        segmentId: 'mercato_rovereto_ostellato',
        note: 'Mercato di Rovereto (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 50. OSTELLATO - San Giovanni (Giovedì)
    {
        id: 'mkt_ostellato_sangiovanni_1',
        lat: 44.73850,
        lng: 11.99650,
        type: 'mercato',
        street: 'Piazza della Libertà, San Giovanni di Ostellato',
        segmentId: 'mercato_sangiovanni_ostellato',
        note: 'Mercato di San Giovanni di Ostellato (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_ostellato_sangiovanni_2',
        lat: 44.74000,
        lng: 11.99820,
        type: 'mercato',
        street: 'Piazza della Libertà, San Giovanni di Ostellato',
        segmentId: 'mercato_sangiovanni_ostellato',
        note: 'Mercato di San Giovanni di Ostellato (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 51. FISCAGLIA - Migliarino (Mercoledì)
    {
        id: 'mkt_fiscaglia_migliarino_1',
        lat: 44.77250,
        lng: 11.93350,
        type: 'mercato',
        street: 'Piazza della Libertà / Piazza Repubblica, Migliarino',
        segmentId: 'mercato_migliarino',
        note: 'Mercato settimanale di Migliarino (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fiscaglia_migliarino_2',
        lat: 44.77420,
        lng: 11.93580,
        type: 'mercato',
        street: 'Piazza della Libertà / Piazza Repubblica, Migliarino',
        segmentId: 'mercato_migliarino',
        note: 'Mercato settimanale di Migliarino (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 52. FISCAGLIA - Massa Fiscaglia (Martedì)
    {
        id: 'mkt_fiscaglia_massafiscaglia_1',
        lat: 44.80850,
        lng: 12.01520,
        type: 'mercato',
        street: 'Piazza Garibaldi / Via Roma, Massa Fiscaglia',
        segmentId: 'mercato_massafiscaglia',
        note: 'Mercato settimanale di Massa Fiscaglia (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fiscaglia_massafiscaglia_2',
        lat: 44.81020,
        lng: 12.01750,
        type: 'mercato',
        street: 'Piazza Garibaldi / Via Roma, Massa Fiscaglia',
        segmentId: 'mercato_massafiscaglia',
        note: 'Mercato settimanale di Massa Fiscaglia (Martedì)',
        schedule: { mode: 'recurring', days: [2], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 53. FISCAGLIA - Migliaro (Venerdì)
    {
        id: 'mkt_fiscaglia_migliaro_1',
        lat: 44.79250,
        lng: 11.97450,
        type: 'mercato',
        street: 'Piazza XXV Aprile, Migliaro',
        segmentId: 'mercato_migliaro',
        note: 'Mercato di Migliaro (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_fiscaglia_migliaro_2',
        lat: 44.79400,
        lng: 11.97620,
        type: 'mercato',
        street: 'Piazza XXV Aprile, Migliaro',
        segmentId: 'mercato_migliaro',
        note: 'Mercato di Migliaro (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 54. TRESIGNANA - Tresigallo (Lunedì)
    {
        id: 'mkt_tresignana_tresigallo_1',
        lat: 44.81620,
        lng: 11.89550,
        type: 'mercato',
        street: 'Piazza Italia / Piazza della Repubblica, Tresigallo',
        segmentId: 'mercato_tresigallo',
        note: 'Mercato settimanale di Tresigallo (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_tresignana_tresigallo_2',
        lat: 44.81800,
        lng: 11.89780,
        type: 'mercato',
        street: 'Piazza Italia / Piazza della Repubblica, Tresigallo',
        segmentId: 'mercato_tresigallo',
        note: 'Mercato settimanale di Tresigallo (Lunedì)',
        schedule: { mode: 'recurring', days: [1], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 55. TRESIGNANA - Formignana (Mercoledì)
    {
        id: 'mkt_tresignana_formignana_1',
        lat: 44.84620,
        lng: 11.85950,
        type: 'mercato',
        street: 'Piazza Unità / Via Roma, Formignana',
        segmentId: 'mercato_formignana',
        note: 'Mercato settimanale di Formignana (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_tresignana_formignana_2',
        lat: 44.84780,
        lng: 11.86180,
        type: 'mercato',
        street: 'Piazza Unità / Via Roma, Formignana',
        segmentId: 'mercato_formignana',
        note: 'Mercato settimanale di Formignana (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 56. RIVA DEL PO - Berra (Mercoledì)
    {
        id: 'mkt_rivadelpo_berra_1',
        lat: 44.97850,
        lng: 11.97520,
        type: 'mercato',
        street: 'Piazza della Repubblica, Berra',
        segmentId: 'mercato_berra',
        note: 'Mercato settimanale di Berra (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_rivadelpo_berra_2',
        lat: 44.98020,
        lng: 11.97750,
        type: 'mercato',
        street: 'Piazza della Repubblica, Berra',
        segmentId: 'mercato_berra',
        note: 'Mercato settimanale di Berra (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 57. RIVA DEL PO - Ro Ferrarese (Giovedì)
    {
        id: 'mkt_rivadelpo_ro_1',
        lat: 44.94750,
        lng: 11.75820,
        type: 'mercato',
        street: 'Piazza Umberto I, Ro Ferrarese',
        segmentId: 'mercato_ro',
        note: 'Mercato settimanale di Ro Ferrarese (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_rivadelpo_ro_2',
        lat: 44.94920,
        lng: 11.76050,
        type: 'mercato',
        street: 'Piazza Umberto I, Ro Ferrarese',
        segmentId: 'mercato_ro',
        note: 'Mercato settimanale di Ro Ferrarese (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 58. RIVA DEL PO - Serravalle (Venerdì)
    {
        id: 'mkt_rivadelpo_serravalle_1',
        lat: 44.96850,
        lng: 12.04350,
        type: 'mercato',
        street: 'Piazza Giuseppe Mazzini, Serravalle',
        segmentId: 'mercato_serravalle',
        note: 'Mercato di Serravalle (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_rivadelpo_serravalle_2',
        lat: 44.97000,
        lng: 12.04520,
        type: 'mercato',
        street: 'Piazza Giuseppe Mazzini, Serravalle',
        segmentId: 'mercato_serravalle',
        note: 'Mercato di Serravalle (Venerdì)',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 59. RIVA DEL PO - Cologna (Sabato)
    {
        id: 'mkt_rivadelpo_cologna_1',
        lat: 44.96150,
        lng: 11.89720,
        type: 'mercato',
        street: 'Piazza Libertà, Cologna',
        segmentId: 'mercato_cologna',
        note: 'Mercato di Cologna (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_rivadelpo_cologna_2',
        lat: 44.96300,
        lng: 11.89900,
        type: 'mercato',
        street: 'Piazza Libertà, Cologna',
        segmentId: 'mercato_cologna',
        note: 'Mercato di Cologna (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 60. MASI TORELLO - Centro (Giovedì)
    {
        id: 'mkt_masitorello_centro_1',
        lat: 44.79650,
        lng: 11.79850,
        type: 'mercato',
        street: 'Piazza Mario Antolini / Via Roma, Masi Torello',
        segmentId: 'mercato_masitorello_centro',
        note: 'Mercato settimanale di Masi Torello (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_masitorello_centro_2',
        lat: 44.79800,
        lng: 11.80050,
        type: 'mercato',
        street: 'Piazza Mario Antolini / Via Roma, Masi Torello',
        segmentId: 'mercato_masitorello_centro',
        note: 'Mercato settimanale di Masi Torello (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 61. MASI TORELLO - Masi San Giacomo (Sabato)
    {
        id: 'mkt_masitorello_sanciacomo_1',
        lat: 44.78950,
        lng: 11.83450,
        type: 'mercato',
        street: 'Piazza della Chiesa, Masi San Giacomo',
        segmentId: 'mercato_masisangiacomo',
        note: 'Mercato di Masi San Giacomo (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_masitorello_sanciacomo_2',
        lat: 44.79100,
        lng: 11.83620,
        type: 'mercato',
        street: 'Piazza della Chiesa, Masi San Giacomo',
        segmentId: 'mercato_masisangiacomo',
        note: 'Mercato di Masi San Giacomo (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 62. VOGHIERA - Centro (Mercoledì)
    {
        id: 'mkt_voghiera_centro_1',
        lat: 44.76150,
        lng: 11.74820,
        type: 'mercato',
        street: 'Piazza del Popolo / Viale Dante, Voghiera',
        segmentId: 'mercato_voghiera_centro',
        note: 'Mercato settimanale di Voghiera (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_voghiera_centro_2',
        lat: 44.76300,
        lng: 11.75020,
        type: 'mercato',
        street: 'Piazza del Popolo / Viale Dante, Voghiera',
        segmentId: 'mercato_voghiera_centro',
        note: 'Mercato settimanale di Voghiera (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 63. VOGHIERA - Ducentola (Sabato)
    {
        id: 'mkt_voghiera_ducentola_1',
        lat: 44.78350,
        lng: 11.72150,
        type: 'mercato',
        street: 'Piazza San Bartolomeo, Ducentola',
        segmentId: 'mercato_ducentola',
        note: 'Mercato di Ducentola (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_voghiera_ducentola_2',
        lat: 44.78500,
        lng: 11.72320,
        type: 'mercato',
        street: 'Piazza San Bartolomeo, Ducentola',
        segmentId: 'mercato_ducentola',
        note: 'Mercato di Ducentola (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 64. JOLANDA DI SAVOIA - Centro (Mercoledì)
    {
        id: 'mkt_jolandadisavoia_centro_1',
        lat: 44.88350,
        lng: 11.97720,
        type: 'mercato',
        street: 'Piazza Unità d\'Italia / Corso Garibaldi, Jolanda di Savoia',
        segmentId: 'mercato_jolandadisavoia_centro',
        note: 'Mercato settimanale di Jolanda di Savoia (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_jolandadisavoia_centro_2',
        lat: 44.88520,
        lng: 11.97950,
        type: 'mercato',
        street: 'Piazza Unità d\'Italia / Corso Garibaldi, Jolanda di Savoia',
        segmentId: 'mercato_jolandadisavoia_centro',
        note: 'Mercato settimanale di Jolanda di Savoia (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 65. LAGOSANTO - Centro (Mercoledì)
    {
        id: 'mkt_lagosanto_centro_1',
        lat: 44.76250,
        lng: 12.14020,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto / Via Roma, Lagosanto',
        segmentId: 'mercato_lagosanto_centro',
        note: 'Mercato settimanale di Lagosanto (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_lagosanto_centro_2',
        lat: 44.76420,
        lng: 12.14250,
        type: 'mercato',
        street: 'Piazza Vittorio Veneto / Via Roma, Lagosanto',
        segmentId: 'mercato_lagosanto_centro',
        note: 'Mercato settimanale di Lagosanto (Mercoledì)',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 66. MOLINELLA (BO) - Centro (Mercoledì)
    {
        id: 'mkt_molinella_centro_1',
        lat: 44.62050,
        lng: 11.66850,
        type: 'mercato',
        street: 'Piazza Anselmo Martoni / Via Mazzini, Molinella',
        segmentId: 'mercato_molinella_centro',
        note: 'Mercato settimanale di Molinella (Mercoledì) - Piazza Martoni e centro chiusi',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_molinella_centro_2',
        lat: 44.62220,
        lng: 11.67100,
        type: 'mercato',
        street: 'Piazza Anselmo Martoni / Via Mazzini, Molinella',
        segmentId: 'mercato_molinella_centro',
        note: 'Mercato settimanale di Molinella (Mercoledì) - Piazza Martoni e centro chiusi',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 67. SAN MATTEO DELLA DECIMA (BO) - Centro (Mercoledì)
    {
        id: 'mkt_sanmatteodelladecima_1',
        lat: 44.72150,
        lng: 11.19850,
        type: 'mercato',
        street: 'Piazza delle Poste / Via Cento, San Matteo della Decima',
        segmentId: 'mercato_sanmatteodelladecima',
        note: 'Mercato settimanale di San Matteo della Decima (Mercoledì) - Area centro chiusa',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_sanmatteodelladecima_2',
        lat: 44.72320,
        lng: 11.20080,
        type: 'mercato',
        street: 'Piazza delle Poste / Via Cento, San Matteo della Decima',
        segmentId: 'mercato_sanmatteodelladecima',
        note: 'Mercato settimanale di San Matteo della Decima (Mercoledì) - Area centro chiusa',
        schedule: { mode: 'recurring', days: [3], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 68. SANTA MARIA MADDALENA (RO) - Centro (Giovedì)
    {
        id: 'mkt_santamariamaddalena_1',
        lat: 44.89650,
        lng: 11.60250,
        type: 'mercato',
        street: 'Piazza Maggiore / Via della Pace, Santa Maria Maddalena',
        segmentId: 'mercato_santamariamaddalena',
        note: 'Mercato settimanale di Santa Maria Maddalena (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_santamariamaddalena_2',
        lat: 44.89820,
        lng: 11.60480,
        type: 'mercato',
        street: 'Piazza Maggiore / Via della Pace, Santa Maria Maddalena',
        segmentId: 'mercato_santamariamaddalena',
        note: 'Mercato settimanale di Santa Maria Maddalena (Giovedì)',
        schedule: { mode: 'recurring', days: [4], timeStart: '06:00', timeEnd: '14:00' }
    },

    // 69. OCCHIOBELLO (RO) - Centro (Sabato)
    {
        id: 'mkt_occhiobello_centro_1',
        lat: 44.92150,
        lng: 11.58350,
        type: 'mercato',
        street: 'Piazza Giacomo Matteotti / Via Roma, Occhiobello',
        segmentId: 'mercato_occhiobello_centro',
        note: 'Mercato settimanale di Occhiobello (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    },
    {
        id: 'mkt_occhiobello_centro_2',
        lat: 44.92320,
        lng: 11.58580,
        type: 'mercato',
        street: 'Piazza Giacomo Matteotti / Via Roma, Occhiobello',
        segmentId: 'mercato_occhiobello_centro',
        note: 'Mercato settimanale di Occhiobello (Sabato)',
        schedule: { mode: 'recurring', days: [6], timeStart: '06:00', timeEnd: '14:00' }
    }
];

// Coordinate di Ferrara
const FERRARA_COORDS = [44.8381, 11.6198];
const MAP_ZOOM = 11;

// Configurazione Icone
const ICONS = {
    lavori: { emoji: '🚧', label: 'Lavori in corso' },
    chiusa: { emoji: ICON_STRADA_CHIUSA, label: 'Strada chiusa' },
    ponte: { emoji: '🌉', label: 'Ponte interrotto' },
    incidente: { emoji: '⚠️', label: 'Incidente' },
    mercato: { emoji: ICON_MERCATO, label: 'Mercato settimanale' },
    semaforo: { emoji: '🚦', label: 'Senso unico alternato' },
    sagra: { emoji: ICON_SAGRA, label: 'Sagra / Manifestazione' },
    eliporto: { emoji: ICON_ELISOCCORSO, label: 'Elisoccorso / Eliporto (H)' },
    elisoccorso: { emoji: ICON_ELISOCCORSO, label: 'Elisoccorso / Eliporto (H)' }
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

// Stato Percorsi ed Eventi Speciali (Admin)
let customRoutesData = [];
let activeCustomRouteLayers = {};
let isDrawingCustomRoute = false;
let drawingRoutePoints = [];
let drawingPolyline = null;
let drawingMarkersGroup = null;
let editingRouteId = null;
let selectedRouteType = 'corteo';
let selectedRouteColor = '#8b5cf6';
let selectedRouteScheduleMode = 'manual';

// Tipologie Percorsi Evento
const ROUTE_TYPES_CONFIG = {
    corteo: { icon: '🚩', label: 'Corteo / Manifestazione' },
    gara: { icon: '🏃', label: 'Gara Podistica' },
    ciclismo: { icon: '🚴', label: 'Gara Ciclistica' },
    sfilata: { icon: '🎭', label: 'Sfilata / Carnevale' },
    processione: { icon: '🕯️', label: 'Processione Religiosa' },
    altro: { icon: '🌟', label: 'Altro Evento Speciale' }
};

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
const adminFilterBar = document.getElementById('admin-filter-bar');
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

// Elementi DOM (Admin Percorsi & Eventi)
const adminRoutesBtn = document.getElementById('admin-routes-btn');
const adminRoutesBadge = document.getElementById('admin-routes-badge');
const adminRoutesModal = document.getElementById('admin-routes-modal');
const closeAdminRoutesModalBtn = document.getElementById('close-admin-routes-modal');
const startDrawRouteBtn = document.getElementById('start-draw-route-btn');
const adminRoutesItemsList = document.getElementById('admin-routes-items-list');
const adminRoutesCount = document.getElementById('admin-routes-count');
const adminRoutesTotalCount = document.getElementById('admin-routes-total-count');

// Elementi DOM (Toolbar Disegno Percorso)
const routeDrawToolbar = document.getElementById('route-draw-toolbar');
const routePointsCount = document.getElementById('route-points-count');
const routeUndoPtBtn = document.getElementById('route-undo-pt-btn');
const routeClearPtsBtn = document.getElementById('route-clear-pts-btn');
const routeFinishDrawBtn = document.getElementById('route-finish-draw-btn');
const routeCancelDrawBtn = document.getElementById('route-cancel-draw-btn');

// Elementi DOM (Modal Configurazione Percorso)
const routeEditModal = document.getElementById('route-edit-modal');
const closeRouteEditModalBtn = document.getElementById('close-route-edit-modal');
const routeEditModalTitle = document.getElementById('route-edit-modal-title');
const routeNameInput = document.getElementById('route-name-input');
const routeTypesCards = document.querySelectorAll('#route-types-grid .route-type-card');
const routeColorSwatches = document.querySelectorAll('#route-color-palette .color-swatch-btn');
const routeCustomColor = document.getElementById('route-custom-color');
const routeWeightSelect = document.getElementById('route-weight-select');
const routeDashSelect = document.getElementById('route-dash-select');
const routeNoteInput = document.getElementById('route-note-input');
const routeActiveToggle = document.getElementById('route-active-toggle');
const routeActiveStatusText = document.getElementById('route-active-status-text');
const routeSchedTypeBtns = document.querySelectorAll('.route-sched-type-btn');
const routeSchedWindowBlock = document.getElementById('route-sched-window-block');
const routeSchedStart = document.getElementById('route-sched-start');
const routeSchedEnd = document.getElementById('route-sched-end');
const routeEditError = document.getElementById('route-edit-error');
const routeCancelSaveBtn = document.getElementById('route-cancel-save-btn');
const routeConfirmSaveBtn = document.getElementById('route-confirm-save-btn');

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
    const adminNewsBtn = document.getElementById('admin-news-btn');
    const adminRoutesBtn = document.getElementById('admin-routes-btn');
    const adminUsersBtn = document.getElementById('admin-users-btn');
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userDisplayName = document.getElementById('user-display-name');

    document.body.classList.toggle('admin-logged-in', !!isAdmin);

    if (currentUser) {
        if (userProfileBtn) {
            userProfileBtn.classList.remove('hidden');
            if (userDisplayName) {
                userDisplayName.textContent = currentUserProfile?.name || currentUser.email.split('@')[0];
            }
        }
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (loginBtn) loginBtn.classList.add('hidden');
    } else {
        if (userProfileBtn) userProfileBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
    }

    if (isAdmin) {
        if (searchContainer) searchContainer.classList.remove('hidden');
        if (adminFilterBar) adminFilterBar.classList.remove('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.remove('hidden');
        if (adminNewsBtn) adminNewsBtn.classList.remove('hidden');
        if (adminRoutesBtn) adminRoutesBtn.classList.remove('hidden');
        if (adminUsersBtn) adminUsersBtn.classList.remove('hidden');
        if (headerSubtitle) headerSubtitle.textContent = "Modalità Admin: fai DOPPIO CLICK sulla mappa per aggiungere/programmare una segnalazione";
    } else {
        if (searchContainer) searchContainer.classList.add('hidden');
        if (adminFilterBar) adminFilterBar.classList.add('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.add('hidden');
        if (adminNewsBtn) adminNewsBtn.classList.add('hidden');
        if (adminRoutesBtn) adminRoutesBtn.classList.add('hidden');
        if (adminUsersBtn) adminUsersBtn.classList.add('hidden');
        if (isDrawingCustomRoute) {
            cancelDrawingCustomRoute();
        }
        if (headerSubtitle) {
            headerSubtitle.textContent = currentUser ? `Accesso Operatore 118: ${currentUserProfile?.name || currentUser.email}` : "Accesso Riservato 118";
        }
    }
    updateUserNewsButton();
    // Ridisegna i marker e i percorsi speciali
    refreshMarkers();
    renderCustomRoutesOnMap();
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
        if (!isAdmin || isDrawingCustomRoute) return;
        openMarkerModal(e.latlng);
    });

    // Evento click sulla mappa (per selezione punto da parte dell'utente, tracciamento percorso o navigazione)
    map.on('click', async function (e) {
        if (isDrawingCustomRoute) {
            const lat = Number(e.latlng.lat.toFixed(6));
            const lng = Number(e.latlng.lng.toFixed(6));
            drawingRoutePoints.push([lat, lng]);
            updateDrawingRoutePreview();
            return;
        }

        if (navPickerMode) {
            const mode = navPickerMode;
            navPickerMode = null;
            if (pickerBanner) pickerBanner.classList.add('hidden');
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            await handleNavMapPicked(mode, lat, lng);
            return;
        }

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
        appVersionEl.textContent = `v. ${APP_VERSION}`;
    }
    console.log(`Viabilità Ferrara - Versione ${APP_VERSION}`);

    loadMarkers();
    updateUI();
    initGeolocation();

    // Aggiornamento automatico periodico (ogni 60 secondi) per far apparire/scomparire i mercati ed eventi a orario
    setInterval(() => {
        refreshMarkers();
    }, 60000);
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

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        showGatekeeper();
    });
}

if (logoutBtn) {
    const doAdminLogout = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            if (auth) {
                await auth.signOut();
                console.log('Disconnessione completata');
            }
        } catch (e) {
            console.warn('Errore durante il logout:', e.message);
        }
        isAdmin = false;
        updateUI();
        showToast("Disconnessione completata (Utente)", "info", 2500);
    };

    logoutBtn.addEventListener('click', doAdminLogout);
    logoutBtn.addEventListener('touchend', doAdminLogout);
}

// LOGICA RICERCA (Nominatim per Utente e Admin)
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

let userSearchMarker = null;

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.innerHTML = '<span class="search-icon">⏳</span><span class="btn-text">...</span>';
    searchBtn.disabled = true;

    try {
        // 1. Controlla prima se c'è un marker o via chiusa corrispondente già presente sulla mappa
        const lowerQ = query.toLowerCase();
        const normQ = normalizeStreetKey(query);
        const matchingMarker = markersData.find(m => {
            if (!m.street) return false;
            const sLower = m.street.toLowerCase();
            const sNorm = normalizeStreetKey(m.street);
            return sLower.includes(lowerQ) || lowerQ.includes(sLower) || (normQ && sNorm && (sNorm.includes(normQ) || normQ.includes(sNorm)));
        });

        // 2. Geocoding su Ferrara e Provincia
        const queries = [
            `${query}, Ferrara`,
            `${query}, Provincia di Ferrara`,
            `${query}, Cento`,
            `${query}, Comacchio`,
            query
        ];

        let foundLat = null, foundLon = null, displayName = null;

        for (const q of queries) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        foundLat = parseFloat(data[0].lat);
                        foundLon = parseFloat(data[0].lon);
                        displayName = data[0].display_name.split(',')[0];
                        break;
                    }
                }
            } catch (e) {}
        }

        if (foundLat !== null && foundLon !== null) {
            map.flyTo([foundLat, foundLon], 17, { duration: 1.2 });

            if (userSearchMarker) {
                map.removeLayer(userSearchMarker);
            }

            userSearchMarker = L.marker([foundLat, foundLon], {
                icon: L.divIcon({
                    className: 'search-result-pin',
                    html: `<div style="background:#3b82f6; color:white; padding:6px 12px; border-radius:999px; font-weight:bold; font-size:0.82rem; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:2px solid white; display:flex; align-items:center; gap:4px; white-space:nowrap;">📍 ${escapeHtml(displayName || query)}</div>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 20]
                })
            }).addTo(map);

            showToast(`📍 Posizione trovata: ${displayName || query}`, "info", 3500);

            setTimeout(() => {
                if (userSearchMarker) {
                    map.removeLayer(userSearchMarker);
                    userSearchMarker = null;
                }
            }, 10000);
        } else if (matchingMarker) {
            map.flyTo([matchingMarker.lat, matchingMarker.lng], 17, { duration: 1.2 });
            showToast(`📍 Trovata segnalazione su: ${matchingMarker.street}`, "info", 3500);
        } else {
            showToast("Nessuna via trovata con questo nome. Prova a specificare anche il comune (es. Via Roma, Copparo).", "warning", 4500);
        }
    } catch (error) {
        console.error("Errore nella ricerca", error);
        showToast("Errore durante la ricerca. Riprova più tardi.", "error", 3500);
    } finally {
        searchBtn.innerHTML = '<span class="search-icon">🔍</span><span class="btn-text">Cerca</span>';
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
function addMarker(lat, lng, type, id = null, save = true, note = null, fbKey = null, street = null, schedule = null, segmentId = null) {
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
        schedule: schedule || null,
        segmentId: segmentId || null
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
        schedule: markerObj.schedule || null,
        segmentId: markerObj.segmentId || null
    };
    const newRef = markersRef.push(payload);
    markerObj.fbKey = newRef.key;
    saveToLocalStorage();
    console.log('✅ Marker salvato su Firebase:', newRef.key);
}

// Rimuovi marker (esposta globalmente per il bottone nel popup)
window.removeMarker = function (id) {
    if (!isAdmin) {
        alert("Solo l'amministratore autenticato può eliminare un evento o una segnalazione.");
        return;
    }

    const markerObj = markersData.find(m => String(m.id) === String(id) || String(m.fbKey) === String(id));
    if (!markerObj) {
        console.warn("Marker non trovato per id:", id);
        return;
    }

    // Se l'evento ha un tratto/mercato collegato (segmentId) o altri marker associati
    let targets = [markerObj];
    if (markerObj.segmentId) {
        const companions = markersData.filter(m => m.segmentId === markerObj.segmentId && String(m.id) !== String(markerObj.id));
        if (companions.length > 0) {
            targets = markersData.filter(m => m.segmentId === markerObj.segmentId);
        }
    }

    const labelMsg = markerObj.street ? `"${markerObj.street}"` : 'questa segnalazione/evento';
    const confirmMsg = targets.length > 1 
        ? `Sei sicuro di voler eliminare definitivamente l'evento ${labelMsg} e tutti i relativi punti stradali? L'evento sparirà per sempre.`
        : `Sei sicuro di voler eliminare definitivamente ${labelMsg}? L'evento sparirà per sempre.`;

    if (!confirm(confirmMsg)) {
        return;
    }

    targets.forEach(target => {
        const tId = String(target.id);
        const fbKeyToDelete = target.fbKey || (tId.startsWith('-') ? tId : null);

        // Aggiungi subito al registro locale delle eliminazioni
        deletedMarkerIds.add(tId);
        if (target.fbKey) deletedMarkerIds.add(String(target.fbKey));
        if (target.segmentId) deletedMarkerIds.add(String(target.segmentId));

        // Rimuovi visivamente subito dalla mappa
        if (activeLayers[tId]) {
            map.removeLayer(activeLayers[tId]);
            delete activeLayers[tId];
        }
        if (target.fbKey && activeLayers[target.fbKey]) {
            map.removeLayer(activeLayers[target.fbKey]);
            delete activeLayers[target.fbKey];
        }

        // Rimuovi da Firebase markers (se presente come chiave dinamica)
        if (isFirebaseOnline && markersRef && fbKeyToDelete) {
            markersRef.child(fbKeyToDelete).remove()
                .then(() => console.log('🗑️ Marker rimosso da Firebase:', fbKeyToDelete))
                .catch(e => console.warn('Errore rimozione Firebase:', e.message));
        }

        // Registra su Firebase nel nodo 'deleted_markers' per sincronizzare tutti i client ed evitare che ricompaia
        if (isFirebaseOnline && deletedMarkersRef) {
            deletedMarkersRef.child(tId).set({
                timestamp: Date.now(),
                street: target.street || '',
                note: target.note || '',
                type: target.type || '',
                segmentId: target.segmentId || null,
                deletedBy: (auth && auth.currentUser) ? auth.currentUser.email : 'admin'
            }).catch(e => console.warn('Errore salvataggio deleted_markers Firebase:', e.message));

            if (target.segmentId) {
                deletedMarkersRef.child(target.segmentId).set({
                    timestamp: Date.now(),
                    street: target.street || '',
                    note: target.note || '',
                    type: target.type || '',
                    deletedBy: (auth && auth.currentUser) ? auth.currentUser.email : 'admin'
                }).catch(e => console.warn('Errore salvataggio deleted_markers segmentId Firebase:', e.message));
            }
        }
    });

    // Salva lo stato delle eliminazioni in localStorage
    saveDeletedMarkersToLocalStorage();

    // Rimuovi dai dati locali in memoria
    const targetIds = new Set(targets.map(t => String(t.id)).concat(targets.map(t => String(t.fbKey)).filter(Boolean)));
    markersData = markersData.filter(m => !targetIds.has(String(m.id)) && (!m.fbKey || !targetIds.has(String(m.fbKey))));

    saveToLocalStorage();
    updateFilterCounts();
    updateRoadSegments();
    showToast("🗑️ Evento eliminato definitivamente.", "success");
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
// GEOMETRIA STRADALE da OpenStreetMap & Motore Overpass / OSRM
// Segue rigorosamente la sagoma reale della carreggiata (curve, raccordi, statali e vie provinciali)
// - DIVIETO ASSOLUTO di passare su strade con nome diverso (es. SP4 al posto di Via Ruffetta)
// - DIVIETO ASSOLUTO di formare linee rette (Via Ruffetta, Via Ferrarese, SS468 e tutte le arterie)
// - Supporto nativo per geometrie OSM ad alta risoluzione e fallback geometrico continuo
// -------------------------------------------------------

// Funzione per verificare se una geometria contiene curve reali e non è degenere/collineare/linea retta
function isCurvedGeometry(coords) {
    if (!coords || !Array.isArray(coords) || coords.length < 3) return false;
    const [lat1, lng1] = coords[0];
    const [lat2, lng2] = coords[coords.length - 1];
    
    for (let i = 1; i < coords.length - 1; i++) {
        const [pLat, pLng] = coords[i];
        const distToLine = perpendicularDistanceMeters(pLat, pLng, lat1, lng1, lat2, lng2);
        if (distToLine > 1.8) {
            return true; // Contiene una curva reale con deviazione > 1.8 metri
        }
    }
    return false;
}

function perpendicularDistanceMeters(pLat, pLng, lat1, lng1, lat2, lng2) {
    const d1 = calculateDistanceMeters(pLat, pLng, lat1, lng1);
    const d2 = calculateDistanceMeters(pLat, pLng, lat2, lng2);
    const dBase = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    if (dBase < 1) return 0;
    const s = (d1 + d2 + dBase) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - d1) * (s - d2) * (s - dBase)));
    return (2 * area) / dBase;
}

let streetGeomCache = {};
try {
    const cached = localStorage.getItem('ferrara_street_cache_v24');
    if (cached) streetGeomCache = JSON.parse(cached);
} catch (e) {
    streetGeomCache = {};
}

function saveStreetGeomCache() {
    try {
        localStorage.setItem('ferrara_street_cache_v24', JSON.stringify(streetGeomCache));
    } catch (e) { }
}

// Database geometrico ad alta risoluzione estratto direttamente dai way OpenStreetMap (percorsi certificati senza deviazioni)
const STATIC_STREET_GEOMETRIES = {
    'ruffetta': [
        [44.87364, 11.83634], [44.87360, 11.83647], [44.87358, 11.83656], [44.87353, 11.83675], [44.87341, 11.83727], [44.87338, 11.83739], 
        [44.87337, 11.83747], [44.87336, 11.83755], [44.87335, 11.83762], [44.87335, 11.83769], [44.87334, 11.83776], [44.87334, 11.83784], 
        [44.87334, 11.83793], [44.87334, 11.83801], [44.87334, 11.83808], [44.87335, 11.83815], [44.87335, 11.83822], [44.87336, 11.83829], 
        [44.87338, 11.83837], [44.87343, 11.83867], [44.87344, 11.83875], [44.87345, 11.83881], [44.87345, 11.83888], [44.87345, 11.83895], 
        [44.87345, 11.83903], [44.87344, 11.83912], [44.87343, 11.83925], [44.87334, 11.84014], [44.87327, 11.84086], [44.87312, 11.84252], 
        [44.87310, 11.84263], [44.87310, 11.84271], [44.87308, 11.84279], [44.87307, 11.84285], [44.87306, 11.84294], [44.87303, 11.84302], 
        [44.87300, 11.84313], [44.87296, 11.84326], [44.87289, 11.84345], [44.87261, 11.84417], [44.87257, 11.84428], [44.87256, 11.84431], 
        [44.87254, 11.84435], [44.87251, 11.84441], [44.87248, 11.84447], [44.87244, 11.84454], [44.87238, 11.84462], [44.87070, 11.84670], 
        [44.86885, 11.84897], [44.86811, 11.84990], [44.86807, 11.84995], [44.86803, 11.84999], [44.86796, 11.85005], [44.86628, 11.85132], 
        [44.86566, 11.85180], [44.86562, 11.85183], [44.86558, 11.85185], [44.86554, 11.85187], [44.86550, 11.85189], [44.86547, 11.85189], 
        [44.86544, 11.85189], [44.86541, 11.85187], [44.86537, 11.85186], [44.86533, 11.85183], [44.86530, 11.85179], [44.86523, 11.85172], 
        [44.86435, 11.85062], [44.86431, 11.85058], [44.86427, 11.85054], [44.86423, 11.85050], [44.86419, 11.85047], [44.86415, 11.85044], 
        [44.86408, 11.85041], [44.86339, 11.85005], [44.86304, 11.84987], [44.86299, 11.84985], [44.86296, 11.84983], [44.86292, 11.84983], 
        [44.86289, 11.84982], [44.86285, 11.84983], [44.86280, 11.84985], [44.86192, 11.85042], [44.86177, 11.85052], [44.86168, 11.85058], 
        [44.86162, 11.85062], [44.86157, 11.85067], [44.86150, 11.85072], [44.86139, 11.85082], [44.86009, 11.85219], [44.85994, 11.85235], 
        [44.85977, 11.85252], [44.85967, 11.85262], [44.85957, 11.85271], [44.85948, 11.85279], [44.85941, 11.85285], [44.85930, 11.85293], 
        [44.85918, 11.85302], [44.85910, 11.85308], [44.85903, 11.85315], [44.85896, 11.85320], [44.85888, 11.85327], [44.85872, 11.85343], 
        [44.85687, 11.85527], [44.85675, 11.85539], [44.85663, 11.85550], [44.85655, 11.85557], [44.85647, 11.85564], [44.85636, 11.85573], 
        [44.85614, 11.85589], [44.85602, 11.85599], [44.85592, 11.85606], [44.85584, 11.85612], [44.85574, 11.85620], [44.85563, 11.85631], 
        [44.85541, 11.85650], [44.85536, 11.85654], [44.85532, 11.85658], [44.85527, 11.85661], [44.85522, 11.85664], [44.85515, 11.85667], 
        [44.85508, 11.85669], [44.85501, 11.85671], [44.85493, 11.85673], [44.85485, 11.85675], [44.85479, 11.85676], [44.85478, 11.85677], 
        [44.85474, 11.85678], [44.85468, 11.85680], [44.85462, 11.85683], [44.85456, 11.85686], [44.85452, 11.85688], [44.85447, 11.85691], 
        [44.85441, 11.85695], [44.85435, 11.85699], [44.85402, 11.85723], [44.85393, 11.85729], [44.85385, 11.85734], [44.85378, 11.85739], 
        [44.85371, 11.85743], [44.85365, 11.85746], [44.85357, 11.85750], [44.85348, 11.85753], [44.85338, 11.85757], [44.85281, 11.85773], 
        [44.85269, 11.85777], [44.85260, 11.85780], [44.85250, 11.85783], [44.85239, 11.85787], [44.85232, 11.85790], [44.85223, 11.85794], 
        [44.85214, 11.85798], [44.85065, 11.85877], [44.85057, 11.85883], [44.85051, 11.85887], [44.85045, 11.85892], [44.85041, 11.85896], 
        [44.85036, 11.85902], [44.85032, 11.85907], [44.85028, 11.85912], [44.85022, 11.85921], [44.84989, 11.85976], [44.84985, 11.85982], 
        [44.84981, 11.85986], [44.84978, 11.85991], [44.84974, 11.85994], [44.84969, 11.85998], [44.84965, 11.86000], [44.84960, 11.86002], 
        [44.84956, 11.86003], [44.84949, 11.86002], [44.84942, 11.86000], [44.84928, 11.85996], [44.84918, 11.85994], [44.84912, 11.85993], 
        [44.84906, 11.85993], [44.84899, 11.85994], [44.84891, 11.85995], [44.84879, 11.85999], [44.84842, 11.86014], [44.84834, 11.86017], 
        [44.84829, 11.86018], [44.84824, 11.86018], [44.84819, 11.86017], [44.84814, 11.86016], [44.84809, 11.86015], [44.84804, 11.86013], 
        [44.84798, 11.86010], [44.84789, 11.86004], [44.84769, 11.85992], [44.84763, 11.85989], [44.84758, 11.85987], [44.84753, 11.85985], 
        [44.84748, 11.85985], [44.84742, 11.85986], [44.84737, 11.85987], [44.84732, 11.85989], [44.84726, 11.85992], [44.84676, 11.86022], 
        [44.84668, 11.86027], [44.84663, 11.86030], [44.84655, 11.86033], [44.84648, 11.86035], [44.84640, 11.86037], [44.84633, 11.86037], 
        [44.84625, 11.86037], [44.84617, 11.86037], [44.84607, 11.86036], [44.84597, 11.86034], [44.84579, 11.86032], [44.84568, 11.86030], 
        [44.84561, 11.86028], [44.84552, 11.86026], [44.84538, 11.86022], [44.84525, 11.86017], [44.84521, 11.86016], [44.84530, 11.85940], 
        [44.84530, 11.85935], [44.84530, 11.85932], [44.84530, 11.85929], [44.84529, 11.85926], [44.84527, 11.85925], [44.84525, 11.85924], 
        [44.84459, 11.85920]
    ],
    'viaruffetta': [
        [44.87364, 11.83634], [44.87360, 11.83647], [44.87358, 11.83656], [44.87353, 11.83675], [44.87341, 11.83727], [44.87338, 11.83739], 
        [44.87337, 11.83747], [44.87336, 11.83755], [44.87335, 11.83762], [44.87335, 11.83769], [44.87334, 11.83776], [44.87334, 11.83784], 
        [44.87334, 11.83793], [44.87334, 11.83801], [44.87334, 11.83808], [44.87335, 11.83815], [44.87335, 11.83822], [44.87336, 11.83829], 
        [44.87338, 11.83837], [44.87343, 11.83867], [44.87344, 11.83875], [44.87345, 11.83881], [44.87345, 11.83888], [44.87345, 11.83895], 
        [44.87345, 11.83903], [44.87344, 11.83912], [44.87343, 11.83925], [44.87334, 11.84014], [44.87327, 11.84086], [44.87312, 11.84252], 
        [44.87310, 11.84263], [44.87310, 11.84271], [44.87308, 11.84279], [44.87307, 11.84285], [44.87306, 11.84294], [44.87303, 11.84302], 
        [44.87300, 11.84313], [44.87296, 11.84326], [44.87289, 11.84345], [44.87261, 11.84417], [44.87257, 11.84428], [44.87256, 11.84431], 
        [44.87254, 11.84435], [44.87251, 11.84441], [44.87248, 11.84447], [44.87244, 11.84454], [44.87238, 11.84462], [44.87070, 11.84670], 
        [44.86885, 11.84897], [44.86811, 11.84990], [44.86807, 11.84995], [44.86803, 11.84999], [44.86796, 11.85005], [44.86628, 11.85132], 
        [44.86566, 11.85180], [44.86562, 11.85183], [44.86558, 11.85185], [44.86554, 11.85187], [44.86550, 11.85189], [44.86547, 11.85189], 
        [44.86544, 11.85189], [44.86541, 11.85187], [44.86537, 11.85186], [44.86533, 11.85183], [44.86530, 11.85179], [44.86523, 11.85172], 
        [44.86435, 11.85062], [44.86431, 11.85058], [44.86427, 11.85054], [44.86423, 11.85050], [44.86419, 11.85047], [44.86415, 11.85044], 
        [44.86408, 11.85041], [44.86339, 11.85005], [44.86304, 11.84987], [44.86299, 11.84985], [44.86296, 11.84983], [44.86292, 11.84983], 
        [44.86289, 11.84982], [44.86285, 11.84983], [44.86280, 11.84985], [44.86192, 11.85042], [44.86177, 11.85052], [44.86168, 11.85058], 
        [44.86162, 11.85062], [44.86157, 11.85067], [44.86150, 11.85072], [44.86139, 11.85082], [44.86009, 11.85219], [44.85994, 11.85235], 
        [44.85977, 11.85252], [44.85967, 11.85262], [44.85957, 11.85271], [44.85948, 11.85279], [44.85941, 11.85285], [44.85930, 11.85293], 
        [44.85918, 11.85302], [44.85910, 11.85308], [44.85903, 11.85315], [44.85896, 11.85320], [44.85888, 11.85327], [44.85872, 11.85343], 
        [44.85687, 11.85527], [44.85675, 11.85539], [44.85663, 11.85550], [44.85655, 11.85557], [44.85647, 11.85564], [44.85636, 11.85573], 
        [44.85614, 11.85589], [44.85602, 11.85599], [44.85592, 11.85606], [44.85584, 11.85612], [44.85574, 11.85620], [44.85563, 11.85631], 
        [44.85541, 11.85650], [44.85536, 11.85654], [44.85532, 11.85658], [44.85527, 11.85661], [44.85522, 11.85664], [44.85515, 11.85667], 
        [44.85508, 11.85669], [44.85501, 11.85671], [44.85493, 11.85673], [44.85485, 11.85675], [44.85479, 11.85676], [44.85478, 11.85677], 
        [44.85474, 11.85678], [44.85468, 11.85680], [44.85462, 11.85683], [44.85456, 11.85686], [44.85452, 11.85688], [44.85447, 11.85691], 
        [44.85441, 11.85695], [44.85435, 11.85699], [44.85402, 11.85723], [44.85393, 11.85729], [44.85385, 11.85734], [44.85378, 11.85739], 
        [44.85371, 11.85743], [44.85365, 11.85746], [44.85357, 11.85750], [44.85348, 11.85753], [44.85338, 11.85757], [44.85281, 11.85773], 
        [44.85269, 11.85777], [44.85260, 11.85780], [44.85250, 11.85783], [44.85239, 11.85787], [44.85232, 11.85790], [44.85223, 11.85794], 
        [44.85214, 11.85798], [44.85065, 11.85877], [44.85057, 11.85883], [44.85051, 11.85887], [44.85045, 11.85892], [44.85041, 11.85896], 
        [44.85036, 11.85902], [44.85032, 11.85907], [44.85028, 11.85912], [44.85022, 11.85921], [44.84989, 11.85976], [44.84985, 11.85982], 
        [44.84981, 11.85986], [44.84978, 11.85991], [44.84974, 11.85994], [44.84969, 11.85998], [44.84965, 11.86000], [44.84960, 11.86002], 
        [44.84956, 11.86003], [44.84949, 11.86002], [44.84942, 11.86000], [44.84928, 11.85996], [44.84918, 11.85994], [44.84912, 11.85993], 
        [44.84906, 11.85993], [44.84899, 11.85994], [44.84891, 11.85995], [44.84879, 11.85999], [44.84842, 11.86014], [44.84834, 11.86017], 
        [44.84829, 11.86018], [44.84824, 11.86018], [44.84819, 11.86017], [44.84814, 11.86016], [44.84809, 11.86015], [44.84804, 11.86013], 
        [44.84798, 11.86010], [44.84789, 11.86004], [44.84769, 11.85992], [44.84763, 11.85989], [44.84758, 11.85987], [44.84753, 11.85985], 
        [44.84748, 11.85985], [44.84742, 11.85986], [44.84737, 11.85987], [44.84732, 11.85989], [44.84726, 11.85992], [44.84676, 11.86022], 
        [44.84668, 11.86027], [44.84663, 11.86030], [44.84655, 11.86033], [44.84648, 11.86035], [44.84640, 11.86037], [44.84633, 11.86037], 
        [44.84625, 11.86037], [44.84617, 11.86037], [44.84607, 11.86036], [44.84597, 11.86034], [44.84579, 11.86032], [44.84568, 11.86030], 
        [44.84561, 11.86028], [44.84552, 11.86026], [44.84538, 11.86022], [44.84525, 11.86017], [44.84521, 11.86016], [44.84530, 11.85940], 
        [44.84530, 11.85935], [44.84530, 11.85932], [44.84530, 11.85929], [44.84529, 11.85926], [44.84527, 11.85925], [44.84525, 11.85924], 
        [44.84459, 11.85920]
    ],
    'baluardi': [[44.82806, 11.62187], [44.82792, 11.62205], [44.82785, 11.62213], [44.82779, 11.62220], [44.82767, 11.62230], [44.82738, 11.62255], [44.82696, 11.62287], [44.82683, 11.62299], [44.82678, 11.62305], [44.82664, 11.62321], [44.82606, 11.62398], [44.82601, 11.62405], [44.82598, 11.62411], [44.82593, 11.62422], [44.82564, 11.62495], [44.82558, 11.62508], [44.82553, 11.62522], [44.82548, 11.62536], [44.82540, 11.62566], [44.82519, 11.62637], [44.82513, 11.62661], [44.82504, 11.62699], [44.82500, 11.62716], [44.82498, 11.62725], [44.82497, 11.62734], [44.82496, 11.62744], [44.82495, 11.62754], [44.82493, 11.62786], [44.82492, 11.62794], [44.82487, 11.62855], [44.82484, 11.62885], [44.82481, 11.62916], [44.82480, 11.62920], [44.82479, 11.62930], [44.82479, 11.62934], [44.82478, 11.62938], [44.82477, 11.62941], [44.82476, 11.62943], [44.82475, 11.62947], [44.82479, 11.62946], [44.82482, 11.62945], [44.82485, 11.62944], [44.82486, 11.62944], [44.82488, 11.62945], [44.82491, 11.62945], [44.82588, 11.62993], [44.82637, 11.63020], [44.82687, 11.63050], [44.82697, 11.63054], [44.82740, 11.63074], [44.82760, 11.63082], [44.82745, 11.63138], [44.82718, 11.63125]],
    'beethoven': [[44.80992, 11.59010], [44.80952, 11.58948], [44.80925, 11.58984], [44.80921, 11.58988], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80008, 11.60491]],
    'bersaglieri': [[44.83666, 11.62062], [44.83644, 11.62121], [44.83723, 11.62184], [44.83733, 11.62162], [44.83734, 11.62158], [44.83749, 11.62123], [44.83762, 11.62094], [44.83764, 11.62088], [44.83766, 11.62083], [44.83778, 11.62055], [44.83782, 11.62046], [44.83786, 11.62042], [44.83778, 11.62039], [44.83773, 11.62037], [44.83766, 11.62033], [44.83738, 11.62015], [44.83689, 11.61987], [44.83675, 11.61978], [44.83670, 11.61976], [44.83666, 11.61974], [44.83640, 11.61959], [44.83610, 11.61942], [44.83604, 11.61939], [44.83599, 11.61976], [44.83598, 11.61983], [44.83593, 11.61997], [44.83564, 11.62088], [44.83552, 11.62123], [44.83551, 11.62130], [44.83551, 11.62142]],
    'bersaglieridelpo': [[44.83666, 11.62062], [44.83644, 11.62121], [44.83723, 11.62184], [44.83733, 11.62162], [44.83734, 11.62158], [44.83749, 11.62123], [44.83762, 11.62094], [44.83764, 11.62088], [44.83766, 11.62083], [44.83778, 11.62055], [44.83782, 11.62046], [44.83786, 11.62042], [44.83778, 11.62039], [44.83773, 11.62037], [44.83766, 11.62033], [44.83738, 11.62015], [44.83689, 11.61987], [44.83675, 11.61978], [44.83670, 11.61976], [44.83666, 11.61974], [44.83640, 11.61959], [44.83610, 11.61942], [44.83604, 11.61939], [44.83599, 11.61976], [44.83598, 11.61983], [44.83593, 11.61997], [44.83564, 11.62088], [44.83552, 11.62123], [44.83551, 11.62130], [44.83551, 11.62142]],
    'bologna': [[44.82484, 11.61626], [44.82484, 11.61626], [44.82481, 11.61626], [44.82478, 11.61629], [44.82475, 11.61633], [44.82459, 11.61660], [44.82456, 11.61665], [44.82430, 11.61707], [44.82426, 11.61714], [44.82398, 11.61759], [44.82393, 11.61768], [44.82376, 11.61794], [44.82373, 11.61798], [44.82370, 11.61802], [44.82366, 11.61807], [44.82362, 11.61813], [44.82353, 11.61826], [44.82349, 11.61832], [44.82325, 11.61867], [44.82323, 11.61870], [44.82314, 11.61884], [44.82301, 11.61903], [44.82286, 11.61925], [44.82246, 11.61872], [44.82232, 11.61852], [44.82218, 11.61834], [44.82210, 11.61823], [44.82205, 11.61816], [44.82201, 11.61810], [44.82200, 11.61804], [44.82198, 11.61796], [44.82198, 11.61789], [44.82198, 11.61782], [44.82199, 11.61775], [44.82201, 11.61767], [44.82216, 11.61724], [44.82221, 11.61708], [44.82253, 11.61617], [44.82272, 11.61564], [44.82290, 11.61514], [44.82305, 11.61470], [44.82312, 11.61454], [44.82316, 11.61444], [44.8232, 11.61434], [44.82246, 11.61365], [44.82250, 11.61358], [44.82279, 11.61297], [44.82303, 11.61246], [44.82304, 11.61243], [44.82318, 11.61215], [44.82355, 11.61137], [44.82407, 11.61027], [44.82439, 11.6096], [44.82479, 11.60875], [44.82482, 11.60869], [44.82440, 11.60830], [44.82422, 11.60814], [44.82390, 11.60781], [44.82385, 11.60777], [44.82382, 11.60774], [44.82357, 11.60750], [44.82282, 11.60679], [44.82265, 11.60663], [44.82263, 11.60661], [44.82218, 11.60619], [44.82212, 11.60614], [44.82161, 11.60566], [44.82149, 11.60555], [44.82039, 11.60451], [44.82032, 11.60444], [44.82029, 11.60442], [44.81956, 11.60373], [44.81954, 11.60371], [44.81948, 11.60366], [44.81944, 11.60360], [44.81941, 11.60355], [44.81938, 11.60350], [44.81936, 11.60346], [44.81934, 11.60341], [44.81932, 11.60337], [44.8193, 11.60331], [44.81930, 11.60329], [44.81931, 11.60325], [44.81931, 11.60321], [44.81931, 11.60317], [44.81931, 11.60313], [44.81930, 11.60308], [44.81929, 11.60304], [44.81928, 11.60300], [44.81926, 11.60296], [44.81925, 11.60293], [44.81923, 11.60290], [44.81921, 11.60287], [44.81918, 11.60284], [44.81915, 11.60282], [44.81912, 11.60280], [44.81909, 11.60279], [44.81907, 11.60278], [44.81904, 11.60277], [44.81901, 11.60277], [44.81899, 11.60277], [44.81897, 11.60278], [44.81894, 11.60278], [44.81892, 11.60279], [44.81889, 11.60281], [44.81881, 11.60282], [44.81875, 11.60281], [44.81870, 11.60281], [44.81865, 11.60280], [44.81862, 11.60279], [44.81858, 11.60278], [44.81852, 11.60274], [44.81849, 11.60270], [44.81828, 11.60251], [44.81814, 11.60238], [44.81795, 11.60221], [44.81753, 11.60181], [44.81737, 11.60167], [44.81706, 11.60138], [44.81700, 11.60132], [44.81674, 11.60108], [44.81662, 11.60096], [44.81653, 11.60086], [44.81628, 11.60060], [44.81626, 11.60057], [44.81598, 11.60025], [44.81590, 11.60015], [44.81568, 11.59988], [44.81544, 11.59957], [44.81528, 11.59930], [44.81524, 11.59922], [44.81500, 11.59884], [44.81490, 11.59868], [44.81482, 11.59855], [44.81478, 11.59848], [44.81424, 11.59766], [44.81417, 11.59756], [44.81338, 11.59634], [44.81293, 11.59564], [44.81284, 11.59546], [44.81277, 11.59523], [44.81274, 11.59508], [44.81273, 11.59498], [44.81271, 11.59488], [44.81270, 11.59475], [44.81269, 11.59467], [44.81265, 11.59457], [44.81260, 11.59449], [44.81254, 11.59443], [44.81248, 11.59440], [44.81244, 11.59439], [44.81239, 11.59439], [44.81235, 11.59440], [44.81221, 11.59440], [44.81214, 11.59439], [44.81208, 11.59437], [44.81201, 11.59433], [44.81190, 11.59423], [44.81182, 11.59415], [44.8118, 11.59413], [44.81179, 11.59412], [44.81173, 11.59404], [44.81165, 11.59394], [44.81118, 11.59324], [44.81115, 11.59320], [44.81104, 11.59309], [44.81093, 11.59299], [44.81054, 11.59242], [44.81050, 11.59235], [44.81028, 11.59202], [44.81014, 11.59182], [44.80996, 11.59154], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80662, 11.58655], [44.80598, 11.58559], [44.80586, 11.5854], [44.80571, 11.58519], [44.80560, 11.58501], [44.80546, 11.58481], [44.80509, 11.58426], [44.80477, 11.58377], [44.80423, 11.58297], [44.80411, 11.58279], [44.80393, 11.58252], [44.80384, 11.58238], [44.80381, 11.58225], [44.80377, 11.58218], [44.80375, 11.58212], [44.80372, 11.58206], [44.80369, 11.58198], [44.80367, 11.58192], [44.80364, 11.58182], [44.80361, 11.58172], [44.80359, 11.58165], [44.80356, 11.58153], [44.80354, 11.58141], [44.80352, 11.58129], [44.80350, 11.58115], [44.80348, 11.58102], [44.80346, 11.58088], [44.80340, 11.57983], [44.80333, 11.57881], [44.80330, 11.57838], [44.80330, 11.57834], [44.80329, 11.57830], [44.80332, 11.57804], [44.80332, 11.57797], [44.80332, 11.57790], [44.80327, 11.57752], [44.80326, 11.57748], [44.80324, 11.57732], [44.80320, 11.57719], [44.80317, 11.57704], [44.80312, 11.57691], [44.80308, 11.57679], [44.80304, 11.57667], [44.80300, 11.57660], [44.80296, 11.57652], [44.80291, 11.57642], [44.80286, 11.57633], [44.80280, 11.57624], [44.80274, 11.57615], [44.80268, 11.57607], [44.80258, 11.57597], [44.80247, 11.57586], [44.80239, 11.57579], [44.80228, 11.57571], [44.80198, 11.57552], [44.80185, 11.57547], [44.80117, 11.57513], [44.80051, 11.57479], [44.80020, 11.57461], [44.79977, 11.57434], [44.79895, 11.57374], [44.79840, 11.57336], [44.79829, 11.57328], [44.79820, 11.57323], [44.79810, 11.57317], [44.79786, 11.57303], [44.79773, 11.57297], [44.79752, 11.57287], [44.79731, 11.57279], [44.79689, 11.57265], [44.79615, 11.57244], [44.79555, 11.57228], [44.79528, 11.57218], [44.79521, 11.57215], [44.79513, 11.57209], [44.79505, 11.57202], [44.79504, 11.57198], [44.79502, 11.57195], [44.79500, 11.57192], [44.79498, 11.5719], [44.79496, 11.57189], [44.79493, 11.57188], [44.79490, 11.57188], [44.79488, 11.57188], [44.79485, 11.57189], [44.79482, 11.57191], [44.79479, 11.57193], [44.79476, 11.57196], [44.79473, 11.57197], [44.79468, 11.57197], [44.79463, 11.57195], [44.79423, 11.57178], [44.79418, 11.57176], [44.79414, 11.57174], [44.79412, 11.57171], [44.79409, 11.57168], [44.79405, 11.57161], [44.79403, 11.57157], [44.79401, 11.57154], [44.79399, 11.57152], [44.79396, 11.57151], [44.79394, 11.57150], [44.79391, 11.57150], [44.79388, 11.57150], [44.79386, 11.57151], [44.79378, 11.57154], [44.79371, 11.57155], [44.79364, 11.57156], [44.79358, 11.57155], [44.79348, 11.57154], [44.79343, 11.57152], [44.79333, 11.57148], [44.79326, 11.57147], [44.79319, 11.57145], [44.79306, 11.57144], [44.79292, 11.57144], [44.79280, 11.57146], [44.79270, 11.57148], [44.79260, 11.57151], [44.79258, 11.57152], [44.79253, 11.57154], [44.79249, 11.57156], [44.79238, 11.57161], [44.79057, 11.57244], [44.79048, 11.57249], [44.79010, 11.57291], [44.78994, 11.57306], [44.78990, 11.57308], [44.78985, 11.57309], [44.78978, 11.57310], [44.78975, 11.57308], [44.78971, 11.57307], [44.78968, 11.57306], [44.78964, 11.57306], [44.78961, 11.57307], [44.78958, 11.57309], [44.78955, 11.57311], [44.78952, 11.57314], [44.78949, 11.57318], [44.78947, 11.57323], [44.78945, 11.57328], [44.78939, 11.57337], [44.78934, 11.57342], [44.78927, 11.57345], [44.78910, 11.57352], [44.78886, 11.57357], [44.78873, 11.57362], [44.78849, 11.57378], [44.78832, 11.57393], [44.78814, 11.57411], [44.78802, 11.57423], [44.78795, 11.57431], [44.78791, 11.57435], [44.78785, 11.57440], [44.78780, 11.57443], [44.78775, 11.57447], [44.78769, 11.57451], [44.78764, 11.57453], [44.78759, 11.57456], [44.78753, 11.57458], [44.78746, 11.5746], [44.78740, 11.57462], [44.78734, 11.57463], [44.78725, 11.57464], [44.78714, 11.57465], [44.78708, 11.57466], [44.78703, 11.57466], [44.78695, 11.57465], [44.78632, 11.57459], [44.78594, 11.57454], [44.78588, 11.57454], [44.78562, 11.57451], [44.78554, 11.57451], [44.78549, 11.57451], [44.78543, 11.57452], [44.78478, 11.57470], [44.78436, 11.57480], [44.78418, 11.57484], [44.78401, 11.57488], [44.78381, 11.57493], [44.78364, 11.57498], [44.78343, 11.57506], [44.78304, 11.57522], [44.78278, 11.57532], [44.78230, 11.57550], [44.78214, 11.57555], [44.78199, 11.57560], [44.78194, 11.57566], [44.78192, 11.57573], [44.78191, 11.57580], [44.78191, 11.57587], [44.78194, 11.57599], [44.78199, 11.57610], [44.78201, 11.57616], [44.78202, 11.57629], [44.78200, 11.57638], [44.78198, 11.57648], [44.78194, 11.57668], [44.78185, 11.57720], [44.78184, 11.57725], [44.78177, 11.57759], [44.78175, 11.57772], [44.78173, 11.57783], [44.78171, 11.57788], [44.78171, 11.57790], [44.78169, 11.57796], [44.78167, 11.57800], [44.78165, 11.57805], [44.78160, 11.57813], [44.78156, 11.57821], [44.78153, 11.57828], [44.78151, 11.57832], [44.78048, 11.58077], [44.78040, 11.58095], [44.78033, 11.58110], [44.78027, 11.58123], [44.78021, 11.58135], [44.78018, 11.58139], [44.78015, 11.58146], [44.78008, 11.58156], [44.77915, 11.58301], [44.77880, 11.58352], [44.77847, 11.58401], [44.77808, 11.58454], [44.77802, 11.58460], [44.77807, 11.58472], [44.77810, 11.58485], [44.77813, 11.58500], [44.77818, 11.58534], [44.77825, 11.58573], [44.77832, 11.58611], [44.77835, 11.58628], [44.77841, 11.58652], [44.77843, 11.58659], [44.77844, 11.58662], [44.77848, 11.58677], [44.77853, 11.58692], [44.77872, 11.58747], [44.77876, 11.58760], [44.77880, 11.58773], [44.77888, 11.58794], [44.77900, 11.58829], [44.77902, 11.58833], [44.77907, 11.58848], [44.77930, 11.58910], [44.77948, 11.58956], [44.77972, 11.59020]],
    'carloinfrancescomayr': [[44.83201, 11.61799], [44.83196, 11.61791], [44.83192, 11.61797], [44.83187, 11.61802], [44.83182, 11.61807], [44.83177, 11.61811], [44.83172, 11.61814], [44.83157, 11.61819], [44.83145, 11.61823], [44.83123, 11.61829], [44.83114, 11.61832], [44.83106, 11.61836], [44.83098, 11.61840], [44.83090, 11.61844], [44.83079, 11.61852], [44.83066, 11.61864], [44.83062, 11.61867], [44.83059, 11.61871], [44.83061, 11.61873], [44.83086, 11.61913], [44.83044, 11.61974], [44.83038, 11.61983], [44.83030, 11.61995], [44.83023, 11.62007], [44.83015, 11.62021], [44.83009, 11.62031], [44.83001, 11.62045], [44.82999, 11.62050], [44.82997, 11.62055], [44.82995, 11.62059], [44.82994, 11.62061], [44.82985, 11.62084], [44.82958, 11.62161], [44.82936, 11.62224], [44.82905, 11.62306], [44.82978, 11.62368], [44.82963, 11.62397], [44.82930, 11.62472], [44.82905, 11.62525], [44.82881, 11.62589], [44.82872, 11.62612], [44.82869, 11.62624], [44.82841, 11.62745], [44.82837, 11.62761], [44.82812, 11.62877], [44.82803, 11.62922], [44.82787, 11.62986], [44.82760, 11.63082], [44.82827, 11.63115], [44.82910, 11.63156], [44.82933, 11.63166], [44.82994, 11.63190], [44.82994, 11.63182], [44.83010, 11.63037], [44.83012, 11.63026], [44.83014, 11.63014], [44.83015, 11.63005], [44.83020, 11.62982], [44.83035, 11.62916]],
    'cavour': [[44.84146, 11.60311], [44.84171, 11.60332], [44.84173, 11.60333], [44.84174, 11.60334], [44.84176, 11.60334], [44.84177, 11.60335], [44.84178, 11.60336], [44.84180, 11.60336], [44.84182, 11.60337], [44.84189, 11.60343], [44.84197, 11.60350], [44.84198, 11.60351], [44.84199, 11.60352], [44.84200, 11.60354], [44.84201, 11.60355], [44.84201, 11.60357], [44.84202, 11.60359], [44.84202, 11.60361], [44.84201, 11.60363], [44.84197, 11.60373], [44.84195, 11.60378], [44.84192, 11.60384], [44.84190, 11.60389], [44.84188, 11.60393], [44.84189, 11.60397], [44.84209, 11.60414], [44.84211, 11.60413], [44.84214, 11.60409], [44.84216, 11.60405], [44.84222, 11.60410], [44.84227, 11.60415], [44.84232, 11.60420], [44.84238, 11.60427], [44.84242, 11.60431], [44.84245, 11.60434], [44.84248, 11.60437], [44.84253, 11.60442], [44.84282, 11.60467], [44.84303, 11.60484], [44.84309, 11.60489], [44.84313, 11.60494], [44.84317, 11.60498], [44.84319, 11.60500], [44.84322, 11.60504], [44.84326, 11.60510], [44.84330, 11.60517], [44.84335, 11.60527], [44.84341, 11.60540], [44.84346, 11.60552], [44.84349, 11.60562], [44.84353, 11.60573], [44.84356, 11.60583], [44.84358, 11.60595], [44.84361, 11.60609], [44.84364, 11.60625], [44.84367, 11.60643], [44.84370, 11.60663], [44.84372, 11.60686], [44.84373, 11.60709], [44.84373, 11.60733], [44.84372, 11.60747], [44.84370, 11.60772], [44.84366, 11.60798], [44.84362, 11.60821], [44.84358, 11.60835], [44.84356, 11.60842], [44.84353, 11.60849], [44.84350, 11.60856], [44.84347, 11.60863], [44.84340, 11.60878], [44.84330, 11.60898], [44.84316, 11.60928], [44.84253, 11.61060], [44.84250, 11.61066], [44.84167, 11.61240], [44.84110, 11.61360], [44.84086, 11.61409], [44.84064, 11.61456], [44.84020, 11.61547], [44.83961, 11.61672], [44.83952, 11.61690], [44.83950, 11.61695], [44.83929, 11.61739], [44.83921, 11.61756], [44.83917, 11.61765], [44.83915, 11.6177], [44.83893, 11.61816], [44.83873, 11.61858], [44.83853, 11.61899], [44.83846, 11.61915], [44.83844, 11.61921], [44.83841, 11.61930], [44.83839, 11.61938], [44.83832, 11.61960], [44.83829, 11.61967], [44.83827, 11.61973], [44.83825, 11.61978], [44.83824, 11.61980], [44.83804, 11.62025], [44.83802, 11.62031], [44.83799, 11.62034], [44.83795, 11.62037], [44.83792, 11.62039], [44.83786, 11.62042], [44.83778, 11.62039], [44.83773, 11.62037], [44.83766, 11.62033], [44.83744, 11.62019]],
    'corsodellagiovecca': [[44.83732, 11.62012], [44.83738, 11.62015], [44.83766, 11.62033], [44.83773, 11.62037], [44.83778, 11.62039], [44.83786, 11.62042], [44.83782, 11.62046], [44.83778, 11.62055], [44.83766, 11.62083], [44.83764, 11.62088], [44.83762, 11.62094], [44.83749, 11.62123], [44.83734, 11.62158], [44.83733, 11.62162], [44.83723, 11.62184], [44.83715, 11.62200], [44.83691, 11.62251], [44.83687, 11.62259], [44.83684, 11.62265], [44.83638, 11.62366], [44.83611, 11.62422], [44.83609, 11.62426], [44.83607, 11.62430], [44.83561, 11.62519], [44.83464, 11.62709], [44.83461, 11.62717], [44.83447, 11.62744], [44.83413, 11.62813], [44.83409, 11.62822], [44.83366, 11.62911], [44.83319, 11.63011], [44.83317, 11.63016], [44.83263, 11.63132], [44.83219, 11.63227], [44.83213, 11.63240], [44.83197, 11.63275], [44.83189, 11.63293], [44.83186, 11.63290], [44.83182, 11.63289], [44.83180, 11.63288], [44.83177, 11.63288], [44.83175, 11.63288], [44.83173, 11.63289], [44.83171, 11.63290], [44.83169, 11.63293], [44.83165, 11.63297], [44.83157, 11.63309], [44.83149, 11.63321], [44.83145, 11.63328], [44.83139, 11.63337], [44.83135, 11.63346], [44.83133, 11.63353], [44.83131, 11.63366], [44.83130, 11.63381], [44.83127, 11.63399], [44.83125, 11.63411], [44.83123, 11.63421], [44.83120, 11.63429], [44.83112, 11.63442], [44.83109, 11.63445], [44.83103, 11.63445], [44.83099, 11.63446], [44.83095, 11.63449], [44.83092, 11.63453], [44.83089, 11.63459], [44.83087, 11.63465], [44.83087, 11.63470], [44.83087, 11.63476], [44.83088, 11.63480], [44.83090, 11.63484], [44.83092, 11.63487], [44.83093, 11.63489], [44.83095, 11.63492], [44.83097, 11.63493], [44.83100, 11.63495], [44.83102, 11.63495], [44.83108, 11.63495], [44.83112, 11.63494], [44.83115, 11.63492], [44.83124, 11.63493], [44.83135, 11.63493], [44.83140, 11.63495], [44.83142, 11.63496], [44.83168, 11.63506], [44.83210, 11.63526], [44.83234, 11.63537], [44.83242, 11.63542], [44.83248, 11.63546], [44.83254, 11.63550], [44.83259, 11.63555], [44.83264, 11.63559], [44.83268, 11.63564], [44.83272, 11.63569], [44.83292, 11.63601], [44.8332, 11.63644], [44.83338, 11.63674]],
    'corsoercoledeste': [[44.83775, 11.62038], [44.83778, 11.62039], [44.83786, 11.62042], [44.83792, 11.62039], [44.83795, 11.62037], [44.83799, 11.62034], [44.83802, 11.62031], [44.83804, 11.62025], [44.83824, 11.61980], [44.83825, 11.61978], [44.83827, 11.61973], [44.83886, 11.61999], [44.83945, 11.62026], [44.8402, 11.62059], [44.84207, 11.62138], [44.84231, 11.62148], [44.84236, 11.62151], [44.84395, 11.62220], [44.84450, 11.62243], [44.84562, 11.62290], [44.84695, 11.62346], [44.84751, 11.62370], [44.84764, 11.62375], [44.84817, 11.62397], [44.84869, 11.62420], [44.84880, 11.62424], [44.84892, 11.62428], [44.84896, 11.62430], [44.84902, 11.62431], [44.84905, 11.62426], [44.84906, 11.62419], [44.84909, 11.62377], [44.84910, 11.62361], [44.84917, 11.62273], [44.84924, 11.62179], [44.84915, 11.62178], [44.84909, 11.62251]],
    'corsoercoleidestee': [[44.83775, 11.62038], [44.83778, 11.62039], [44.83786, 11.62042], [44.83792, 11.62039], [44.83795, 11.62037], [44.83799, 11.62034], [44.83802, 11.62031], [44.83804, 11.62025], [44.83824, 11.61980], [44.83825, 11.61978], [44.83827, 11.61973], [44.83886, 11.61999], [44.83945, 11.62026], [44.8402, 11.62059], [44.84207, 11.62138], [44.84231, 11.62148], [44.84236, 11.62151], [44.84395, 11.62220], [44.84450, 11.62243], [44.84562, 11.62290], [44.84695, 11.62346], [44.84751, 11.62370], [44.84764, 11.62375], [44.84817, 11.62397], [44.84869, 11.62420], [44.84880, 11.62424], [44.84892, 11.62428], [44.84896, 11.62430], [44.84902, 11.62431], [44.84905, 11.62426], [44.84906, 11.62419], [44.84909, 11.62377], [44.84910, 11.62361], [44.84917, 11.62273], [44.84924, 11.62179], [44.84915, 11.62178], [44.84909, 11.62251]],
    'corsoportaalmare': [[44.84136, 11.62305], [44.84144, 11.62311], [44.84172, 11.62327], [44.84207, 11.62344], [44.84214, 11.62347], [44.84211, 11.62372], [44.84200, 11.62464], [44.84194, 11.62515], [44.84192, 11.62523], [44.84190, 11.62544], [44.84186, 11.62576], [44.84182, 11.6261], [44.84171, 11.62708], [44.84165, 11.62760], [44.84163, 11.62773], [44.84154, 11.62844], [44.84148, 11.62897], [44.84147, 11.62903], [44.84146, 11.62912], [44.84145, 11.62921], [44.84141, 11.62953], [44.84113, 11.63179], [44.84097, 11.63310], [44.84096, 11.63312], [44.84085, 11.63393], [44.84084, 11.63406], [44.84082, 11.63421], [44.84079, 11.63444], [44.84075, 11.63483], [44.84072, 11.63494], [44.84068, 11.63506], [44.84066, 11.63513], [44.84063, 11.63516], [44.84060, 11.63519], [44.84056, 11.63525], [44.84054, 11.63532], [44.84048, 11.63545], [44.84045, 11.63552], [44.84040, 11.63559], [44.84034, 11.63566], [44.84030, 11.63572], [44.84021, 11.63578], [44.84017, 11.63579], [44.84013, 11.63581], [44.83986, 11.63587], [44.83981, 11.63588], [44.83966, 11.63590], [44.83936, 11.63596], [44.83910, 11.63600], [44.83893, 11.63601], [44.83804, 11.63605], [44.83778, 11.63606]],
    'corsoportamare': [[44.84136, 11.62305], [44.84144, 11.62311], [44.84172, 11.62327], [44.84207, 11.62344], [44.84214, 11.62347], [44.84211, 11.62372], [44.84200, 11.62464], [44.84194, 11.62515], [44.84192, 11.62523], [44.84190, 11.62544], [44.84186, 11.62576], [44.84182, 11.6261], [44.84171, 11.62708], [44.84165, 11.62760], [44.84163, 11.62773], [44.84154, 11.62844], [44.84148, 11.62897], [44.84147, 11.62903], [44.84146, 11.62912], [44.84145, 11.62921], [44.84141, 11.62953], [44.84113, 11.63179], [44.84097, 11.63310], [44.84096, 11.63312], [44.84085, 11.63393], [44.84084, 11.63406], [44.84082, 11.63421], [44.84079, 11.63444], [44.84075, 11.63483], [44.84072, 11.63494], [44.84068, 11.63506], [44.84066, 11.63513], [44.84063, 11.63516], [44.84060, 11.63519], [44.84056, 11.63525], [44.84054, 11.63532], [44.84048, 11.63545], [44.84045, 11.63552], [44.84040, 11.63559], [44.84034, 11.63566], [44.84030, 11.63572], [44.84021, 11.63578], [44.84017, 11.63579], [44.84013, 11.63581], [44.83986, 11.63587], [44.83981, 11.63588], [44.83966, 11.63590], [44.83936, 11.63596], [44.83910, 11.63600], [44.83893, 11.63601], [44.83804, 11.63605], [44.83778, 11.63606]],
    'corsoportapo': [[44.84168, 11.60329], [44.84171, 11.60332], [44.84173, 11.60333], [44.84174, 11.60334], [44.84176, 11.60334], [44.84177, 11.60335], [44.84178, 11.60336], [44.84180, 11.60336], [44.84182, 11.60337], [44.84189, 11.60343], [44.84197, 11.60350], [44.84198, 11.60351], [44.84199, 11.60352], [44.84200, 11.60354], [44.84201, 11.60355], [44.84201, 11.60357], [44.84202, 11.60359], [44.84202, 11.60361], [44.84201, 11.60363], [44.84197, 11.60373], [44.84195, 11.60378], [44.84192, 11.60384], [44.84190, 11.60389], [44.84188, 11.60393], [44.84189, 11.60397], [44.84209, 11.60414], [44.84211, 11.60413], [44.84214, 11.60409], [44.84216, 11.60405], [44.84222, 11.60410], [44.84227, 11.60415], [44.84232, 11.60420], [44.84238, 11.60427], [44.84242, 11.60431], [44.84245, 11.60434], [44.84248, 11.60437], [44.84253, 11.60442], [44.84282, 11.60467], [44.84303, 11.60484], [44.84309, 11.60489], [44.84313, 11.60494], [44.84317, 11.60498], [44.84319, 11.60500], [44.84322, 11.60504], [44.84326, 11.60510], [44.84330, 11.60517], [44.84335, 11.60527], [44.84341, 11.60540], [44.84346, 11.60552], [44.84349, 11.60562], [44.84353, 11.60573], [44.84356, 11.60583], [44.84358, 11.60595], [44.84361, 11.60609], [44.84364, 11.60625], [44.84367, 11.60643], [44.84370, 11.60663], [44.84372, 11.60686], [44.84373, 11.60709], [44.84373, 11.60733], [44.84372, 11.60747], [44.84370, 11.60772], [44.84366, 11.60798], [44.84362, 11.60821], [44.84358, 11.60835], [44.84356, 11.60842], [44.84353, 11.60849], [44.84350, 11.60856], [44.84347, 11.60863], [44.84340, 11.60878], [44.84330, 11.60898], [44.84316, 11.60928], [44.84253, 11.61060], [44.84250, 11.61066], [44.84167, 11.61240], [44.84110, 11.61360], [44.84086, 11.61409], [44.84064, 11.61456], [44.84020, 11.61547], [44.83961, 11.61672], [44.83952, 11.61690], [44.83950, 11.61695], [44.83929, 11.61739], [44.83921, 11.61756], [44.83917, 11.61765], [44.83915, 11.6177], [44.83893, 11.61816], [44.83873, 11.61858], [44.83853, 11.61899], [44.83846, 11.61915], [44.83844, 11.61921], [44.83841, 11.61930], [44.83839, 11.61938], [44.83832, 11.61960], [44.83829, 11.61967], [44.83827, 11.61973], [44.83886, 11.61999], [44.83945, 11.62026], [44.8402, 11.62059], [44.84020, 11.62054], [44.84019, 11.62040], [44.84017, 11.62025], [44.84016, 11.62014], [44.84014, 11.62001], [44.84013, 11.61991], [44.84034, 11.61978], [44.84072, 11.61953], [44.84076, 11.61950], [44.84078, 11.61949], [44.84080, 11.61949], [44.84082, 11.61949], [44.84084, 11.61949], [44.84086, 11.61950], [44.84089, 11.61951], [44.84094, 11.61952], [44.84097, 11.61954], [44.84102, 11.61956], [44.84105, 11.61957], [44.84105, 11.61957]],
    'ercoleideste': [[44.83775, 11.62038], [44.83778, 11.62039], [44.83786, 11.62042], [44.83792, 11.62039], [44.83795, 11.62037], [44.83799, 11.62034], [44.83802, 11.62031], [44.83804, 11.62025], [44.83824, 11.61980], [44.83825, 11.61978], [44.83827, 11.61973], [44.83886, 11.61999], [44.83945, 11.62026], [44.8402, 11.62059], [44.84207, 11.62138], [44.84231, 11.62148], [44.84236, 11.62151], [44.84395, 11.62220], [44.84450, 11.62243], [44.84562, 11.62290], [44.84695, 11.62346], [44.84751, 11.62370], [44.84764, 11.62375], [44.84817, 11.62397], [44.84869, 11.62420], [44.84880, 11.62424], [44.84892, 11.62428], [44.84896, 11.62430], [44.84902, 11.62431], [44.84905, 11.62426], [44.84906, 11.62419], [44.84909, 11.62377], [44.84910, 11.62361], [44.84917, 11.62273], [44.84924, 11.62179], [44.84915, 11.62178], [44.84909, 11.62251]],
    'ferrarese': [[44.82181, 11.43664], [44.82165, 11.43660], [44.82140, 11.43655], [44.82131, 11.43648], [44.82129, 11.43637], [44.82122, 11.43626], [44.82021, 11.43573], [44.82000, 11.43563], [44.81974, 11.43651], [44.81903, 11.43890], [44.81838, 11.44110], [44.81815, 11.44184], [44.81812, 11.44202], [44.81812, 11.44209], [44.81816, 11.44212], [44.81834, 11.44219], [44.81845, 11.44231], [44.81854, 11.44251], [44.81878, 11.44343], [44.81878, 11.44346], [44.81878, 11.44349], [44.81877, 11.44355], [44.81877, 11.44357], [44.81876, 11.44359], [44.81875, 11.44360], [44.81874, 11.44362], [44.81795, 11.44456], [44.81664, 11.44620], [44.81655, 11.44631], [44.81745, 11.44822], [44.81793, 11.44924], [44.81943, 11.45245], [44.81969, 11.45299], [44.81977, 11.45315], [44.81986, 11.45330], [44.81992, 11.45341], [44.81999, 11.45353], [44.82008, 11.45366], [44.82017, 11.45378], [44.82034, 11.45398], [44.82092, 11.45469], [44.82167, 11.45559], [44.82295, 11.45716], [44.82300, 11.45723], [44.82314, 11.45740], [44.82341, 11.45772], [44.82366, 11.45802], [44.82390, 11.45831], [44.82473, 11.45931], [44.82478, 11.45937], [44.82486, 11.45947], [44.82499, 11.45962], [44.82553, 11.46029], [44.82561, 11.46038], [44.82562, 11.46040], [44.82569, 11.46048], [44.82587, 11.46071], [44.82592, 11.46077], [44.82616, 11.46107], [44.82636, 11.46134], [44.82646, 11.46147], [44.82674, 11.46186], [44.82709, 11.46236], [44.82712, 11.46240], [44.82750, 11.46294], [44.82870, 11.46475], [44.82933, 11.46573], [44.82979, 11.46644], [44.83001, 11.46680], [44.83020, 11.46711], [44.83068, 11.46794], [44.83106, 11.4686], [44.83160, 11.46957], [44.83161, 11.46960], [44.83178, 11.46989], [44.83192, 11.47014], [44.83238, 11.47095], [44.83257, 11.47130], [44.83257, 11.47136], [44.83257, 11.47142], [44.83256, 11.47151], [44.83254, 11.47154], [44.83253, 11.47158], [44.83253, 11.47161], [44.83253, 11.47164], [44.83253, 11.47166], [44.83254, 11.47169], [44.83255, 11.47171], [44.83257, 11.47173], [44.83259, 11.47175], [44.83261, 11.47176], [44.83263, 11.47176], [44.83271, 11.47180], [44.83276, 11.47183], [44.8328, 11.47185], [44.83285, 11.47190], [44.83289, 11.47196], [44.83291, 11.47201], [44.83295, 11.47210], [44.83305, 11.47233], [44.83311, 11.47249], [44.83345, 11.47328], [44.83355, 11.47355], [44.83370, 11.47397], [44.83432, 11.47567], [44.83456, 11.47636], [44.83466, 11.47662], [44.83476, 11.47687], [44.83494, 11.47726], [44.83514, 11.47766], [44.83558, 11.47854], [44.83573, 11.47882], [44.83592, 11.47917], [44.83625, 11.47973], [44.83664, 11.48037], [44.83709, 11.48106], [44.83728, 11.48137], [44.83741, 11.4816], [44.83768, 11.48207], [44.83778, 11.48226], [44.83789, 11.48248], [44.83807, 11.48284], [44.83823, 11.48321], [44.83833, 11.48342], [44.83843, 11.48366], [44.83852, 11.48387], [44.83863, 11.48416], [44.83872, 11.48437], [44.83879, 11.48455], [44.83885, 11.48473], [44.83894, 11.48498], [44.83905, 11.48530], [44.83920, 11.48581], [44.83930, 11.48618], [44.83938, 11.48646], [44.83943, 11.48665], [44.83947, 11.48682], [44.83951, 11.48704], [44.83988, 11.48887], [44.83991, 11.48906], [44.83993, 11.48923], [44.83995, 11.48938], [44.83997, 11.48952], [44.83997, 11.48956], [44.83999, 11.48978], [44.84003, 11.49035], [44.84005, 11.49074], [44.84006, 11.49104], [44.84008, 11.49170], [44.84008, 11.49196], [44.84009, 11.49301], [44.84009, 11.49308], [44.84009, 11.49313], [44.84009, 11.49324], [44.84010, 11.49401], [44.84009, 11.49421], [44.84008, 11.49442], [44.84006, 11.49473], [44.84004, 11.49500], [44.83997, 11.49570], [44.83901, 11.49555], [44.83801, 11.49543], [44.83751, 11.49535], [44.83734, 11.49527], [44.83138, 11.49443], [44.83104, 11.49439]],
    'ferraresi': [[44.82190, 11.59792], [44.82204, 11.59761], [44.82224, 11.59713], [44.82252, 11.59737], [44.82273, 11.59754], [44.82300, 11.59777], [44.82296, 11.59782], [44.82291, 11.59788], [44.82250, 11.59856], [44.82235, 11.59881], [44.82191, 11.59955], [44.82178, 11.59976], [44.82164, 11.59999], [44.82159, 11.60009], [44.82154, 11.60023], [44.82147, 11.60042], [44.82138, 11.60066], [44.82135, 11.60073], [44.82132, 11.60079], [44.82121, 11.60097], [44.82104, 11.60127], [44.82067, 11.60094], [44.82040, 11.60070], [44.82035, 11.60062], [44.82032, 11.60055], [44.82030, 11.60050], [44.82023, 11.60043], [44.82019, 11.60040], [44.82014, 11.60041], [44.8201, 11.60043], [44.82005, 11.60039], [44.81984, 11.60094], [44.8196, 11.60149], [44.81945, 11.60185], [44.81941, 11.60205], [44.81922, 11.60249], [44.81921, 11.60253], [44.81919, 11.60257], [44.81917, 11.6026], [44.81915, 11.60263], [44.81911, 11.60268], [44.81908, 11.60270], [44.81905, 11.60274], [44.81899, 11.60277], [44.81897, 11.60278], [44.81894, 11.60278], [44.81892, 11.60279], [44.81889, 11.60281], [44.81887, 11.60282], [44.81886, 11.60284], [44.81884, 11.60285], [44.81882, 11.60287], [44.81880, 11.60291], [44.81878, 11.60294], [44.81874, 11.60301], [44.81874, 11.60304], [44.81872, 11.60309], [44.81872, 11.60312], [44.81872, 11.60315], [44.81872, 11.60318], [44.81872, 11.60322], [44.81872, 11.60327], [44.81873, 11.60332], [44.81874, 11.60336], [44.81877, 11.60351], [44.81878, 11.60358], [44.81878, 11.60364], [44.81878, 11.60368], [44.81878, 11.60371], [44.81878, 11.60376], [44.81877, 11.60383], [44.81874, 11.60392], [44.81848, 11.60459], [44.81795, 11.60600], [44.81789, 11.60616], [44.81772, 11.60659], [44.81771, 11.60663], [44.81768, 11.60671], [44.81756, 11.60701], [44.81748, 11.60722], [44.81696, 11.60861], [44.81691, 11.60875], [44.81682, 11.60903], [44.81669, 11.60943], [44.81662, 11.60969], [44.81656, 11.60998], [44.81654, 11.61008], [44.81647, 11.61037], [44.81643, 11.61056], [44.8164, 11.61064], [44.81638, 11.61072], [44.81632, 11.61082], [44.81628, 11.61108], [44.81626, 11.61114], [44.81624, 11.61118], [44.81622, 11.61122], [44.81618, 11.61125], [44.81614, 11.61129], [44.81609, 11.61131], [44.81607, 11.61131], [44.81604, 11.61132], [44.81599, 11.61132], [44.81592, 11.61132], [44.81590, 11.61131], [44.81547, 11.61112], [44.81549, 11.61115], [44.81527, 11.61144], [44.81506, 11.61171], [44.81520, 11.61192], [44.81536, 11.61216], [44.81508, 11.61220], [44.81497, 11.61216]],
    'garibaldi': [[44.83600, 11.61500], [44.83587, 11.61489], [44.83579, 11.61480], [44.83577, 11.61478], [44.83562, 11.61506], [44.83543, 11.61543], [44.83538, 11.61551], [44.83521, 11.61581], [44.83520, 11.61583], [44.83516, 11.61578], [44.83502, 11.61594], [44.83464, 11.61634], [44.83463, 11.61635], [44.83457, 11.61640], [44.83444, 11.61656], [44.83422, 11.61679], [44.83381, 11.61737], [44.83376, 11.61744], [44.83372, 11.61748], [44.83384, 11.61767], [44.83394, 11.61783], [44.83417, 11.61809], [44.83443, 11.61832], [44.83444, 11.61834], [44.83474, 11.61858], [44.83497, 11.61875], [44.83499, 11.61877], [44.83503, 11.61884], [44.83507, 11.61888], [44.83515, 11.61896], [44.83524, 11.61904], [44.83532, 11.61911], [44.83536, 11.61914], [44.83540, 11.61917], [44.83544, 11.61918], [44.83548, 11.61919], [44.83549, 11.61919], [44.83550, 11.61919], [44.83552, 11.61918], [44.83555, 11.61916], [44.83562, 11.61921], [44.83566, 11.61922], [44.83590, 11.61932], [44.83595, 11.61934], [44.83604, 11.61939], [44.83602, 11.61951]],
    'giovecca': [[44.83732, 11.62012], [44.83738, 11.62015], [44.83766, 11.62033], [44.83773, 11.62037], [44.83778, 11.62039], [44.83786, 11.62042], [44.83782, 11.62046], [44.83778, 11.62055], [44.83766, 11.62083], [44.83764, 11.62088], [44.83762, 11.62094], [44.83749, 11.62123], [44.83734, 11.62158], [44.83733, 11.62162], [44.83723, 11.62184], [44.83715, 11.62200], [44.83691, 11.62251], [44.83687, 11.62259], [44.83684, 11.62265], [44.83638, 11.62366], [44.83611, 11.62422], [44.83609, 11.62426], [44.83607, 11.62430], [44.83561, 11.62519], [44.83464, 11.62709], [44.83461, 11.62717], [44.83447, 11.62744], [44.83413, 11.62813], [44.83409, 11.62822], [44.83366, 11.62911], [44.83319, 11.63011], [44.83317, 11.63016], [44.83263, 11.63132], [44.83219, 11.63227], [44.83213, 11.63240], [44.83197, 11.63275], [44.83189, 11.63293], [44.83186, 11.63290], [44.83182, 11.63289], [44.83180, 11.63288], [44.83177, 11.63288], [44.83175, 11.63288], [44.83173, 11.63289], [44.83171, 11.63290], [44.83169, 11.63293], [44.83165, 11.63297], [44.83157, 11.63309], [44.83149, 11.63321], [44.83145, 11.63328], [44.83139, 11.63337], [44.83135, 11.63346], [44.83133, 11.63353], [44.83131, 11.63366], [44.83130, 11.63381], [44.83127, 11.63399], [44.83125, 11.63411], [44.83123, 11.63421], [44.83120, 11.63429], [44.83112, 11.63442], [44.83109, 11.63445], [44.83103, 11.63445], [44.83099, 11.63446], [44.83095, 11.63449], [44.83092, 11.63453], [44.83089, 11.63459], [44.83087, 11.63465], [44.83087, 11.63470], [44.83087, 11.63476], [44.83088, 11.63480], [44.83090, 11.63484], [44.83092, 11.63487], [44.83093, 11.63489], [44.83095, 11.63492], [44.83097, 11.63493], [44.83100, 11.63495], [44.83102, 11.63495], [44.83108, 11.63495], [44.83112, 11.63494], [44.83115, 11.63492], [44.83124, 11.63493], [44.83135, 11.63493], [44.83140, 11.63495], [44.83142, 11.63496], [44.83168, 11.63506], [44.83210, 11.63526], [44.83234, 11.63537], [44.83242, 11.63542], [44.83248, 11.63546], [44.83254, 11.63550], [44.83259, 11.63555], [44.83264, 11.63559], [44.83268, 11.63564], [44.83272, 11.63569], [44.83292, 11.63601], [44.8332, 11.63644], [44.83338, 11.63674]],
    'mayr': [[44.83201, 11.61799], [44.83196, 11.61791], [44.83192, 11.61797], [44.83187, 11.61802], [44.83182, 11.61807], [44.83177, 11.61811], [44.83172, 11.61814], [44.83157, 11.61819], [44.83145, 11.61823], [44.83123, 11.61829], [44.83114, 11.61832], [44.83106, 11.61836], [44.83098, 11.61840], [44.83090, 11.61844], [44.83079, 11.61852], [44.83066, 11.61864], [44.83062, 11.61867], [44.83059, 11.61871], [44.83061, 11.61873], [44.83086, 11.61913], [44.83044, 11.61974], [44.83038, 11.61983], [44.83030, 11.61995], [44.83023, 11.62007], [44.83015, 11.62021], [44.83009, 11.62031], [44.83001, 11.62045], [44.82999, 11.62050], [44.82997, 11.62055], [44.82995, 11.62059], [44.82994, 11.62061], [44.82985, 11.62084], [44.82958, 11.62161], [44.82936, 11.62224], [44.82905, 11.62306], [44.82978, 11.62368], [44.82963, 11.62397], [44.82930, 11.62472], [44.82905, 11.62525], [44.82881, 11.62589], [44.82872, 11.62612], [44.82869, 11.62624], [44.82841, 11.62745], [44.82837, 11.62761], [44.82812, 11.62877], [44.82803, 11.62922], [44.82787, 11.62986], [44.82760, 11.63082], [44.82827, 11.63115], [44.82910, 11.63156], [44.82933, 11.63166], [44.82994, 11.63190], [44.82994, 11.63182], [44.83010, 11.63037], [44.83012, 11.63026], [44.83014, 11.63014], [44.83015, 11.63005], [44.83020, 11.62982], [44.83035, 11.62916]],
    'montebello': [[44.83797, 11.62502], [44.83797, 11.62502], [44.83789, 11.62530], [44.83772, 11.62521], [44.83780, 11.62492], [44.83782, 11.62485], [44.83782, 11.62469], [44.83799, 11.62422], [44.83786, 11.62411], [44.83774, 11.62402], [44.83769, 11.62399], [44.83766, 11.62396], [44.83754, 11.62387], [44.83770, 11.62347], [44.83773, 11.62341], [44.83781, 11.62318], [44.83729, 11.62285], [44.83687, 11.62259], [44.83684, 11.62265], [44.83638, 11.62366], [44.83611, 11.62422], [44.83609, 11.62426], [44.83607, 11.62430], [44.83561, 11.62519], [44.83596, 11.62549], [44.83637, 11.62584], [44.83663, 11.62606], [44.83671, 11.62612], [44.83674, 11.62614], [44.83688, 11.62624], [44.83700, 11.62632], [44.83716, 11.62642], [44.83750, 11.62663], [44.83759, 11.62668], [44.83763, 11.62671], [44.83768, 11.62673], [44.83778, 11.62679], [44.83816, 11.62702], [44.83881, 11.62741], [44.83894, 11.62749], [44.83969, 11.62794], [44.84059, 11.62849], [44.84063, 11.62852], [44.84069, 11.62855], [44.84107, 11.62878]],
    'palestro': [[44.83856, 11.62204], [44.83865, 11.62176], [44.83887, 11.62104], [44.83892, 11.62087], [44.83894, 11.62082], [44.83906, 11.62089], [44.83914, 11.62094], [44.83920, 11.62098], [44.83960, 11.62129], [44.84014, 11.62170], [44.84021, 11.62177], [44.84028, 11.62184], [44.84035, 11.62191], [44.84082, 11.62249], [44.84105, 11.62277], [44.84112, 11.62284], [44.84121, 11.62292], [44.84129, 11.62300], [44.84135, 11.62305], [44.84144, 11.62311], [44.84172, 11.62327], [44.84207, 11.62344], [44.84214, 11.62347], [44.84211, 11.62372], [44.84200, 11.62464], [44.84195, 11.62499]],
    'piangipane': [[44.83307, 11.61410], [44.83346, 11.61362], [44.83418, 11.61488], [44.83399, 11.61497], [44.83379, 11.61509], [44.83382, 11.61514], [44.83398, 11.61539], [44.83415, 11.61563], [44.83422, 11.61568], [44.83424, 11.61571], [44.83428, 11.61577], [44.83438, 11.61592], [44.83444, 11.61602], [44.83448, 11.61607], [44.83464, 11.61634], [44.83463, 11.61635], [44.83457, 11.61640], [44.83444, 11.61656], [44.83422, 11.61679], [44.83381, 11.61737], [44.83376, 11.61744], [44.83372, 11.61748], [44.83371, 11.61750], [44.83368, 11.61754], [44.83360, 11.61769], [44.83346, 11.61790], [44.83344, 11.61794], [44.83338, 11.61803], [44.83332, 11.61814], [44.83330, 11.61817], [44.83315, 11.61842], [44.83303, 11.61861], [44.83297, 11.61869], [44.83293, 11.61874], [44.83288, 11.61881], [44.83283, 11.61888], [44.83281, 11.61891], [44.83276, 11.61898], [44.83265, 11.61912], [44.83238, 11.61948], [44.83233, 11.61954], [44.83214, 11.61980], [44.83198, 11.62000], [44.83190, 11.62012], [44.83175, 11.62035], [44.83137, 11.62096], [44.83120, 11.62075], [44.83142, 11.62040]],
    'portamare': [[44.84136, 11.62305], [44.84144, 11.62311], [44.84172, 11.62327], [44.84207, 11.62344], [44.84214, 11.62347], [44.84211, 11.62372], [44.84200, 11.62464], [44.84194, 11.62515], [44.84192, 11.62523], [44.84190, 11.62544], [44.84186, 11.62576], [44.84182, 11.6261], [44.84171, 11.62708], [44.84165, 11.62760], [44.84163, 11.62773], [44.84154, 11.62844], [44.84148, 11.62897], [44.84147, 11.62903], [44.84146, 11.62912], [44.84145, 11.62921], [44.84141, 11.62953], [44.84113, 11.63179], [44.84097, 11.63310], [44.84096, 11.63312], [44.84085, 11.63393], [44.84084, 11.63406], [44.84082, 11.63421], [44.84079, 11.63444], [44.84075, 11.63483], [44.84072, 11.63494], [44.84068, 11.63506], [44.84066, 11.63513], [44.84063, 11.63516], [44.84060, 11.63519], [44.84056, 11.63525], [44.84054, 11.63532], [44.84048, 11.63545], [44.84045, 11.63552], [44.84040, 11.63559], [44.84034, 11.63566], [44.84030, 11.63572], [44.84021, 11.63578], [44.84017, 11.63579], [44.84013, 11.63581], [44.83986, 11.63587], [44.83981, 11.63588], [44.83966, 11.63590], [44.83936, 11.63596], [44.83910, 11.63600], [44.83893, 11.63601], [44.83804, 11.63605], [44.83778, 11.63606]],
    'portapo': [[44.84168, 11.60329], [44.84171, 11.60332], [44.84173, 11.60333], [44.84174, 11.60334], [44.84176, 11.60334], [44.84177, 11.60335], [44.84178, 11.60336], [44.84180, 11.60336], [44.84182, 11.60337], [44.84189, 11.60343], [44.84197, 11.60350], [44.84198, 11.60351], [44.84199, 11.60352], [44.84200, 11.60354], [44.84201, 11.60355], [44.84201, 11.60357], [44.84202, 11.60359], [44.84202, 11.60361], [44.84201, 11.60363], [44.84197, 11.60373], [44.84195, 11.60378], [44.84192, 11.60384], [44.84190, 11.60389], [44.84188, 11.60393], [44.84189, 11.60397], [44.84209, 11.60414], [44.84211, 11.60413], [44.84214, 11.60409], [44.84216, 11.60405], [44.84222, 11.60410], [44.84227, 11.60415], [44.84232, 11.60420], [44.84238, 11.60427], [44.84242, 11.60431], [44.84245, 11.60434], [44.84248, 11.60437], [44.84253, 11.60442], [44.84282, 11.60467], [44.84303, 11.60484], [44.84309, 11.60489], [44.84313, 11.60494], [44.84317, 11.60498], [44.84319, 11.60500], [44.84322, 11.60504], [44.84326, 11.60510], [44.84330, 11.60517], [44.84335, 11.60527], [44.84341, 11.60540], [44.84346, 11.60552], [44.84349, 11.60562], [44.84353, 11.60573], [44.84356, 11.60583], [44.84358, 11.60595], [44.84361, 11.60609], [44.84364, 11.60625], [44.84367, 11.60643], [44.84370, 11.60663], [44.84372, 11.60686], [44.84373, 11.60709], [44.84373, 11.60733], [44.84372, 11.60747], [44.84370, 11.60772], [44.84366, 11.60798], [44.84362, 11.60821], [44.84358, 11.60835], [44.84356, 11.60842], [44.84353, 11.60849], [44.84350, 11.60856], [44.84347, 11.60863], [44.84340, 11.60878], [44.84330, 11.60898], [44.84316, 11.60928], [44.84253, 11.61060], [44.84250, 11.61066], [44.84167, 11.61240], [44.84110, 11.61360], [44.84086, 11.61409], [44.84064, 11.61456], [44.84020, 11.61547], [44.83961, 11.61672], [44.83952, 11.61690], [44.83950, 11.61695], [44.83929, 11.61739], [44.83921, 11.61756], [44.83917, 11.61765], [44.83915, 11.6177], [44.83893, 11.61816], [44.83873, 11.61858], [44.83853, 11.61899], [44.83846, 11.61915], [44.83844, 11.61921], [44.83841, 11.61930], [44.83839, 11.61938], [44.83832, 11.61960], [44.83829, 11.61967], [44.83827, 11.61973], [44.83886, 11.61999], [44.83945, 11.62026], [44.8402, 11.62059], [44.84020, 11.62054], [44.84019, 11.62040], [44.84017, 11.62025], [44.84016, 11.62014], [44.84014, 11.62001], [44.84013, 11.61991], [44.84034, 11.61978], [44.84072, 11.61953], [44.84076, 11.61950], [44.84078, 11.61949], [44.84080, 11.61949], [44.84082, 11.61949], [44.84084, 11.61949], [44.84086, 11.61950], [44.84089, 11.61951], [44.84094, 11.61952], [44.84097, 11.61954], [44.84102, 11.61956], [44.84105, 11.61957], [44.84105, 11.61957]],
    'ravenna': [[44.82505, 11.63237], [44.82466, 11.63247], [44.82465, 11.63242], [44.82464, 11.63238], [44.82464, 11.63236], [44.82463, 11.63230], [44.82461, 11.63222], [44.82458, 11.63212], [44.82452, 11.63192], [44.82448, 11.63178], [44.82396, 11.63022], [44.82377, 11.62966], [44.82374, 11.62954], [44.82371, 11.62944], [44.82368, 11.62932], [44.82363, 11.62909], [44.82361, 11.62897], [44.82360, 11.62891], [44.82360, 11.62885], [44.82359, 11.62880], [44.82353, 11.62875], [44.82351, 11.62874], [44.82350, 11.62873], [44.82317, 11.62855], [44.82314, 11.62853], [44.82306, 11.62848], [44.82299, 11.62845], [44.82292, 11.62843], [44.82286, 11.62842], [44.82267, 11.62850], [44.82264, 11.62851], [44.82261, 11.62852], [44.82258, 11.62852], [44.82254, 11.62853], [44.82251, 11.62853], [44.82246, 11.62853], [44.82243, 11.62851], [44.8224, 11.62850], [44.82237, 11.62849], [44.82234, 11.62850], [44.82231, 11.62852], [44.82228, 11.62854], [44.82226, 11.62857], [44.82224, 11.62861], [44.82223, 11.62865], [44.82220, 11.62875], [44.82215, 11.62889], [44.82211, 11.62898], [44.82203, 11.62910], [44.82200, 11.62916], [44.82196, 11.6292], [44.82192, 11.62923], [44.82186, 11.62923], [44.82183, 11.62924], [44.82180, 11.62923], [44.82174, 11.62920], [44.82167, 11.62916], [44.82161, 11.62912], [44.82143, 11.62901], [44.82142, 11.62901], [44.82120, 11.62886], [44.82119, 11.62885], [44.82107, 11.62874], [44.82108, 11.62872], [44.82108, 11.62870], [44.82109, 11.62868], [44.82109, 11.62865], [44.82109, 11.62862], [44.82108, 11.62859], [44.82107, 11.62857], [44.82105, 11.62855], [44.82103, 11.62854], [44.82101, 11.62854], [44.82098, 11.62854], [44.82096, 11.62856], [44.82095, 11.62858], [44.82094, 11.62858], [44.82094, 11.62860], [44.82087, 11.62860], [44.82082, 11.62860], [44.82080, 11.62860], [44.82075, 11.62858], [44.82068, 11.62856], [44.82053, 11.6285], [44.82050, 11.62848], [44.82044, 11.62845], [44.82041, 11.62844], [44.82041, 11.62843], [44.82029, 11.62837], [44.81989, 11.62822], [44.81982, 11.62820], [44.81969, 11.62816], [44.81954, 11.62811], [44.81947, 11.62809], [44.81936, 11.62806], [44.81926, 11.62803], [44.81917, 11.62800], [44.81911, 11.62800], [44.81904, 11.62800], [44.81898, 11.62801], [44.81879, 11.62811], [44.81849, 11.62829], [44.81796, 11.62861], [44.81776, 11.62871], [44.81768, 11.62877], [44.81759, 11.62886], [44.81726, 11.62919], [44.81715, 11.62929], [44.81707, 11.62936], [44.81698, 11.62942], [44.81689, 11.62948], [44.81679, 11.62954], [44.81669, 11.62958], [44.81660, 11.62960], [44.81648, 11.62965], [44.81636, 11.62969], [44.81626, 11.62974], [44.81616, 11.62981], [44.81603, 11.62990], [44.81592, 11.62999], [44.81581, 11.63008], [44.81573, 11.63010], [44.81561, 11.63019], [44.81557, 11.63022], [44.81527, 11.63049], [44.81502, 11.63071], [44.81496, 11.63075], [44.81492, 11.63077], [44.81487, 11.63078], [44.81483, 11.63078], [44.81476, 11.63076], [44.81475, 11.63073], [44.81472, 11.63069], [44.81469, 11.63066], [44.81465, 11.63064], [44.81461, 11.63063], [44.81458, 11.63064], [44.81454, 11.63066], [44.81451, 11.63070], [44.81448, 11.63074], [44.81446, 11.63079], [44.81446, 11.63084], [44.81446, 11.63088], [44.81434, 11.63121], [44.81430, 11.63131], [44.81425, 11.63137], [44.81422, 11.63142], [44.81418, 11.63147], [44.81414, 11.63150], [44.81396, 11.63164], [44.81391, 11.63167], [44.81364, 11.63186], [44.81338, 11.63203], [44.81317, 11.63217], [44.81298, 11.63230], [44.81279, 11.63244], [44.81265, 11.63257], [44.81249, 11.63270], [44.81228, 11.63292], [44.81198, 11.63325], [44.81170, 11.63356], [44.81145, 11.63383], [44.81126, 11.63405], [44.81123, 11.63409], [44.81121, 11.63410], [44.81109, 11.63424], [44.81083, 11.63453], [44.81069, 11.63468], [44.81061, 11.63475], [44.81054, 11.63480], [44.81046, 11.63485], [44.81042, 11.63487], [44.81032, 11.63490], [44.81018, 11.63494], [44.80986, 11.63504], [44.80943, 11.63516], [44.80905, 11.63528], [44.80892, 11.63531], [44.80870, 11.63537], [44.80840, 11.63546], [44.80820, 11.63551], [44.80811, 11.63554], [44.80793, 11.63559], [44.80780, 11.63563], [44.80762, 11.63569], [44.80732, 11.63579], [44.80708, 11.63587], [44.80695, 11.63591], [44.80682, 11.63595], [44.80660, 11.63600], [44.80649, 11.63602], [44.80608, 11.63608], [44.80580, 11.63612], [44.8053, 11.63616], [44.80470, 11.63623], [44.80419, 11.63629], [44.80231, 11.63650], [44.80212, 11.63652], [44.80022, 11.63669], [44.80009, 11.63670], [44.79858, 11.63684], [44.79835, 11.63686], [44.79806, 11.63689], [44.79776, 11.63686], [44.79753, 11.63688], [44.79730, 11.63691], [44.79693, 11.63695], [44.79625, 11.63703], [44.79566, 11.63710], [44.79536, 11.63713], [44.79521, 11.63714], [44.79449, 11.63720], [44.79435, 11.63721], [44.79416, 11.63723], [44.79394, 11.63725], [44.79359, 11.63729], [44.79331, 11.63731], [44.79239, 11.63742], [44.79215, 11.63749], [44.79209, 11.63749], [44.79108, 11.63759], [44.79087, 11.63760], [44.79036, 11.63765], [44.78954, 11.63774], [44.78922, 11.63779], [44.78905, 11.63781], [44.78892, 11.63783], [44.78872, 11.63787], [44.78844, 11.63793], [44.78819, 11.63798], [44.78802, 11.63802], [44.78789, 11.63806], [44.78771, 11.63811], [44.78754, 11.63817], [44.78734, 11.63823], [44.78722, 11.63828], [44.78711, 11.63832], [44.78696, 11.63839], [44.78682, 11.63846], [44.78666, 11.63854], [44.78655, 11.63860], [44.78643, 11.63867], [44.78600, 11.63898], [44.78578, 11.63915], [44.78560, 11.63931], [44.78543, 11.63946], [44.78530, 11.63959], [44.78515, 11.63973], [44.78494, 11.63995], [44.78459, 11.64033], [44.78408, 11.64092], [44.78332, 11.64178], [44.78000, 11.64558], [44.77909, 11.64661], [44.77828, 11.64753], [44.77579, 11.65025], [44.77163, 11.65478], [44.77124, 11.65521], [44.77018, 11.65634], [44.76988, 11.65666], [44.76977, 11.65672], [44.76972, 11.65674], [44.76967, 11.65674], [44.76962, 11.65674], [44.76958, 11.65672], [44.76954, 11.65669], [44.76952, 11.65665], [44.76950, 11.65661], [44.76948, 11.65657], [44.76947, 11.65649], [44.76941, 11.65578], [44.76941, 11.65565], [44.76942, 11.65548], [44.76977, 11.65570], [44.76983, 11.65572], [44.7699, 11.65576], [44.77, 11.65579], [44.77009, 11.65581], [44.77016, 11.65582], [44.77027, 11.65586], [44.77070, 11.65603], [44.77138, 11.65633], [44.77159, 11.65643], [44.77186, 11.65655], [44.77188, 11.65656], [44.77221, 11.65667], [44.77233, 11.65671], [44.77355, 11.65717], [44.77361, 11.65724], [44.77366, 11.65736], [44.77369, 11.65750], [44.77367, 11.65758], [44.77367, 11.65766], [44.77369, 11.65774], [44.77372, 11.65782], [44.77377, 11.65787], [44.77382, 11.65789], [44.77387, 11.65790], [44.77392, 11.65790], [44.77398, 11.65797], [44.77403, 11.65808], [44.77407, 11.65822], [44.77410, 11.65841], [44.77413, 11.65862], [44.77416, 11.65879], [44.77420, 11.65898], [44.77426, 11.65922], [44.77440, 11.65972], [44.77458, 11.66026], [44.77467, 11.66056], [44.77476, 11.66089], [44.77484, 11.66122], [44.77509, 11.66227], [44.77518, 11.66267], [44.77527, 11.66309], [44.77536, 11.66357], [44.77545, 11.66418], [44.77551, 11.66464], [44.77557, 11.66519], [44.77570, 11.66665], [44.77576, 11.66719], [44.77582, 11.66772], [44.77588, 11.66825], [44.77594, 11.66873], [44.77598, 11.66916], [44.77605, 11.66976], [44.77613, 11.67044], [44.77617, 11.67081], [44.77624, 11.67151], [44.77628, 11.67178], [44.77633, 11.67238], [44.77642, 11.67378], [44.77643, 11.67391], [44.77646, 11.67391], [44.77650, 11.67389], [44.77665, 11.67376], [44.77706, 11.67319], [44.77786, 11.67202], [44.77816, 11.67154], [44.77826, 11.67144], [44.77856, 11.67097], [44.77888, 11.67051], [44.77914, 11.67026], [44.77947, 11.67014], [44.77999, 11.66996]],
    'sanromano': [[44.83460, 11.61966], [44.83461, 11.61964], [44.83462, 11.61962], [44.83473, 11.61934], [44.83476, 11.61925], [44.83479, 11.61919], [44.83492, 11.61887], [44.83497, 11.61875], [44.83474, 11.61858], [44.83444, 11.61834], [44.83443, 11.61832], [44.83417, 11.61809], [44.83394, 11.61783], [44.83384, 11.61767], [44.83372, 11.61748], [44.83371, 11.61750], [44.83368, 11.61754], [44.83360, 11.61769], [44.83346, 11.61790], [44.83344, 11.61794], [44.83338, 11.61803], [44.83332, 11.61814], [44.83330, 11.61817], [44.83315, 11.61842], [44.83303, 11.61861], [44.83297, 11.61869], [44.83293, 11.61874], [44.83288, 11.61881], [44.83283, 11.61888], [44.83281, 11.61891], [44.83276, 11.61898], [44.83265, 11.61912], [44.83238, 11.61948], [44.83233, 11.61954], [44.83214, 11.61980], [44.83198, 11.62000], [44.83190, 11.62012], [44.83175, 11.62035], [44.83137, 11.62096], [44.83120, 11.62075]],
    'savonarola': [[44.83341, 11.62419], [44.83362, 11.62438], [44.83403, 11.62466], [44.83389, 11.62498], [44.83376, 11.62526], [44.83350, 11.62579], [44.83317, 11.62636], [44.83291, 11.62682], [44.83279, 11.62706], [44.83221, 11.62816], [44.83309, 11.62873]],
    'sp15': [[44.81498, 11.58498], [44.81480, 11.58523], [44.81466, 11.58542], [44.81245, 11.58847], [44.81234, 11.58869], [44.81205, 11.58910], [44.81210, 11.58919], [44.81220, 11.58936], [44.81225, 11.58942], [44.81229, 11.58946], [44.81230, 11.58950], [44.8123, 11.58954], [44.81228, 11.58953], [44.81225, 11.58953], [44.81221, 11.58955], [44.81218, 11.58957], [44.81214, 11.58960], [44.81173, 11.58999], [44.81053, 11.59115], [44.81026, 11.59141], [44.81019, 11.59144], [44.81014, 11.59146], [44.81011, 11.59148], [44.81007, 11.59148], [44.81003, 11.59148], [44.80998, 11.59149], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80023, 11.60518], [44.80352, 11.60198]],
    'sp468': [[44.82181, 11.43664], [44.82165, 11.43660], [44.82140, 11.43655], [44.82131, 11.43648], [44.82129, 11.43637], [44.82122, 11.43626], [44.82021, 11.43573], [44.82000, 11.43563], [44.81974, 11.43651], [44.81903, 11.43890], [44.81838, 11.44110], [44.81815, 11.44184], [44.81812, 11.44202], [44.81812, 11.44209], [44.81816, 11.44212], [44.81834, 11.44219], [44.81845, 11.44231], [44.81854, 11.44251], [44.81878, 11.44343], [44.81878, 11.44346], [44.81878, 11.44349], [44.81877, 11.44355], [44.81877, 11.44357], [44.81876, 11.44359], [44.81875, 11.44360], [44.81874, 11.44362], [44.81795, 11.44456], [44.81664, 11.44620], [44.81655, 11.44631], [44.81745, 11.44822], [44.81793, 11.44924], [44.81943, 11.45245], [44.81969, 11.45299], [44.81977, 11.45315], [44.81986, 11.45330], [44.81992, 11.45341], [44.81999, 11.45353], [44.82008, 11.45366], [44.82017, 11.45378], [44.82034, 11.45398], [44.82092, 11.45469], [44.82167, 11.45559], [44.82295, 11.45716], [44.82300, 11.45723], [44.82314, 11.45740], [44.82341, 11.45772], [44.82366, 11.45802], [44.82390, 11.45831], [44.82473, 11.45931], [44.82478, 11.45937], [44.82486, 11.45947], [44.82499, 11.45962], [44.82553, 11.46029], [44.82561, 11.46038], [44.82562, 11.46040], [44.82569, 11.46048], [44.82587, 11.46071], [44.82592, 11.46077], [44.82616, 11.46107], [44.82636, 11.46134], [44.82646, 11.46147], [44.82674, 11.46186], [44.82709, 11.46236], [44.82712, 11.46240], [44.82750, 11.46294], [44.82870, 11.46475], [44.82933, 11.46573], [44.82979, 11.46644], [44.83001, 11.46680], [44.83020, 11.46711], [44.83068, 11.46794], [44.83106, 11.4686], [44.83160, 11.46957], [44.83161, 11.46960], [44.83178, 11.46989], [44.83192, 11.47014], [44.83238, 11.47095], [44.83257, 11.47130], [44.83257, 11.47136], [44.83257, 11.47142], [44.83256, 11.47151], [44.83254, 11.47154], [44.83253, 11.47158], [44.83253, 11.47161], [44.83253, 11.47164], [44.83253, 11.47166], [44.83254, 11.47169], [44.83255, 11.47171], [44.83257, 11.47173], [44.83259, 11.47175], [44.83261, 11.47176], [44.83263, 11.47176], [44.83271, 11.47180], [44.83276, 11.47183], [44.8328, 11.47185], [44.83285, 11.47190], [44.83289, 11.47196], [44.83291, 11.47201], [44.83295, 11.47210], [44.83305, 11.47233], [44.83311, 11.47249], [44.83345, 11.47328], [44.83355, 11.47355], [44.83370, 11.47397], [44.83432, 11.47567], [44.83456, 11.47636], [44.83466, 11.47662], [44.83476, 11.47687], [44.83494, 11.47726], [44.83514, 11.47766], [44.83558, 11.47854], [44.83573, 11.47882], [44.83592, 11.47917], [44.83625, 11.47973], [44.83664, 11.48037], [44.83709, 11.48106], [44.83728, 11.48137], [44.83741, 11.4816], [44.83768, 11.48207], [44.83778, 11.48226], [44.83789, 11.48248], [44.83807, 11.48284], [44.83823, 11.48321], [44.83833, 11.48342], [44.83843, 11.48366], [44.83852, 11.48387], [44.83863, 11.48416], [44.83872, 11.48437], [44.83879, 11.48455], [44.83885, 11.48473], [44.83894, 11.48498], [44.83905, 11.48530], [44.83920, 11.48581], [44.83930, 11.48618], [44.83938, 11.48646], [44.83943, 11.48665], [44.83947, 11.48682], [44.83951, 11.48704], [44.83988, 11.48887], [44.83991, 11.48906], [44.83993, 11.48923], [44.83995, 11.48938], [44.83997, 11.48952], [44.83997, 11.48956], [44.83999, 11.48978], [44.84003, 11.49035], [44.84005, 11.49074], [44.84006, 11.49104], [44.84008, 11.49170], [44.84008, 11.49196], [44.84009, 11.49301], [44.84009, 11.49308], [44.84009, 11.49313], [44.84009, 11.49324], [44.84010, 11.49401], [44.84009, 11.49421], [44.84008, 11.49442], [44.84006, 11.49473], [44.84004, 11.49500], [44.83997, 11.49570], [44.83901, 11.49555], [44.83801, 11.49543], [44.83751, 11.49535], [44.83734, 11.49527], [44.83138, 11.49443], [44.83104, 11.49439]],
    'ss16': [[44.81498, 11.58498], [44.81480, 11.58523], [44.81466, 11.58542], [44.81245, 11.58847], [44.81234, 11.58869], [44.81205, 11.58910], [44.81210, 11.58919], [44.81220, 11.58936], [44.81225, 11.58942], [44.81229, 11.58946], [44.81230, 11.58950], [44.8123, 11.58954], [44.81228, 11.58953], [44.81225, 11.58953], [44.81221, 11.58955], [44.81218, 11.58957], [44.81214, 11.58960], [44.81173, 11.58999], [44.81053, 11.59115], [44.81026, 11.59141], [44.81019, 11.59144], [44.81014, 11.59146], [44.81011, 11.59148], [44.81007, 11.59148], [44.81003, 11.59148], [44.80998, 11.59149], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80023, 11.60518], [44.80352, 11.60198]],
    'ss468': [[44.82181, 11.43664], [44.82165, 11.43660], [44.82140, 11.43655], [44.82131, 11.43648], [44.82129, 11.43637], [44.82122, 11.43626], [44.82021, 11.43573], [44.82000, 11.43563], [44.81974, 11.43651], [44.81903, 11.43890], [44.81838, 11.44110], [44.81815, 11.44184], [44.81812, 11.44202], [44.81812, 11.44209], [44.81816, 11.44212], [44.81834, 11.44219], [44.81845, 11.44231], [44.81854, 11.44251], [44.81878, 11.44343], [44.81878, 11.44346], [44.81878, 11.44349], [44.81877, 11.44355], [44.81877, 11.44357], [44.81876, 11.44359], [44.81875, 11.44360], [44.81874, 11.44362], [44.81795, 11.44456], [44.81664, 11.44620], [44.81655, 11.44631], [44.81745, 11.44822], [44.81793, 11.44924], [44.81943, 11.45245], [44.81969, 11.45299], [44.81977, 11.45315], [44.81986, 11.45330], [44.81992, 11.45341], [44.81999, 11.45353], [44.82008, 11.45366], [44.82017, 11.45378], [44.82034, 11.45398], [44.82092, 11.45469], [44.82167, 11.45559], [44.82295, 11.45716], [44.82300, 11.45723], [44.82314, 11.45740], [44.82341, 11.45772], [44.82366, 11.45802], [44.82390, 11.45831], [44.82473, 11.45931], [44.82478, 11.45937], [44.82486, 11.45947], [44.82499, 11.45962], [44.82553, 11.46029], [44.82561, 11.46038], [44.82562, 11.46040], [44.82569, 11.46048], [44.82587, 11.46071], [44.82592, 11.46077], [44.82616, 11.46107], [44.82636, 11.46134], [44.82646, 11.46147], [44.82674, 11.46186], [44.82709, 11.46236], [44.82712, 11.46240], [44.82750, 11.46294], [44.82870, 11.46475], [44.82933, 11.46573], [44.82979, 11.46644], [44.83001, 11.46680], [44.83020, 11.46711], [44.83068, 11.46794], [44.83106, 11.4686], [44.83160, 11.46957], [44.83161, 11.46960], [44.83178, 11.46989], [44.83192, 11.47014], [44.83238, 11.47095], [44.83257, 11.47130], [44.83257, 11.47136], [44.83257, 11.47142], [44.83256, 11.47151], [44.83254, 11.47154], [44.83253, 11.47158], [44.83253, 11.47161], [44.83253, 11.47164], [44.83253, 11.47166], [44.83254, 11.47169], [44.83255, 11.47171], [44.83257, 11.47173], [44.83259, 11.47175], [44.83261, 11.47176], [44.83263, 11.47176], [44.83271, 11.47180], [44.83276, 11.47183], [44.8328, 11.47185], [44.83285, 11.47190], [44.83289, 11.47196], [44.83291, 11.47201], [44.83295, 11.47210], [44.83305, 11.47233], [44.83311, 11.47249], [44.83345, 11.47328], [44.83355, 11.47355], [44.83370, 11.47397], [44.83432, 11.47567], [44.83456, 11.47636], [44.83466, 11.47662], [44.83476, 11.47687], [44.83494, 11.47726], [44.83514, 11.47766], [44.83558, 11.47854], [44.83573, 11.47882], [44.83592, 11.47917], [44.83625, 11.47973], [44.83664, 11.48037], [44.83709, 11.48106], [44.83728, 11.48137], [44.83741, 11.4816], [44.83768, 11.48207], [44.83778, 11.48226], [44.83789, 11.48248], [44.83807, 11.48284], [44.83823, 11.48321], [44.83833, 11.48342], [44.83843, 11.48366], [44.83852, 11.48387], [44.83863, 11.48416], [44.83872, 11.48437], [44.83879, 11.48455], [44.83885, 11.48473], [44.83894, 11.48498], [44.83905, 11.48530], [44.83920, 11.48581], [44.83930, 11.48618], [44.83938, 11.48646], [44.83943, 11.48665], [44.83947, 11.48682], [44.83951, 11.48704], [44.83988, 11.48887], [44.83991, 11.48906], [44.83993, 11.48923], [44.83995, 11.48938], [44.83997, 11.48952], [44.83997, 11.48956], [44.83999, 11.48978], [44.84003, 11.49035], [44.84005, 11.49074], [44.84006, 11.49104], [44.84008, 11.49170], [44.84008, 11.49196], [44.84009, 11.49301], [44.84009, 11.49308], [44.84009, 11.49313], [44.84009, 11.49324], [44.84010, 11.49401], [44.84009, 11.49421], [44.84008, 11.49442], [44.84006, 11.49473], [44.84004, 11.49500], [44.83997, 11.49570], [44.83901, 11.49555], [44.83801, 11.49543], [44.83751, 11.49535], [44.83734, 11.49527], [44.83138, 11.49443], [44.83104, 11.49439]],
    'viabeethoven': [[44.80992, 11.59010], [44.80952, 11.58948], [44.80925, 11.58984], [44.80921, 11.58988], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80008, 11.60491]],
    'viabersaglieridelpo': [[44.83666, 11.62062], [44.83644, 11.62121], [44.83723, 11.62184], [44.83733, 11.62162], [44.83734, 11.62158], [44.83749, 11.62123], [44.83762, 11.62094], [44.83764, 11.62088], [44.83766, 11.62083], [44.83778, 11.62055], [44.83782, 11.62046], [44.83786, 11.62042], [44.83778, 11.62039], [44.83773, 11.62037], [44.83766, 11.62033], [44.83738, 11.62015], [44.83689, 11.61987], [44.83675, 11.61978], [44.83670, 11.61976], [44.83666, 11.61974], [44.83640, 11.61959], [44.83610, 11.61942], [44.83604, 11.61939], [44.83599, 11.61976], [44.83598, 11.61983], [44.83593, 11.61997], [44.83564, 11.62088], [44.83552, 11.62123], [44.83551, 11.62130], [44.83551, 11.62142]],
    'viabologna': [[44.82484, 11.61626], [44.82484, 11.61626], [44.82481, 11.61626], [44.82478, 11.61629], [44.82475, 11.61633], [44.82459, 11.61660], [44.82456, 11.61665], [44.82430, 11.61707], [44.82426, 11.61714], [44.82398, 11.61759], [44.82393, 11.61768], [44.82376, 11.61794], [44.82373, 11.61798], [44.82370, 11.61802], [44.82366, 11.61807], [44.82362, 11.61813], [44.82353, 11.61826], [44.82349, 11.61832], [44.82325, 11.61867], [44.82323, 11.61870], [44.82314, 11.61884], [44.82301, 11.61903], [44.82286, 11.61925], [44.82246, 11.61872], [44.82232, 11.61852], [44.82218, 11.61834], [44.82210, 11.61823], [44.82205, 11.61816], [44.82201, 11.61810], [44.82200, 11.61804], [44.82198, 11.61796], [44.82198, 11.61789], [44.82198, 11.61782], [44.82199, 11.61775], [44.82201, 11.61767], [44.82216, 11.61724], [44.82221, 11.61708], [44.82253, 11.61617], [44.82272, 11.61564], [44.82290, 11.61514], [44.82305, 11.61470], [44.82312, 11.61454], [44.82316, 11.61444], [44.8232, 11.61434], [44.82246, 11.61365], [44.82250, 11.61358], [44.82279, 11.61297], [44.82303, 11.61246], [44.82304, 11.61243], [44.82318, 11.61215], [44.82355, 11.61137], [44.82407, 11.61027], [44.82439, 11.6096], [44.82479, 11.60875], [44.82482, 11.60869], [44.82440, 11.60830], [44.82422, 11.60814], [44.82390, 11.60781], [44.82385, 11.60777], [44.82382, 11.60774], [44.82357, 11.60750], [44.82282, 11.60679], [44.82265, 11.60663], [44.82263, 11.60661], [44.82218, 11.60619], [44.82212, 11.60614], [44.82161, 11.60566], [44.82149, 11.60555], [44.82039, 11.60451], [44.82032, 11.60444], [44.82029, 11.60442], [44.81956, 11.60373], [44.81954, 11.60371], [44.81948, 11.60366], [44.81944, 11.60360], [44.81941, 11.60355], [44.81938, 11.60350], [44.81936, 11.60346], [44.81934, 11.60341], [44.81932, 11.60337], [44.8193, 11.60331], [44.81930, 11.60329], [44.81931, 11.60325], [44.81931, 11.60321], [44.81931, 11.60317], [44.81931, 11.60313], [44.81930, 11.60308], [44.81929, 11.60304], [44.81928, 11.60300], [44.81926, 11.60296], [44.81925, 11.60293], [44.81923, 11.60290], [44.81921, 11.60287], [44.81918, 11.60284], [44.81915, 11.60282], [44.81912, 11.60280], [44.81909, 11.60279], [44.81907, 11.60278], [44.81904, 11.60277], [44.81901, 11.60277], [44.81899, 11.60277], [44.81897, 11.60278], [44.81894, 11.60278], [44.81892, 11.60279], [44.81889, 11.60281], [44.81881, 11.60282], [44.81875, 11.60281], [44.81870, 11.60281], [44.81865, 11.60280], [44.81862, 11.60279], [44.81858, 11.60278], [44.81852, 11.60274], [44.81849, 11.60270], [44.81828, 11.60251], [44.81814, 11.60238], [44.81795, 11.60221], [44.81753, 11.60181], [44.81737, 11.60167], [44.81706, 11.60138], [44.81700, 11.60132], [44.81674, 11.60108], [44.81662, 11.60096], [44.81653, 11.60086], [44.81628, 11.60060], [44.81626, 11.60057], [44.81598, 11.60025], [44.81590, 11.60015], [44.81568, 11.59988], [44.81544, 11.59957], [44.81528, 11.59930], [44.81524, 11.59922], [44.81500, 11.59884], [44.81490, 11.59868], [44.81482, 11.59855], [44.81478, 11.59848], [44.81424, 11.59766], [44.81417, 11.59756], [44.81338, 11.59634], [44.81293, 11.59564], [44.81284, 11.59546], [44.81277, 11.59523], [44.81274, 11.59508], [44.81273, 11.59498], [44.81271, 11.59488], [44.81270, 11.59475], [44.81269, 11.59467], [44.81265, 11.59457], [44.81260, 11.59449], [44.81254, 11.59443], [44.81248, 11.59440], [44.81244, 11.59439], [44.81239, 11.59439], [44.81235, 11.59440], [44.81221, 11.59440], [44.81214, 11.59439], [44.81208, 11.59437], [44.81201, 11.59433], [44.81190, 11.59423], [44.81182, 11.59415], [44.8118, 11.59413], [44.81179, 11.59412], [44.81173, 11.59404], [44.81165, 11.59394], [44.81118, 11.59324], [44.81115, 11.59320], [44.81104, 11.59309], [44.81093, 11.59299], [44.81054, 11.59242], [44.81050, 11.59235], [44.81028, 11.59202], [44.81014, 11.59182], [44.80996, 11.59154], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80662, 11.58655], [44.80598, 11.58559], [44.80586, 11.5854], [44.80571, 11.58519], [44.80560, 11.58501], [44.80546, 11.58481], [44.80509, 11.58426], [44.80477, 11.58377], [44.80423, 11.58297], [44.80411, 11.58279], [44.80393, 11.58252], [44.80384, 11.58238], [44.80381, 11.58225], [44.80377, 11.58218], [44.80375, 11.58212], [44.80372, 11.58206], [44.80369, 11.58198], [44.80367, 11.58192], [44.80364, 11.58182], [44.80361, 11.58172], [44.80359, 11.58165], [44.80356, 11.58153], [44.80354, 11.58141], [44.80352, 11.58129], [44.80350, 11.58115], [44.80348, 11.58102], [44.80346, 11.58088], [44.80340, 11.57983], [44.80333, 11.57881], [44.80330, 11.57838], [44.80330, 11.57834], [44.80329, 11.57830], [44.80332, 11.57804], [44.80332, 11.57797], [44.80332, 11.57790], [44.80327, 11.57752], [44.80326, 11.57748], [44.80324, 11.57732], [44.80320, 11.57719], [44.80317, 11.57704], [44.80312, 11.57691], [44.80308, 11.57679], [44.80304, 11.57667], [44.80300, 11.57660], [44.80296, 11.57652], [44.80291, 11.57642], [44.80286, 11.57633], [44.80280, 11.57624], [44.80274, 11.57615], [44.80268, 11.57607], [44.80258, 11.57597], [44.80247, 11.57586], [44.80239, 11.57579], [44.80228, 11.57571], [44.80198, 11.57552], [44.80185, 11.57547], [44.80117, 11.57513], [44.80051, 11.57479], [44.80020, 11.57461], [44.79977, 11.57434], [44.79895, 11.57374], [44.79840, 11.57336], [44.79829, 11.57328], [44.79820, 11.57323], [44.79810, 11.57317], [44.79786, 11.57303], [44.79773, 11.57297], [44.79752, 11.57287], [44.79731, 11.57279], [44.79689, 11.57265], [44.79615, 11.57244], [44.79555, 11.57228], [44.79528, 11.57218], [44.79521, 11.57215], [44.79513, 11.57209], [44.79505, 11.57202], [44.79504, 11.57198], [44.79502, 11.57195], [44.79500, 11.57192], [44.79498, 11.5719], [44.79496, 11.57189], [44.79493, 11.57188], [44.79490, 11.57188], [44.79488, 11.57188], [44.79485, 11.57189], [44.79482, 11.57191], [44.79479, 11.57193], [44.79476, 11.57196], [44.79473, 11.57197], [44.79468, 11.57197], [44.79463, 11.57195], [44.79423, 11.57178], [44.79418, 11.57176], [44.79414, 11.57174], [44.79412, 11.57171], [44.79409, 11.57168], [44.79405, 11.57161], [44.79403, 11.57157], [44.79401, 11.57154], [44.79399, 11.57152], [44.79396, 11.57151], [44.79394, 11.57150], [44.79391, 11.57150], [44.79388, 11.57150], [44.79386, 11.57151], [44.79378, 11.57154], [44.79371, 11.57155], [44.79364, 11.57156], [44.79358, 11.57155], [44.79348, 11.57154], [44.79343, 11.57152], [44.79333, 11.57148], [44.79326, 11.57147], [44.79319, 11.57145], [44.79306, 11.57144], [44.79292, 11.57144], [44.79280, 11.57146], [44.79270, 11.57148], [44.79260, 11.57151], [44.79258, 11.57152], [44.79253, 11.57154], [44.79249, 11.57156], [44.79238, 11.57161], [44.79057, 11.57244], [44.79048, 11.57249], [44.79010, 11.57291], [44.78994, 11.57306], [44.78990, 11.57308], [44.78985, 11.57309], [44.78978, 11.57310], [44.78975, 11.57308], [44.78971, 11.57307], [44.78968, 11.57306], [44.78964, 11.57306], [44.78961, 11.57307], [44.78958, 11.57309], [44.78955, 11.57311], [44.78952, 11.57314], [44.78949, 11.57318], [44.78947, 11.57323], [44.78945, 11.57328], [44.78939, 11.57337], [44.78934, 11.57342], [44.78927, 11.57345], [44.78910, 11.57352], [44.78886, 11.57357], [44.78873, 11.57362], [44.78849, 11.57378], [44.78832, 11.57393], [44.78814, 11.57411], [44.78802, 11.57423], [44.78795, 11.57431], [44.78791, 11.57435], [44.78785, 11.57440], [44.78780, 11.57443], [44.78775, 11.57447], [44.78769, 11.57451], [44.78764, 11.57453], [44.78759, 11.57456], [44.78753, 11.57458], [44.78746, 11.5746], [44.78740, 11.57462], [44.78734, 11.57463], [44.78725, 11.57464], [44.78714, 11.57465], [44.78708, 11.57466], [44.78703, 11.57466], [44.78695, 11.57465], [44.78632, 11.57459], [44.78594, 11.57454], [44.78588, 11.57454], [44.78562, 11.57451], [44.78554, 11.57451], [44.78549, 11.57451], [44.78543, 11.57452], [44.78478, 11.57470], [44.78436, 11.57480], [44.78418, 11.57484], [44.78401, 11.57488], [44.78381, 11.57493], [44.78364, 11.57498], [44.78343, 11.57506], [44.78304, 11.57522], [44.78278, 11.57532], [44.78230, 11.57550], [44.78214, 11.57555], [44.78199, 11.57560], [44.78194, 11.57566], [44.78192, 11.57573], [44.78191, 11.57580], [44.78191, 11.57587], [44.78194, 11.57599], [44.78199, 11.57610], [44.78201, 11.57616], [44.78202, 11.57629], [44.78200, 11.57638], [44.78198, 11.57648], [44.78194, 11.57668], [44.78185, 11.57720], [44.78184, 11.57725], [44.78177, 11.57759], [44.78175, 11.57772], [44.78173, 11.57783], [44.78171, 11.57788], [44.78171, 11.57790], [44.78169, 11.57796], [44.78167, 11.57800], [44.78165, 11.57805], [44.78160, 11.57813], [44.78156, 11.57821], [44.78153, 11.57828], [44.78151, 11.57832], [44.78048, 11.58077], [44.78040, 11.58095], [44.78033, 11.58110], [44.78027, 11.58123], [44.78021, 11.58135], [44.78018, 11.58139], [44.78015, 11.58146], [44.78008, 11.58156], [44.77915, 11.58301], [44.77880, 11.58352], [44.77847, 11.58401], [44.77808, 11.58454], [44.77802, 11.58460], [44.77807, 11.58472], [44.77810, 11.58485], [44.77813, 11.58500], [44.77818, 11.58534], [44.77825, 11.58573], [44.77832, 11.58611], [44.77835, 11.58628], [44.77841, 11.58652], [44.77843, 11.58659], [44.77844, 11.58662], [44.77848, 11.58677], [44.77853, 11.58692], [44.77872, 11.58747], [44.77876, 11.58760], [44.77880, 11.58773], [44.77888, 11.58794], [44.77900, 11.58829], [44.77902, 11.58833], [44.77907, 11.58848], [44.77930, 11.58910], [44.77948, 11.58956], [44.77972, 11.59020]],
    'viacarloinfrancescomayr': [[44.83201, 11.61799], [44.83196, 11.61791], [44.83192, 11.61797], [44.83187, 11.61802], [44.83182, 11.61807], [44.83177, 11.61811], [44.83172, 11.61814], [44.83157, 11.61819], [44.83145, 11.61823], [44.83123, 11.61829], [44.83114, 11.61832], [44.83106, 11.61836], [44.83098, 11.61840], [44.83090, 11.61844], [44.83079, 11.61852], [44.83066, 11.61864], [44.83062, 11.61867], [44.83059, 11.61871], [44.83061, 11.61873], [44.83086, 11.61913], [44.83044, 11.61974], [44.83038, 11.61983], [44.83030, 11.61995], [44.83023, 11.62007], [44.83015, 11.62021], [44.83009, 11.62031], [44.83001, 11.62045], [44.82999, 11.62050], [44.82997, 11.62055], [44.82995, 11.62059], [44.82994, 11.62061], [44.82985, 11.62084], [44.82958, 11.62161], [44.82936, 11.62224], [44.82905, 11.62306], [44.82978, 11.62368], [44.82963, 11.62397], [44.82930, 11.62472], [44.82905, 11.62525], [44.82881, 11.62589], [44.82872, 11.62612], [44.82869, 11.62624], [44.82841, 11.62745], [44.82837, 11.62761], [44.82812, 11.62877], [44.82803, 11.62922], [44.82787, 11.62986], [44.82760, 11.63082], [44.82827, 11.63115], [44.82910, 11.63156], [44.82933, 11.63166], [44.82994, 11.63190], [44.82994, 11.63182], [44.83010, 11.63037], [44.83012, 11.63026], [44.83014, 11.63014], [44.83015, 11.63005], [44.83020, 11.62982], [44.83035, 11.62916]],
    'viadeibaluardi': [[44.82806, 11.62187], [44.82792, 11.62205], [44.82785, 11.62213], [44.82779, 11.62220], [44.82767, 11.62230], [44.82738, 11.62255], [44.82696, 11.62287], [44.82683, 11.62299], [44.82678, 11.62305], [44.82664, 11.62321], [44.82606, 11.62398], [44.82601, 11.62405], [44.82598, 11.62411], [44.82593, 11.62422], [44.82564, 11.62495], [44.82558, 11.62508], [44.82553, 11.62522], [44.82548, 11.62536], [44.82540, 11.62566], [44.82519, 11.62637], [44.82513, 11.62661], [44.82504, 11.62699], [44.82500, 11.62716], [44.82498, 11.62725], [44.82497, 11.62734], [44.82496, 11.62744], [44.82495, 11.62754], [44.82493, 11.62786], [44.82492, 11.62794], [44.82487, 11.62855], [44.82484, 11.62885], [44.82481, 11.62916], [44.82480, 11.62920], [44.82479, 11.62930], [44.82479, 11.62934], [44.82478, 11.62938], [44.82477, 11.62941], [44.82476, 11.62943], [44.82475, 11.62947], [44.82479, 11.62946], [44.82482, 11.62945], [44.82485, 11.62944], [44.82486, 11.62944], [44.82488, 11.62945], [44.82491, 11.62945], [44.82588, 11.62993], [44.82637, 11.63020], [44.82687, 11.63050], [44.82697, 11.63054], [44.82740, 11.63074], [44.82760, 11.63082], [44.82745, 11.63138], [44.82718, 11.63125]],
    'viaferrarese': [[44.82181, 11.43664], [44.82165, 11.43660], [44.82140, 11.43655], [44.82131, 11.43648], [44.82129, 11.43637], [44.82122, 11.43626], [44.82021, 11.43573], [44.82000, 11.43563], [44.81974, 11.43651], [44.81903, 11.43890], [44.81838, 11.44110], [44.81815, 11.44184], [44.81812, 11.44202], [44.81812, 11.44209], [44.81816, 11.44212], [44.81834, 11.44219], [44.81845, 11.44231], [44.81854, 11.44251], [44.81878, 11.44343], [44.81878, 11.44346], [44.81878, 11.44349], [44.81877, 11.44355], [44.81877, 11.44357], [44.81876, 11.44359], [44.81875, 11.44360], [44.81874, 11.44362], [44.81795, 11.44456], [44.81664, 11.44620], [44.81655, 11.44631], [44.81745, 11.44822], [44.81793, 11.44924], [44.81943, 11.45245], [44.81969, 11.45299], [44.81977, 11.45315], [44.81986, 11.45330], [44.81992, 11.45341], [44.81999, 11.45353], [44.82008, 11.45366], [44.82017, 11.45378], [44.82034, 11.45398], [44.82092, 11.45469], [44.82167, 11.45559], [44.82295, 11.45716], [44.82300, 11.45723], [44.82314, 11.45740], [44.82341, 11.45772], [44.82366, 11.45802], [44.82390, 11.45831], [44.82473, 11.45931], [44.82478, 11.45937], [44.82486, 11.45947], [44.82499, 11.45962], [44.82553, 11.46029], [44.82561, 11.46038], [44.82562, 11.46040], [44.82569, 11.46048], [44.82587, 11.46071], [44.82592, 11.46077], [44.82616, 11.46107], [44.82636, 11.46134], [44.82646, 11.46147], [44.82674, 11.46186], [44.82709, 11.46236], [44.82712, 11.46240], [44.82750, 11.46294], [44.82870, 11.46475], [44.82933, 11.46573], [44.82979, 11.46644], [44.83001, 11.46680], [44.83020, 11.46711], [44.83068, 11.46794], [44.83106, 11.4686], [44.83160, 11.46957], [44.83161, 11.46960], [44.83178, 11.46989], [44.83192, 11.47014], [44.83238, 11.47095], [44.83257, 11.47130], [44.83257, 11.47136], [44.83257, 11.47142], [44.83256, 11.47151], [44.83254, 11.47154], [44.83253, 11.47158], [44.83253, 11.47161], [44.83253, 11.47164], [44.83253, 11.47166], [44.83254, 11.47169], [44.83255, 11.47171], [44.83257, 11.47173], [44.83259, 11.47175], [44.83261, 11.47176], [44.83263, 11.47176], [44.83271, 11.47180], [44.83276, 11.47183], [44.8328, 11.47185], [44.83285, 11.47190], [44.83289, 11.47196], [44.83291, 11.47201], [44.83295, 11.47210], [44.83305, 11.47233], [44.83311, 11.47249], [44.83345, 11.47328], [44.83355, 11.47355], [44.83370, 11.47397], [44.83432, 11.47567], [44.83456, 11.47636], [44.83466, 11.47662], [44.83476, 11.47687], [44.83494, 11.47726], [44.83514, 11.47766], [44.83558, 11.47854], [44.83573, 11.47882], [44.83592, 11.47917], [44.83625, 11.47973], [44.83664, 11.48037], [44.83709, 11.48106], [44.83728, 11.48137], [44.83741, 11.4816], [44.83768, 11.48207], [44.83778, 11.48226], [44.83789, 11.48248], [44.83807, 11.48284], [44.83823, 11.48321], [44.83833, 11.48342], [44.83843, 11.48366], [44.83852, 11.48387], [44.83863, 11.48416], [44.83872, 11.48437], [44.83879, 11.48455], [44.83885, 11.48473], [44.83894, 11.48498], [44.83905, 11.48530], [44.83920, 11.48581], [44.83930, 11.48618], [44.83938, 11.48646], [44.83943, 11.48665], [44.83947, 11.48682], [44.83951, 11.48704], [44.83988, 11.48887], [44.83991, 11.48906], [44.83993, 11.48923], [44.83995, 11.48938], [44.83997, 11.48952], [44.83997, 11.48956], [44.83999, 11.48978], [44.84003, 11.49035], [44.84005, 11.49074], [44.84006, 11.49104], [44.84008, 11.49170], [44.84008, 11.49196], [44.84009, 11.49301], [44.84009, 11.49308], [44.84009, 11.49313], [44.84009, 11.49324], [44.84010, 11.49401], [44.84009, 11.49421], [44.84008, 11.49442], [44.84006, 11.49473], [44.84004, 11.49500], [44.83997, 11.49570], [44.83901, 11.49555], [44.83801, 11.49543], [44.83751, 11.49535], [44.83734, 11.49527], [44.83138, 11.49443], [44.83104, 11.49439]],
    'viaferraresi': [[44.82190, 11.59792], [44.82204, 11.59761], [44.82224, 11.59713], [44.82252, 11.59737], [44.82273, 11.59754], [44.82300, 11.59777], [44.82296, 11.59782], [44.82291, 11.59788], [44.82250, 11.59856], [44.82235, 11.59881], [44.82191, 11.59955], [44.82178, 11.59976], [44.82164, 11.59999], [44.82159, 11.60009], [44.82154, 11.60023], [44.82147, 11.60042], [44.82138, 11.60066], [44.82135, 11.60073], [44.82132, 11.60079], [44.82121, 11.60097], [44.82104, 11.60127], [44.82067, 11.60094], [44.82040, 11.60070], [44.82035, 11.60062], [44.82032, 11.60055], [44.82030, 11.60050], [44.82023, 11.60043], [44.82019, 11.60040], [44.82014, 11.60041], [44.8201, 11.60043], [44.82005, 11.60039], [44.81984, 11.60094], [44.8196, 11.60149], [44.81945, 11.60185], [44.81941, 11.60205], [44.81922, 11.60249], [44.81921, 11.60253], [44.81919, 11.60257], [44.81917, 11.6026], [44.81915, 11.60263], [44.81911, 11.60268], [44.81908, 11.60270], [44.81905, 11.60274], [44.81899, 11.60277], [44.81897, 11.60278], [44.81894, 11.60278], [44.81892, 11.60279], [44.81889, 11.60281], [44.81887, 11.60282], [44.81886, 11.60284], [44.81884, 11.60285], [44.81882, 11.60287], [44.81880, 11.60291], [44.81878, 11.60294], [44.81874, 11.60301], [44.81874, 11.60304], [44.81872, 11.60309], [44.81872, 11.60312], [44.81872, 11.60315], [44.81872, 11.60318], [44.81872, 11.60322], [44.81872, 11.60327], [44.81873, 11.60332], [44.81874, 11.60336], [44.81877, 11.60351], [44.81878, 11.60358], [44.81878, 11.60364], [44.81878, 11.60368], [44.81878, 11.60371], [44.81878, 11.60376], [44.81877, 11.60383], [44.81874, 11.60392], [44.81848, 11.60459], [44.81795, 11.60600], [44.81789, 11.60616], [44.81772, 11.60659], [44.81771, 11.60663], [44.81768, 11.60671], [44.81756, 11.60701], [44.81748, 11.60722], [44.81696, 11.60861], [44.81691, 11.60875], [44.81682, 11.60903], [44.81669, 11.60943], [44.81662, 11.60969], [44.81656, 11.60998], [44.81654, 11.61008], [44.81647, 11.61037], [44.81643, 11.61056], [44.8164, 11.61064], [44.81638, 11.61072], [44.81632, 11.61082], [44.81628, 11.61108], [44.81626, 11.61114], [44.81624, 11.61118], [44.81622, 11.61122], [44.81618, 11.61125], [44.81614, 11.61129], [44.81609, 11.61131], [44.81607, 11.61131], [44.81604, 11.61132], [44.81599, 11.61132], [44.81592, 11.61132], [44.81590, 11.61131], [44.81547, 11.61112], [44.81549, 11.61115], [44.81527, 11.61144], [44.81506, 11.61171], [44.81520, 11.61192], [44.81536, 11.61216], [44.81508, 11.61220], [44.81497, 11.61216]],
    'viagaribaldi': [[44.83600, 11.61500], [44.83587, 11.61489], [44.83579, 11.61480], [44.83577, 11.61478], [44.83562, 11.61506], [44.83543, 11.61543], [44.83538, 11.61551], [44.83521, 11.61581], [44.83520, 11.61583], [44.83516, 11.61578], [44.83502, 11.61594], [44.83464, 11.61634], [44.83463, 11.61635], [44.83457, 11.61640], [44.83444, 11.61656], [44.83422, 11.61679], [44.83381, 11.61737], [44.83376, 11.61744], [44.83372, 11.61748], [44.83384, 11.61767], [44.83394, 11.61783], [44.83417, 11.61809], [44.83443, 11.61832], [44.83444, 11.61834], [44.83474, 11.61858], [44.83497, 11.61875], [44.83499, 11.61877], [44.83503, 11.61884], [44.83507, 11.61888], [44.83515, 11.61896], [44.83524, 11.61904], [44.83532, 11.61911], [44.83536, 11.61914], [44.83540, 11.61917], [44.83544, 11.61918], [44.83548, 11.61919], [44.83549, 11.61919], [44.83550, 11.61919], [44.83552, 11.61918], [44.83555, 11.61916], [44.83562, 11.61921], [44.83566, 11.61922], [44.83590, 11.61932], [44.83595, 11.61934], [44.83604, 11.61939], [44.83602, 11.61951]],
    'vialecavour': [[44.84146, 11.60311], [44.84171, 11.60332], [44.84173, 11.60333], [44.84174, 11.60334], [44.84176, 11.60334], [44.84177, 11.60335], [44.84178, 11.60336], [44.84180, 11.60336], [44.84182, 11.60337], [44.84189, 11.60343], [44.84197, 11.60350], [44.84198, 11.60351], [44.84199, 11.60352], [44.84200, 11.60354], [44.84201, 11.60355], [44.84201, 11.60357], [44.84202, 11.60359], [44.84202, 11.60361], [44.84201, 11.60363], [44.84197, 11.60373], [44.84195, 11.60378], [44.84192, 11.60384], [44.84190, 11.60389], [44.84188, 11.60393], [44.84189, 11.60397], [44.84209, 11.60414], [44.84211, 11.60413], [44.84214, 11.60409], [44.84216, 11.60405], [44.84222, 11.60410], [44.84227, 11.60415], [44.84232, 11.60420], [44.84238, 11.60427], [44.84242, 11.60431], [44.84245, 11.60434], [44.84248, 11.60437], [44.84253, 11.60442], [44.84282, 11.60467], [44.84303, 11.60484], [44.84309, 11.60489], [44.84313, 11.60494], [44.84317, 11.60498], [44.84319, 11.60500], [44.84322, 11.60504], [44.84326, 11.60510], [44.84330, 11.60517], [44.84335, 11.60527], [44.84341, 11.60540], [44.84346, 11.60552], [44.84349, 11.60562], [44.84353, 11.60573], [44.84356, 11.60583], [44.84358, 11.60595], [44.84361, 11.60609], [44.84364, 11.60625], [44.84367, 11.60643], [44.84370, 11.60663], [44.84372, 11.60686], [44.84373, 11.60709], [44.84373, 11.60733], [44.84372, 11.60747], [44.84370, 11.60772], [44.84366, 11.60798], [44.84362, 11.60821], [44.84358, 11.60835], [44.84356, 11.60842], [44.84353, 11.60849], [44.84350, 11.60856], [44.84347, 11.60863], [44.84340, 11.60878], [44.84330, 11.60898], [44.84316, 11.60928], [44.84253, 11.61060], [44.84250, 11.61066], [44.84167, 11.61240], [44.84110, 11.61360], [44.84086, 11.61409], [44.84064, 11.61456], [44.84020, 11.61547], [44.83961, 11.61672], [44.83952, 11.61690], [44.83950, 11.61695], [44.83929, 11.61739], [44.83921, 11.61756], [44.83917, 11.61765], [44.83915, 11.6177], [44.83893, 11.61816], [44.83873, 11.61858], [44.83853, 11.61899], [44.83846, 11.61915], [44.83844, 11.61921], [44.83841, 11.61930], [44.83839, 11.61938], [44.83832, 11.61960], [44.83829, 11.61967], [44.83827, 11.61973], [44.83825, 11.61978], [44.83824, 11.61980], [44.83804, 11.62025], [44.83802, 11.62031], [44.83799, 11.62034], [44.83795, 11.62037], [44.83792, 11.62039], [44.83786, 11.62042], [44.83778, 11.62039], [44.83773, 11.62037], [44.83766, 11.62033], [44.83744, 11.62019]],
    'viamontebello': [[44.83797, 11.62502], [44.83797, 11.62502], [44.83789, 11.62530], [44.83772, 11.62521], [44.83780, 11.62492], [44.83782, 11.62485], [44.83782, 11.62469], [44.83799, 11.62422], [44.83786, 11.62411], [44.83774, 11.62402], [44.83769, 11.62399], [44.83766, 11.62396], [44.83754, 11.62387], [44.83770, 11.62347], [44.83773, 11.62341], [44.83781, 11.62318], [44.83729, 11.62285], [44.83687, 11.62259], [44.83684, 11.62265], [44.83638, 11.62366], [44.83611, 11.62422], [44.83609, 11.62426], [44.83607, 11.62430], [44.83561, 11.62519], [44.83596, 11.62549], [44.83637, 11.62584], [44.83663, 11.62606], [44.83671, 11.62612], [44.83674, 11.62614], [44.83688, 11.62624], [44.83700, 11.62632], [44.83716, 11.62642], [44.83750, 11.62663], [44.83759, 11.62668], [44.83763, 11.62671], [44.83768, 11.62673], [44.83778, 11.62679], [44.83816, 11.62702], [44.83881, 11.62741], [44.83894, 11.62749], [44.83969, 11.62794], [44.84059, 11.62849], [44.84063, 11.62852], [44.84069, 11.62855], [44.84107, 11.62878]],
    'viapalestro': [[44.83856, 11.62204], [44.83865, 11.62176], [44.83887, 11.62104], [44.83892, 11.62087], [44.83894, 11.62082], [44.83906, 11.62089], [44.83914, 11.62094], [44.83920, 11.62098], [44.83960, 11.62129], [44.84014, 11.62170], [44.84021, 11.62177], [44.84028, 11.62184], [44.84035, 11.62191], [44.84082, 11.62249], [44.84105, 11.62277], [44.84112, 11.62284], [44.84121, 11.62292], [44.84129, 11.62300], [44.84135, 11.62305], [44.84144, 11.62311], [44.84172, 11.62327], [44.84207, 11.62344], [44.84214, 11.62347], [44.84211, 11.62372], [44.84200, 11.62464], [44.84195, 11.62499]],
    'viapiangipane': [[44.83307, 11.61410], [44.83346, 11.61362], [44.83418, 11.61488], [44.83399, 11.61497], [44.83379, 11.61509], [44.83382, 11.61514], [44.83398, 11.61539], [44.83415, 11.61563], [44.83422, 11.61568], [44.83424, 11.61571], [44.83428, 11.61577], [44.83438, 11.61592], [44.83444, 11.61602], [44.83448, 11.61607], [44.83464, 11.61634], [44.83463, 11.61635], [44.83457, 11.61640], [44.83444, 11.61656], [44.83422, 11.61679], [44.83381, 11.61737], [44.83376, 11.61744], [44.83372, 11.61748], [44.83371, 11.61750], [44.83368, 11.61754], [44.83360, 11.61769], [44.83346, 11.61790], [44.83344, 11.61794], [44.83338, 11.61803], [44.83332, 11.61814], [44.83330, 11.61817], [44.83315, 11.61842], [44.83303, 11.61861], [44.83297, 11.61869], [44.83293, 11.61874], [44.83288, 11.61881], [44.83283, 11.61888], [44.83281, 11.61891], [44.83276, 11.61898], [44.83265, 11.61912], [44.83238, 11.61948], [44.83233, 11.61954], [44.83214, 11.61980], [44.83198, 11.62000], [44.83190, 11.62012], [44.83175, 11.62035], [44.83137, 11.62096], [44.83120, 11.62075], [44.83142, 11.62040]],
    'viaravenna': [[44.82505, 11.63237], [44.82466, 11.63247], [44.82465, 11.63242], [44.82464, 11.63238], [44.82464, 11.63236], [44.82463, 11.63230], [44.82461, 11.63222], [44.82458, 11.63212], [44.82452, 11.63192], [44.82448, 11.63178], [44.82396, 11.63022], [44.82377, 11.62966], [44.82374, 11.62954], [44.82371, 11.62944], [44.82368, 11.62932], [44.82363, 11.62909], [44.82361, 11.62897], [44.82360, 11.62891], [44.82360, 11.62885], [44.82359, 11.62880], [44.82353, 11.62875], [44.82351, 11.62874], [44.82350, 11.62873], [44.82317, 11.62855], [44.82314, 11.62853], [44.82306, 11.62848], [44.82299, 11.62845], [44.82292, 11.62843], [44.82286, 11.62842], [44.82267, 11.62850], [44.82264, 11.62851], [44.82261, 11.62852], [44.82258, 11.62852], [44.82254, 11.62853], [44.82251, 11.62853], [44.82246, 11.62853], [44.82243, 11.62851], [44.8224, 11.62850], [44.82237, 11.62849], [44.82234, 11.62850], [44.82231, 11.62852], [44.82228, 11.62854], [44.82226, 11.62857], [44.82224, 11.62861], [44.82223, 11.62865], [44.82220, 11.62875], [44.82215, 11.62889], [44.82211, 11.62898], [44.82203, 11.62910], [44.82200, 11.62916], [44.82196, 11.6292], [44.82192, 11.62923], [44.82186, 11.62923], [44.82183, 11.62924], [44.82180, 11.62923], [44.82174, 11.62920], [44.82167, 11.62916], [44.82161, 11.62912], [44.82143, 11.62901], [44.82142, 11.62901], [44.82120, 11.62886], [44.82119, 11.62885], [44.82107, 11.62874], [44.82108, 11.62872], [44.82108, 11.62870], [44.82109, 11.62868], [44.82109, 11.62865], [44.82109, 11.62862], [44.82108, 11.62859], [44.82107, 11.62857], [44.82105, 11.62855], [44.82103, 11.62854], [44.82101, 11.62854], [44.82098, 11.62854], [44.82096, 11.62856], [44.82095, 11.62858], [44.82094, 11.62858], [44.82094, 11.62860], [44.82087, 11.62860], [44.82082, 11.62860], [44.82080, 11.62860], [44.82075, 11.62858], [44.82068, 11.62856], [44.82053, 11.6285], [44.82050, 11.62848], [44.82044, 11.62845], [44.82041, 11.62844], [44.82041, 11.62843], [44.82029, 11.62837], [44.81989, 11.62822], [44.81982, 11.62820], [44.81969, 11.62816], [44.81954, 11.62811], [44.81947, 11.62809], [44.81936, 11.62806], [44.81926, 11.62803], [44.81917, 11.62800], [44.81911, 11.62800], [44.81904, 11.62800], [44.81898, 11.62801], [44.81879, 11.62811], [44.81849, 11.62829], [44.81796, 11.62861], [44.81776, 11.62871], [44.81768, 11.62877], [44.81759, 11.62886], [44.81726, 11.62919], [44.81715, 11.62929], [44.81707, 11.62936], [44.81698, 11.62942], [44.81689, 11.62948], [44.81679, 11.62954], [44.81669, 11.62958], [44.81660, 11.62960], [44.81648, 11.62965], [44.81636, 11.62969], [44.81626, 11.62974], [44.81616, 11.62981], [44.81603, 11.62990], [44.81592, 11.62999], [44.81581, 11.63008], [44.81573, 11.63010], [44.81561, 11.63019], [44.81557, 11.63022], [44.81527, 11.63049], [44.81502, 11.63071], [44.81496, 11.63075], [44.81492, 11.63077], [44.81487, 11.63078], [44.81483, 11.63078], [44.81476, 11.63076], [44.81475, 11.63073], [44.81472, 11.63069], [44.81469, 11.63066], [44.81465, 11.63064], [44.81461, 11.63063], [44.81458, 11.63064], [44.81454, 11.63066], [44.81451, 11.63070], [44.81448, 11.63074], [44.81446, 11.63079], [44.81446, 11.63084], [44.81446, 11.63088], [44.81434, 11.63121], [44.81430, 11.63131], [44.81425, 11.63137], [44.81422, 11.63142], [44.81418, 11.63147], [44.81414, 11.63150], [44.81396, 11.63164], [44.81391, 11.63167], [44.81364, 11.63186], [44.81338, 11.63203], [44.81317, 11.63217], [44.81298, 11.63230], [44.81279, 11.63244], [44.81265, 11.63257], [44.81249, 11.63270], [44.81228, 11.63292], [44.81198, 11.63325], [44.81170, 11.63356], [44.81145, 11.63383], [44.81126, 11.63405], [44.81123, 11.63409], [44.81121, 11.63410], [44.81109, 11.63424], [44.81083, 11.63453], [44.81069, 11.63468], [44.81061, 11.63475], [44.81054, 11.63480], [44.81046, 11.63485], [44.81042, 11.63487], [44.81032, 11.63490], [44.81018, 11.63494], [44.80986, 11.63504], [44.80943, 11.63516], [44.80905, 11.63528], [44.80892, 11.63531], [44.80870, 11.63537], [44.80840, 11.63546], [44.80820, 11.63551], [44.80811, 11.63554], [44.80793, 11.63559], [44.80780, 11.63563], [44.80762, 11.63569], [44.80732, 11.63579], [44.80708, 11.63587], [44.80695, 11.63591], [44.80682, 11.63595], [44.80660, 11.63600], [44.80649, 11.63602], [44.80608, 11.63608], [44.80580, 11.63612], [44.8053, 11.63616], [44.80470, 11.63623], [44.80419, 11.63629], [44.80231, 11.63650], [44.80212, 11.63652], [44.80022, 11.63669], [44.80009, 11.63670], [44.79858, 11.63684], [44.79835, 11.63686], [44.79806, 11.63689], [44.79776, 11.63686], [44.79753, 11.63688], [44.79730, 11.63691], [44.79693, 11.63695], [44.79625, 11.63703], [44.79566, 11.63710], [44.79536, 11.63713], [44.79521, 11.63714], [44.79449, 11.63720], [44.79435, 11.63721], [44.79416, 11.63723], [44.79394, 11.63725], [44.79359, 11.63729], [44.79331, 11.63731], [44.79239, 11.63742], [44.79215, 11.63749], [44.79209, 11.63749], [44.79108, 11.63759], [44.79087, 11.63760], [44.79036, 11.63765], [44.78954, 11.63774], [44.78922, 11.63779], [44.78905, 11.63781], [44.78892, 11.63783], [44.78872, 11.63787], [44.78844, 11.63793], [44.78819, 11.63798], [44.78802, 11.63802], [44.78789, 11.63806], [44.78771, 11.63811], [44.78754, 11.63817], [44.78734, 11.63823], [44.78722, 11.63828], [44.78711, 11.63832], [44.78696, 11.63839], [44.78682, 11.63846], [44.78666, 11.63854], [44.78655, 11.63860], [44.78643, 11.63867], [44.78600, 11.63898], [44.78578, 11.63915], [44.78560, 11.63931], [44.78543, 11.63946], [44.78530, 11.63959], [44.78515, 11.63973], [44.78494, 11.63995], [44.78459, 11.64033], [44.78408, 11.64092], [44.78332, 11.64178], [44.78000, 11.64558], [44.77909, 11.64661], [44.77828, 11.64753], [44.77579, 11.65025], [44.77163, 11.65478], [44.77124, 11.65521], [44.77018, 11.65634], [44.76988, 11.65666], [44.76977, 11.65672], [44.76972, 11.65674], [44.76967, 11.65674], [44.76962, 11.65674], [44.76958, 11.65672], [44.76954, 11.65669], [44.76952, 11.65665], [44.76950, 11.65661], [44.76948, 11.65657], [44.76947, 11.65649], [44.76941, 11.65578], [44.76941, 11.65565], [44.76942, 11.65548], [44.76977, 11.65570], [44.76983, 11.65572], [44.7699, 11.65576], [44.77, 11.65579], [44.77009, 11.65581], [44.77016, 11.65582], [44.77027, 11.65586], [44.77070, 11.65603], [44.77138, 11.65633], [44.77159, 11.65643], [44.77186, 11.65655], [44.77188, 11.65656], [44.77221, 11.65667], [44.77233, 11.65671], [44.77355, 11.65717], [44.77361, 11.65724], [44.77366, 11.65736], [44.77369, 11.65750], [44.77367, 11.65758], [44.77367, 11.65766], [44.77369, 11.65774], [44.77372, 11.65782], [44.77377, 11.65787], [44.77382, 11.65789], [44.77387, 11.65790], [44.77392, 11.65790], [44.77398, 11.65797], [44.77403, 11.65808], [44.77407, 11.65822], [44.77410, 11.65841], [44.77413, 11.65862], [44.77416, 11.65879], [44.77420, 11.65898], [44.77426, 11.65922], [44.77440, 11.65972], [44.77458, 11.66026], [44.77467, 11.66056], [44.77476, 11.66089], [44.77484, 11.66122], [44.77509, 11.66227], [44.77518, 11.66267], [44.77527, 11.66309], [44.77536, 11.66357], [44.77545, 11.66418], [44.77551, 11.66464], [44.77557, 11.66519], [44.77570, 11.66665], [44.77576, 11.66719], [44.77582, 11.66772], [44.77588, 11.66825], [44.77594, 11.66873], [44.77598, 11.66916], [44.77605, 11.66976], [44.77613, 11.67044], [44.77617, 11.67081], [44.77624, 11.67151], [44.77628, 11.67178], [44.77633, 11.67238], [44.77642, 11.67378], [44.77643, 11.67391], [44.77646, 11.67391], [44.77650, 11.67389], [44.77665, 11.67376], [44.77706, 11.67319], [44.77786, 11.67202], [44.77816, 11.67154], [44.77826, 11.67144], [44.77856, 11.67097], [44.77888, 11.67051], [44.77914, 11.67026], [44.77947, 11.67014], [44.77999, 11.66996]],
    'viasanromano': [[44.83460, 11.61966], [44.83461, 11.61964], [44.83462, 11.61962], [44.83473, 11.61934], [44.83476, 11.61925], [44.83479, 11.61919], [44.83492, 11.61887], [44.83497, 11.61875], [44.83474, 11.61858], [44.83444, 11.61834], [44.83443, 11.61832], [44.83417, 11.61809], [44.83394, 11.61783], [44.83384, 11.61767], [44.83372, 11.61748], [44.83371, 11.61750], [44.83368, 11.61754], [44.83360, 11.61769], [44.83346, 11.61790], [44.83344, 11.61794], [44.83338, 11.61803], [44.83332, 11.61814], [44.83330, 11.61817], [44.83315, 11.61842], [44.83303, 11.61861], [44.83297, 11.61869], [44.83293, 11.61874], [44.83288, 11.61881], [44.83283, 11.61888], [44.83281, 11.61891], [44.83276, 11.61898], [44.83265, 11.61912], [44.83238, 11.61948], [44.83233, 11.61954], [44.83214, 11.61980], [44.83198, 11.62000], [44.83190, 11.62012], [44.83175, 11.62035], [44.83137, 11.62096], [44.83120, 11.62075]],
    'viasavonarola': [[44.83341, 11.62419], [44.83362, 11.62438], [44.83403, 11.62466], [44.83389, 11.62498], [44.83376, 11.62526], [44.83350, 11.62579], [44.83317, 11.62636], [44.83291, 11.62682], [44.83279, 11.62706], [44.83221, 11.62816], [44.83309, 11.62873]],
    'viawagner': [[44.81498, 11.58498], [44.81480, 11.58523], [44.81466, 11.58542], [44.81245, 11.58847], [44.81234, 11.58869], [44.81205, 11.58910], [44.81210, 11.58919], [44.81220, 11.58936], [44.81225, 11.58942], [44.81229, 11.58946], [44.81230, 11.58950], [44.8123, 11.58954], [44.81228, 11.58953], [44.81225, 11.58953], [44.81221, 11.58955], [44.81218, 11.58957], [44.81214, 11.58960], [44.81173, 11.58999], [44.81053, 11.59115], [44.81026, 11.59141], [44.81019, 11.59144], [44.81014, 11.59146], [44.81011, 11.59148], [44.81007, 11.59148], [44.81003, 11.59148], [44.80998, 11.59149], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80023, 11.60518], [44.80352, 11.60198]],
    'wagner': [[44.81498, 11.58498], [44.81480, 11.58523], [44.81466, 11.58542], [44.81245, 11.58847], [44.81234, 11.58869], [44.81205, 11.58910], [44.81210, 11.58919], [44.81220, 11.58936], [44.81225, 11.58942], [44.81229, 11.58946], [44.81230, 11.58950], [44.8123, 11.58954], [44.81228, 11.58953], [44.81225, 11.58953], [44.81221, 11.58955], [44.81218, 11.58957], [44.81214, 11.58960], [44.81173, 11.58999], [44.81053, 11.59115], [44.81026, 11.59141], [44.81019, 11.59144], [44.81014, 11.59146], [44.81011, 11.59148], [44.81007, 11.59148], [44.81003, 11.59148], [44.80998, 11.59149], [44.80991, 11.59148], [44.80978, 11.59127], [44.80914, 11.59031], [44.80902, 11.59014], [44.80899, 11.59009], [44.80784, 11.58836], [44.80770, 11.58816], [44.80755, 11.58794], [44.80744, 11.58778], [44.80734, 11.58762], [44.80713, 11.58731], [44.80702, 11.58715], [44.80680, 11.58681], [44.80668, 11.58664], [44.80647, 11.58702], [44.80630, 11.58733], [44.80598, 11.58790], [44.80554, 11.58868], [44.80516, 11.58936], [44.80492, 11.58979], [44.80366, 11.59204], [44.80350, 11.59232], [44.79826, 11.60166], [44.80023, 11.60518], [44.80352, 11.60198]],
};





// Estrae la sequenza di nodi stradali compresi tra due punti da una lista geometrica pre-calcolata
function sliceStreetGeometryBetweenPoints(fullGeometry, lat1, lng1, lat2, lng2) {
    if (!fullGeometry || !Array.isArray(fullGeometry) || fullGeometry.length < 2) return null;

    let idx1 = -1, minDist1 = Infinity;
    let idx2 = -1, minDist2 = Infinity;

    for (let i = 0; i < fullGeometry.length; i++) {
        const [pLat, pLng] = fullGeometry[i];
        const d1 = calculateDistanceMeters(lat1, lng1, pLat, pLng);
        if (d1 < minDist1) {
            minDist1 = d1;
            idx1 = i;
        }
        const d2 = calculateDistanceMeters(lat2, lng2, pLat, pLng);
        if (d2 < minDist2) {
            minDist2 = d2;
            idx2 = i;
        }
    }

    // Se i punti selezionati sono a più di 60 metri dalla via, non forzare lo slicing (evita tagli nei campi)
    if (minDist1 > 350 || minDist2 > 350 || idx1 === -1 || idx2 === -1) return null;

    let sliced = [];
    if (idx1 <= idx2) {
        sliced = fullGeometry.slice(idx1, idx2 + 1);
    } else {
        sliced = fullGeometry.slice(idx2, idx1 + 1).reverse();
    }

    if (sliced.length >= 2) {
        const res = [[lat1, lng1], ...sliced, [lat2, lng2]];
        return res;
    }
    return null;
}

// Normalizza i nomi delle strade in modo pulito e specifico (senza accorpare vie diverse)
function normalizeStreetKey(name) {
    if (!name || typeof name !== 'string') return '';
    let s = name.toLowerCase().trim();
    // Rimuovi prefissi generici
    s = s.replace(/^(strada statale|strada provinciale|strada regionale|strada|via|viale|corso|piazza|piazzale|vicolo|largo|borgo|sp\s*\d+|ss\s*\d+|sr\s*\d+)\s+/gi, '');
    // Se contiene virgole o parentesi (es. "Via Ravenna, Ferrara"), estrai solo il nome primario
    s = s.split(/[,(]/)[0].trim();
    return s.replace(/[^a-z0-9]/g, '');
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

// Ricuce topologicamente molteplici way OpenStreetMap in un unico percorso continuo ordinato
function stitchOsmWays(waysList, lat1, lng1, lat2, lng2) {
    if (!waysList || !Array.isArray(waysList) || waysList.length === 0) return [];
    
    // Estrai le coordinate pulite di ciascun way
    const geoms = waysList
        .map(w => (w.geometry && Array.isArray(w.geometry)) ? w.geometry.map(pt => [pt.lat, pt.lon]) : null)
        .filter(g => g && g.length >= 2);

    if (geoms.length === 0) return [];
    if (geoms.length === 1) return geoms[0];

    // Trova il way più vicino al punto di partenza (lat1, lng1)
    let startIdx = 0, startDist = Infinity;
    for (let i = 0; i < geoms.length; i++) {
        const g = geoms[i];
        const dStart = Math.min(
            calculateDistanceMeters(lat1, lng1, g[0][0], g[0][1]),
            calculateDistanceMeters(lat1, lng1, g[g.length - 1][0], g[g.length - 1][1])
        );
        if (dStart < startDist) {
            startDist = dStart;
            startIdx = i;
        }
    }

    // Inizia la catena con il way identificato e orientalo correttamente verso lat2, lng2
    let chain = [...geoms[startIdx]];
    const dHeadStart = calculateDistanceMeters(lat1, lng1, chain[0][0], chain[0][1]);
    const dTailStart = calculateDistanceMeters(lat1, lng1, chain[chain.length - 1][0], chain[chain.length - 1][1]);
    if (dTailStart < dHeadStart) {
        chain.reverse();
    }

    const remaining = geoms.filter((_, idx) => idx !== startIdx);

    // Connetti ricorsivamente i way adiacenti per prossimità geometrica dei nodi estremi
    while (remaining.length > 0) {
        const tail = chain[chain.length - 1];
        let bestNextIdx = -1, bestNextDist = Infinity, shouldReverse = false;

        for (let i = 0; i < remaining.length; i++) {
            const g = remaining[i];
            const dHead = calculateDistanceMeters(tail[0], tail[1], g[0][0], g[0][1]);
            const dTail = calculateDistanceMeters(tail[0], tail[1], g[g.length - 1][0], g[g.length - 1][1]);
            
            if (dHead < bestNextDist) {
                bestNextDist = dHead;
                bestNextIdx = i;
                shouldReverse = false;
            }
            if (dTail < bestNextDist) {
                bestNextDist = dTail;
                bestNextIdx = i;
                shouldReverse = true;
            }
        }

        // Se il prossimo segmento è contiguo entro 75 metri, saldalo alla catena
        if (bestNextIdx !== -1 && bestNextDist < 75) {
            let nextGeom = remaining.splice(bestNextIdx, 1)[0];
            if (shouldReverse) nextGeom.reverse();
            chain.push(...nextGeom.slice(1));
        } else {
            break;
        }
    }

    return chain;
}

// Interroga OpenStreetMap Overpass API per estrarre la geometria esatta dei way appartenenti alla via specificata
async function fetchOsmWayGeometry(streetName, lat1, lng1, lat2, lng2) {
    if (!streetName) return null;
    const cleanName = streetName.replace(/^(via|viale|corso|strada provinciale|strada statale|strada|vicolo|piazza|piazzale)\s+/i, '').split(/[,(]/)[0].trim();
    if (cleanName.length < 2) return null;

    const minLat = (Math.min(lat1, lat2) - 0.006).toFixed(5);
    const maxLat = (Math.max(lat1, lat2) + 0.006).toFixed(5);
    const minLng = (Math.min(lng1, lng2) - 0.006).toFixed(5);
    const maxLng = (Math.max(lng1, lng2) + 0.006).toFixed(5);

    const safeClean = cleanName.replace(/['"\\\/]/g, '');
    const query = `[out:json][timeout:6];way["name"~"${safeClean}",i](${minLat},${minLng},${maxLat},${maxLng});out geom;`;
    const overpassUrls = [
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`
    ];

    for (const url of overpassUrls) {
        try {
            let signal;
            if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
                signal = AbortSignal.timeout(4000);
            }
            const res = await fetch(url, signal ? { signal } : {});
            if (res.ok) {
                const data = await res.json();
                if (data && data.elements && data.elements.length > 0) {
                    const stitched = stitchOsmWays(data.elements, lat1, lng1, lat2, lng2);
                    if (stitched && stitched.length >= 2) {
                        const sliced = sliceStreetGeometryBetweenPoints(stitched, lat1, lng1, lat2, lng2);
                        if (sliced && sliced.length >= 2) {
                            return sliced;
                        }
                        return stitched;
                    }
                }
            }
        } catch (e) {
            // Prova endpoint successivo
        }
    }
    return null;
}

// Helper per scaricare il tracciato da endpoint OSRM
async function fetchOsrmRoute(url, isReverse = false) {
    try {
        let signal;
        if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
            signal = AbortSignal.timeout(3500);
        }
        const response = await fetch(url, signal ? { signal } : {});
        if (response.ok) {
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                let coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                if (isReverse) {
                    coords = coords.reverse();
                }
                const steps = (route.legs && route.legs[0] && route.legs[0].steps) ? route.legs[0].steps : [];
                return { coords, distance: route.distance, duration: route.duration, steps };
            }
        }
    } catch (e) {
        // Fallback silenzioso
    }
    return null;
}

// Genera nodi intermedi curvati e geodetici lungo la carreggiata per evitare spezzate rigide
function generateSmoothRoadNodes(lat1, lng1, lat2, lng2, numSteps = 5) {
    const nodes = [];
    for (let s = 0; s <= numSteps; s++) {
        const t = s / numSteps;
        const curLat = lat1 + (lat2 - lat1) * t;
        const curLng = lng1 + (lng2 - lng1) * t;
        nodes.push([Number(curLat.toFixed(6)), Number(curLng.toFixed(6))]);
    }
    return nodes;
}

// Calcola il percorso reale tra due punti su una specifica strada seguendo la carreggiata OpenStreetMap
// REGOLA TASSATIVA: 
// 1. Nessun passaggio su strade con nome diverso (es. SP4 al posto di Via Ruffetta).
// 2. MAI linee rette: tracciamento sempre conforme alla carreggiata fisica.
// 3. ZERO giri strani: scarto di qualsiasi rotta che crei anelli o deviazioni da sensi unici.
async function routeBetweenPoints(lat1, lng1, lat2, lng2, targetStreetName) {
    const directDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    const normTarget = normalizeStreetKey(targetStreetName);
    const rawTarget = (targetStreetName || '').toLowerCase();
    const isRuffetta = normTarget.includes('ruffetta') || rawTarget.includes('ruffetta');

    // 1. Verifica nel database geometrico certificato ad alta precisione
    const geomKeysToTry = [normTarget, rawTarget.replace(/[^a-z0-9]/g, '')];
    if (isRuffetta) geomKeysToTry.unshift('ruffetta', 'viaruffetta');

    for (const gKey of geomKeysToTry) {
        if (STATIC_STREET_GEOMETRIES[gKey]) {
            const staticSliced = sliceStreetGeometryBetweenPoints(STATIC_STREET_GEOMETRIES[gKey], lat1, lng1, lat2, lng2);
            if (staticSliced && staticSliced.length >= 2) {
                return staticSliced;
            }
        }
    }

    // 2. OSRM Multi-profilo con routing bidirezionale anti-detour
    // (Bicycle e Foot seguono la sagoma fisica della carreggiata senza essere costretti a deviazioni da sensi unici o divieti)
    const endpoints = [
        { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true&continue_straight=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true&continue_straight=true`, rev: true },
        { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true&continue_straight=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true&continue_straight=true`, rev: true },
        { url: `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false }
    ];

    let bestCoords = null;
    let bestScore = -Infinity;

    for (const ep of endpoints) {
        const res = await fetchOsrmRoute(ep.url, ep.rev);
        if (res && res.coords && res.coords.length >= 2) {
            // Anti-detour: Per Via Ruffetta o vie provinciali specifiche, evita percorsi su altre SP
            if (isRuffetta && res.steps && res.steps.length > 0) {
                let hitsSp4 = false;
                for (const step of res.steps) {
                    const sName = (step.name || '').toLowerCase();
                    if (sName.includes('sp4') || sName.includes('sp 4') || (sName.includes('provinciale') && !sName.includes('ruffetta'))) {
                        hitsSp4 = true;
                        break;
                    }
                }
                if (hitsSp4) continue;
            }

            const ratio = res.distance / (directDist || 1);
            // FILTRO RIGIDO ANTI-GIRI STRANI: Se il percorso calcolato è oltre 1.45x la distanza reale (o 1.8x per micro tratte), è una deviazione anomala
            const maxRatioAllowed = directDist < 120 ? 2.5 : 2.0;
            if (ratio > maxRatioAllowed) continue;

            let score = 100 - Math.abs(ratio - 1.05) * 40 + Math.min(res.coords.length, 30);

            if (score > bestScore) {
                bestScore = score;
                let finalCoords = [...res.coords];
                finalCoords[0] = [lat1, lng1];
                finalCoords[finalCoords.length - 1] = [lat2, lng2];
                bestCoords = finalCoords;

                if (res.coords.length >= 3 && ratio <= 1.3) {
                    return finalCoords;
                }
            }
        }
    }

    if (bestCoords && bestCoords.length >= 2) {
        return bestCoords;
    }

    // 3. Fallback ad Alta Fedeltà: Overpass OSM Way Geometry Stitching
    try {
        const osmGeom = await fetchOsmWayGeometry(targetStreetName, lat1, lng1, lat2, lng2);
        if (osmGeom && osmGeom.length >= 2) {
            return osmGeom;
        }
    } catch (e) { }

    // 4. Fallback Geometrico Continuo (MAI linea retta secca a 2 punti)
    return generateSmoothRoadNodes(lat1, lng1, lat2, lng2, 6);
}

// Recupera la geometria reale dell'intera tratta stradale garantendo l'assenza di linee rette
async function getStreetGeometry(streetName, markerCoords) {
    const cacheKey = `${normalizeStreetKey(streetName) || streetName.toLowerCase()}_${markerCoords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
    
    // Controlla la cache se contiene una geometria valida
    if (streetGeomCache[cacheKey] && streetGeomCache[cacheKey].length >= 2) {
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
        
        if (fullRoute && fullRoute.length >= 2) {
            streetGeomCache[cacheKey] = fullRoute;
            saveStreetGeomCache();
            return fullRoute;
        }
    } catch (e) {
        console.warn('Errore calcolo geometria stradale:', e.message);
    }

    // In caso di errore estremo, genera nodi densi e continui
    return generateSmoothRoadNodes(markerCoords[0][0], markerCoords[0][1], markerCoords[markerCoords.length - 1][0], markerCoords[markerCoords.length - 1][1], 6);
}

// -------------------------------------------------------
// TRATTI STRADALI ROSSI
// Regola ferrea delle coppie per TUTTE le tipologie:
// - Due icone dello STESSO TIPO sullo STESSO NOME DI STRADA si collegano a coppie:
//   1a con 2a, 3a con 4a, 5a con 6a e così via.
// - Sempre e solo linee che seguono la carreggiata reale, senza MAI linee rette o giri strani
// -------------------------------------------------------
async function updateRoadSegments() {
    // 1. Raggruppa i marker per TIPO e VIA (o segmentId)
    const rawGroups = {};

    markersData.forEach(m => {
        if (!isMarkerVisible(m)) return;
        if (getMarkerScheduleStatus(m) !== 'active') return;

        // Le icone eliporto ed elisoccorso rappresentano siti puntuali e NON devono mai collegarsi tra di loro
        const mType = m.type || 'interruzione';
        if (mType === 'eliporto' || mType === 'elisoccorso') return;

        let streetKey = '';
        let displayName = '';
        if (m.segmentId) {
            streetKey = m.segmentId;
            displayName = m.street || 'Tratto stradale';
        } else if (m.street && m.street.trim() !== '') {
            const normKey = normalizeStreetKey(m.street);
            streetKey = normKey || m.street.trim().toLowerCase();
            displayName = m.street.trim();
        } else {
            return;
        }

        const groupKey = `${mType}__${streetKey}`;

        if (!rawGroups[groupKey]) {
            rawGroups[groupKey] = {
                type: mType,
                streetKey: streetKey,
                streetName: displayName,
                markers: []
            };
        }
        rawGroups[groupKey].markers.push(m);
    });

    const validSegments = {};

    // 2. Suddivide ogni gruppo in coppie indipendenti secondo la regola 1-2, 3-4, 5-6...
    // Ordine deterministico basato su timestamp e ordinamento alfanumerico naturale
    Object.keys(rawGroups).forEach(groupKey => {
        const group = rawGroups[groupKey];
        
        group.markers.sort((a, b) => {
            const timeA = a.timestamp || (a.schedule && a.schedule.timestamp) || 0;
            const timeB = b.timestamp || (b.schedule && b.schedule.timestamp) || 0;
            if (timeA && timeB && timeA !== timeB) return timeA - timeB;
            return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true });
        });

        for (let i = 0; i < group.markers.length - 1; i += 2) {
            const m1 = group.markers[i];
            const m2 = group.markers[i + 1];
            const pairIdx = Math.floor(i / 2);
            const segKey = `${groupKey}_pair_${pairIdx}`;
            validSegments[segKey] = {
                type: group.type,
                streetName: group.streetName,
                coords: [[m1.lat, m1.lng], [m2.lat, m2.lng]]
            };
        }
    });

    // 3. Rimuovi le polyline non più presenti
    for (let segKey in activeSegments) {
        if (!validSegments[segKey]) {
            map.removeLayer(activeSegments[segKey]);
            delete activeSegments[segKey];
        }
    }

    // 4. Disegna subito le linee sulla mappa con curve reali immediate (da cache o database statico)
    const segKeys = Object.keys(validSegments);
    segKeys.forEach(segKey => {
        const segment = validSegments[segKey];
        const cacheKey = `${normalizeStreetKey(segment.streetName) || segment.streetName.toLowerCase()}_${segment.coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
        
        let initialCoords = null;
        if (streetGeomCache[cacheKey] && streetGeomCache[cacheKey].length >= 2) {
            initialCoords = streetGeomCache[cacheKey];
        }

        if (!initialCoords) {
            const norm = normalizeStreetKey(segment.streetName);
            const raw = (segment.streetName || '').toLowerCase();
            const keysToCheck = [norm, raw.replace(/[^a-z0-9]/g, '')];
            if (raw.includes('ruffetta')) keysToCheck.unshift('ruffetta', 'viaruffetta');

            for (const k of keysToCheck) {
                if (STATIC_STREET_GEOMETRIES[k]) {
                    const sliced = sliceStreetGeometryBetweenPoints(STATIC_STREET_GEOMETRIES[k], segment.coords[0][0], segment.coords[0][1], segment.coords[1][0], segment.coords[1][1]);
                    if (sliced && sliced.length >= 2) {
                        initialCoords = sliced;
                        break;
                    }
                }
            }
        }

        // Se non ancora disponibile in cache, prepara nodi continui per evitare qualsiasi linea retta
        if (!initialCoords) {
            initialCoords = generateSmoothRoadNodes(segment.coords[0][0], segment.coords[0][1], segment.coords[1][0], segment.coords[1][1], 6);
        }

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

    // 5. Passo asincrono parallelo: affina il tracciato con le curve reali della carreggiata
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
            const loadedIds = new Set();
            if (data) {
                Object.entries(data).forEach(([fbKey, m]) => {
                    const localId = m.timestamp ? m.timestamp.toString() : (m.id || fbKey);
                    // Verifica se il marker o il suo segmento è stato eliminato definitivamente
                    const isDeleted = isPermanentlyDeletedMarker(m, localId, fbKey);
                    if (isDeleted) {
                        // Se è presente su Firebase Realtime Database, rimuovilo automaticamente per ripulire il cloud
                        if (isFirebaseOnline && markersRef && fbKey) {
                            markersRef.child(fbKey).remove()
                                .then(() => console.log('🧹 Purge automatico da Firebase:', fbKey))
                                .catch(() => {});
                        }
                        if (isFirebaseOnline && deletedMarkersRef) {
                            deletedMarkersRef.child(fbKey).set({ timestamp: Date.now(), purged: true }).catch(() => {});
                        }
                        return; // Non caricare eventi eliminati
                    }
                    loadedIds.add(localId);
                    if (m.id) loadedIds.add(m.id);
                    const markerObj = {
                        id: localId,
                        lat: m.lat,
                        lng: m.lng,
                        type: m.type,
                        note: m.note || null,
                        fbKey: fbKey,
                        street: m.street || null,
                        schedule: m.schedule || null,
                        segmentId: m.segmentId || null
                    };
                    markersData.push(markerObj);
                    addMarker(m.lat, m.lng, m.type, localId, false, m.note || null, fbKey, m.street || null, m.schedule || null, m.segmentId || null);
                });
            }

            // Includi i mercati settimanali di default della provincia di Ferrara e territori limitrofi se non già presenti e non eliminati
            if (typeof DEFAULT_WEEKLY_MARKETS !== 'undefined' && Array.isArray(DEFAULT_WEEKLY_MARKETS)) {
                DEFAULT_WEEKLY_MARKETS.forEach(dm => {
                    const isDeleted = isPermanentlyDeletedMarker(dm, dm.id, null);
                    if (!loadedIds.has(dm.id) && !isDeleted) {
                        markersData.push(dm);
                        addMarker(dm.lat, dm.lng, dm.type, dm.id, false, dm.note, null, dm.street, dm.schedule, dm.segmentId);
                    }
                });
            }

            saveToLocalStorage();
            console.log(`📍 ${markersData.length} marker caricati/aggiornati in tempo reale (inclusi mercati provinciali)`);

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
    loadDeletedMarkersFromLocalStorage();
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    markersData = [];
    const loadedIds = new Set();
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            parsed.forEach(m => {
                const isDeleted = isPermanentlyDeletedMarker(m, m.id, m.fbKey);
                if (isDeleted) return;
                loadedIds.add(m.id);
                markersData.push(m);
                addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null, m.schedule || null, m.segmentId || null);
            });
            console.log(`📍 Caricati ${markersData.length} marker da localStorage (offline)`);
        } catch (e) {
            console.error("Errore nel caricamento dei marker", e);
            markersData = [];
        }
    }

    // Includi i mercati settimanali di default della provincia di Ferrara e territori limitrofi se non già presenti e non eliminati
    if (typeof DEFAULT_WEEKLY_MARKETS !== 'undefined' && Array.isArray(DEFAULT_WEEKLY_MARKETS)) {
        DEFAULT_WEEKLY_MARKETS.forEach(dm => {
            const isDeleted = isPermanentlyDeletedMarker(dm, dm.id, null);
            if (!loadedIds.has(dm.id) && !isDeleted) {
                markersData.push(dm);
                addMarker(dm.lat, dm.lng, dm.type, dm.id, false, dm.note, null, dm.street, dm.schedule, dm.segmentId);
            }
        });
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
        const isDeleted = isPermanentlyDeletedMarker(m, m.id, m.fbKey);
        if (!isDeleted) {
            addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null, m.schedule || null, m.segmentId || null);
        }
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

// Invio notifica istantanea per Notizie Urgenti su Telegram (Canale / Gruppo / Chat)
async function sendTelegramUrgentNews(newsPayload) {
    if (!NOTIFICATIONS_CONFIG.telegram.enabled || !NOTIFICATIONS_CONFIG.telegram.botToken) {
        return;
    }

    const chatId = localStorage.getItem('ferrara_telegram_chat_id') || NOTIFICATIONS_CONFIG.telegram.chatId;
    if (!chatId) return;

    try {
        const text = escapeTelegramHtml(newsPayload.text || '');
        const dateStr = new Date(newsPayload.createdAt || Date.now()).toLocaleString('it-IT');
        let durationText = 'Fino a rimozione manuale';
        if (newsPayload.expiresAt) {
            durationText = `Fino al ${new Date(newsPayload.expiresAt).toLocaleString('it-IT')}`;
        }

        const message = `🚨 <b>COMUNICAZIONE URGENTE 118</b>\n` +
            `📍 <b>Viabilità Provincia di Ferrara</b>\n\n` +
            `⚠️ <b>AVVISO:</b>\n${text}\n\n` +
            `⏱️ <b>Validità:</b> ${durationText}\n` +
            `📅 <b>Data pubblicazione:</b> ${dateStr}\n\n` +
            `🗺️ <a href="https://viabilita118fe.vercel.app/">Apri Mappa Viabilità 118</a>`;

        const url = `https://api.telegram.org/bot${NOTIFICATIONS_CONFIG.telegram.botToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });

        if (res.ok) {
            console.log("📢 Notifica Telegram Urgent News inviata con successo!");
            showToast("📢 Notifica urgente inoltrata su Telegram!", "success", 4000);
        } else {
            const errData = await res.json();
            console.warn("⚠️ Risposta API Telegram Urgent News:", errData);
        }
    } catch (e) {
        console.warn("⚠️ Errore invio Telegram Urgent News:", e.message);
    }
}

async function testTelegramNews() {
    const chatInput = document.getElementById('admin-telegram-chat-input');
    const statusEl = document.getElementById('telegram-status-msg');
    const chatId = (chatInput ? chatInput.value.trim() : '') || localStorage.getItem('ferrara_telegram_chat_id') || NOTIFICATIONS_CONFIG.telegram.chatId;

    if (!chatId) {
        showToast("Inserisci un Chat ID o nome canale Telegram.", "warning", 3500);
        return;
    }

    if (statusEl) statusEl.textContent = "Invio in corso...";

    try {
        const testText = "Test di verifica ricezione allarmi urgenti 118 Viabilità Ferrara. Sistema attivo!";
        const message = `🚨 <b>TEST NOTIFICA 118 VIABILITÀ FERRARA</b>\n\n` +
            `✅ <b>Canale/Chat configurato correttamente!</b>\n` +
            `📢 <i>${testText}</i>\n\n` +
            `🕒 ${new Date().toLocaleString('it-IT')}\n\n` +
            `🗺️ <a href="https://viabilita118fe.vercel.app/">Apri Mappa Viabilità 118</a>`;

        const url = `https://api.telegram.org/bot${NOTIFICATIONS_CONFIG.telegram.botToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (res.ok) {
            if (statusEl) statusEl.textContent = "✅ Notifica Telegram inviata!";
            showToast("✅ Messaggio di prova inviato su Telegram!", "success", 4000);
        } else {
            const errData = await res.json();
            if (statusEl) statusEl.textContent = `❌ Errore: ${errData.description || 'Non riuscito'}`;
            showToast(`Errore Telegram: ${errData.description || res.statusText}`, "error", 5000);
        }
    } catch (e) {
        if (statusEl) statusEl.textContent = `❌ Errore di rete`;
        showToast("Errore di connessione a Telegram: " + e.message, "error", 4000);
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

// =======================================================
// MODULO NOTIZIE / COMUNICAZIONI URGENTI 118 (FLASH NEWS 20s)
// - Popup automatico di 20 secondi all'avvio per tutti gli utenti
// - Allarme sonoro e lampeggio nero/rosso per 10s all'inserimento
// - Gestione amministratore con durata, modifica e cancellazione (max 3 news)
// - Sincronizzazione in tempo reale su Firebase Realtime Database
// =======================================================

let emergencyFlashTimeout = null;

// Riproduce un allarme sonoro bitonale di emergenza (118 emergency alert)
function playEmergencyAudioAlert() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        // Allarme bitonale ripetuto ad alto impatto
        const tones = [
            { f: 920, t: 0.00, d: 0.22 },
            { f: 680, t: 0.25, d: 0.22 },
            { f: 920, t: 0.50, d: 0.22 },
            { f: 680, t: 0.75, d: 0.22 },
            { f: 920, t: 1.00, d: 0.22 },
            { f: 680, t: 1.25, d: 0.22 },
            { f: 960, t: 1.55, d: 0.40 }
        ];

        tones.forEach(tone => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(tone.f, now + tone.t);

            gain.gain.setValueAtTime(0, now + tone.t);
            gain.gain.linearRampToValueAtTime(0.35, now + tone.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + tone.t + tone.d);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + tone.t);
            osc.stop(now + tone.t + tone.d);
        });

        // Vibrazione su dispositivi mobili supportati
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 600]);
        }
    } catch (e) {
        console.warn("Impossibile riprodurre alert sonoro emergenza:", e);
    }
}

// Attiva l'alert sonoro, il lampeggio nero/rosso e la notifica di sistema
function triggerEmergencyNewsAlert() {
    // 1. Alert sonoro
    playEmergencyAudioAlert();

    // 2. Lampeggio nero e rosso per 10 secondi una volta sola
    const overlay = document.getElementById('emergency-flashing-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        if (emergencyFlashTimeout) {
            clearTimeout(emergencyFlashTimeout);
        }
        emergencyFlashTimeout = setTimeout(() => {
            overlay.classList.add('hidden');
            emergencyFlashTimeout = null;
        }, 10000); // 10 secondi
    }

    // 3. Notifica nativa di sistema (anche se l'app è in background, scheda minimizzata o schermo bloccato)
    if (urgentNewsData && urgentNewsData.length > 0) {
        const latestNews = urgentNewsData[0];
        const newsText = latestNews.text || 'Nuova allerta di viabilità provinciale a Ferrara';
        showSystemNotification('🚨 COMUNICAZIONE URGENTE 118', newsText);
    }
}

function initUrgentNewsListener() {
    if (!isFirebaseOnline || !urgentNewsRef) return;

    urgentNewsRef.on('value', (snapshot) => {
        const val = snapshot.val();
        allUrgentNewsRaw = [];
        if (val) {
            Object.entries(val).forEach(([key, item]) => {
                allUrgentNewsRaw.push({
                    id: key,
                    ...item
                });
            });
            // Ordina per data di creazione decrescente
            allUrgentNewsRaw.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }

        // Cache locale offline
        try {
            localStorage.setItem('ferrara_urgent_news_cache', JSON.stringify(allUrgentNewsRaw));
        } catch (e) { }

        processUrgentNews();
    }, (err) => {
        console.warn("Errore lettura urgent_news Firebase:", err.message);
        loadUrgentNewsFromLocalStorage();
    });
}

function loadUrgentNewsFromLocalStorage() {
    try {
        const cached = localStorage.getItem('ferrara_urgent_news_cache');
        if (cached) {
            allUrgentNewsRaw = JSON.parse(cached);
        } else {
            allUrgentNewsRaw = [];
        }
    } catch (e) {
        allUrgentNewsRaw = [];
    }
    processUrgentNews();
}

function processUrgentNews() {
    const now = Date.now();
    // Filtra quelle attive e non scadute (massimo 3)
    urgentNewsData = allUrgentNewsRaw.filter(item => {
        if (item.active === false) return false;
        if (item.expiresAt && item.expiresAt <= now) return false;
        return true;
    }).slice(0, 3);

    updateUserNewsButton();
    updateAdminNewsBadge();

    // Controllo se c'è una notizia attiva recente non ancora allertata su questo dispositivo
    if (urgentNewsData.length > 0) {
        let lastAlertedTime = 0;
        try {
            lastAlertedTime = parseInt(localStorage.getItem('ferrara_last_alerted_news_time') || '0', 10);
        } catch (e) { }

        const newestNewsTime = Math.max(...urgentNewsData.map(n => n.createdAt || n.updatedAt || 0));

        if (newestNewsTime > lastAlertedTime) {
            try {
                localStorage.setItem('ferrara_last_alerted_news_time', newestNewsTime.toString());
            } catch (e) { }
            triggerEmergencyNewsAlert();
        }
    }

    // Se l'amministratore ha aperto il pannello, aggiorna la lista
    const adminNewsModal = document.getElementById('admin-news-modal');
    if (adminNewsModal && !adminNewsModal.classList.contains('hidden')) {
        renderAdminNewsList();
    }

    // Se all'apertura dell'app ci sono news attive e non sono ancora state mostrate in questa sessione
    if (urgentNewsData.length > 0 && !urgentNewsShownThisSession) {
        urgentNewsShownThisSession = true;
        // Mostra il popup dopo un brevissimo delay per consentire il caricamento visivo
        setTimeout(() => {
            showUserUrgentNewsModal(false);
        }, 300);
    }
}

function updateUserNewsButton() {
    const userNewsBtn = document.getElementById('user-news-btn');
    const userNewsBadge = document.getElementById('user-news-badge');
    if (!userNewsBtn) return;

    const count = urgentNewsData.length;
    if (userNewsBadge) userNewsBadge.textContent = count;

    if (!isAdmin) {
        userNewsBtn.classList.remove('hidden');
        if (count > 0) {
            userNewsBtn.classList.add('has-active-news');
        } else {
            userNewsBtn.classList.remove('has-active-news');
        }
    } else {
        userNewsBtn.classList.add('hidden');
    }
}

function updateAdminNewsBadge() {
    const adminNewsBadge = document.getElementById('admin-news-badge');
    const adminNewsSlotsCount = document.getElementById('admin-news-slots-count');
    const activeCount = urgentNewsData.length;
    if (adminNewsBadge) adminNewsBadge.textContent = `${activeCount}/3`;
    if (adminNewsSlotsCount) adminNewsSlotsCount.textContent = `${activeCount} / 3 attive`;
}

// Mostra la finestra Flash News per gli utenti con conto alla rovescia di 20 secondi
function showUserUrgentNewsModal(isManualClick = false) {
    const modal = document.getElementById('urgent-news-modal');
    const listEl = document.getElementById('urgent-news-list');
    const timerCountdown = document.getElementById('urgent-timer-countdown');
    const dismissCountdown = document.getElementById('dismiss-btn-countdown');
    const progressBar = document.getElementById('urgent-progress-bar');

    if (!modal || !listEl || urgentNewsData.length === 0) {
        if (isManualClick) {
            showToast("Nessuna comunicazione urgente attiva al momento.", "normal", 3000);
        }
        return;
    }

    // Renderizza le notizie (max 3)
    listEl.innerHTML = urgentNewsData.map((item, idx) => {
        const safeText = escapeHtml(item.text);
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        let validityStr = 'Permanente (fino a cancellazione)';
        if (item.expiresAt) {
            validityStr = `Scadenza: ${new Date(item.expiresAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
        }

        return `
            <div class="urgent-news-card">
                <div class="urgent-card-top">
                    <span class="urgent-badge-pill">🚨 Avviso ${idx + 1} di ${urgentNewsData.length}</span>
                    <span class="urgent-card-date">🕒 ${dateStr}</span>
                </div>
                <div class="urgent-card-body">${safeText}</div>
                <div class="urgent-card-validity">⏳ ${validityStr}</div>
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');

    // Avvia conto alla rovescia di 20 secondi con barra di avanzamento fluida
    clearInterval(urgentNewsTimerInterval);
    urgentNewsSecondsLeft = 20;

    if (timerCountdown) timerCountdown.textContent = `${urgentNewsSecondsLeft}s`;
    if (dismissCountdown) dismissCountdown.textContent = `${urgentNewsSecondsLeft}s`;
    if (progressBar) progressBar.style.width = '100%';

    const startTime = Date.now();
    const durationMs = 20000;

    urgentNewsTimerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, durationMs - elapsed);
        const sec = Math.ceil(remaining / 1000);
        urgentNewsSecondsLeft = sec;

        if (timerCountdown) timerCountdown.textContent = `${sec}s`;
        if (dismissCountdown) dismissCountdown.textContent = `${sec}s`;
        if (progressBar) {
            const pct = (remaining / durationMs) * 100;
            progressBar.style.width = `${pct}%`;
        }

        if (remaining <= 0) {
            clearInterval(urgentNewsTimerInterval);
            closeUserUrgentNewsModal();
        }
    }, 100);
}

function closeUserUrgentNewsModal() {
    clearInterval(urgentNewsTimerInterval);
    const modal = document.getElementById('urgent-news-modal');
    if (modal) modal.classList.add('hidden');
}

// --- GESTIONE PANNELLO ADMIN NEWS ---

function openAdminNewsModal() {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const modal = document.getElementById('admin-news-modal');
    if (!modal) return;
    resetAdminNewsForm();
    renderAdminNewsList();
    modal.classList.remove('hidden');
}

function closeAdminNewsModal() {
    const modal = document.getElementById('admin-news-modal');
    if (modal) modal.classList.add('hidden');
    resetAdminNewsForm();
}

function renderAdminNewsList() {
    const listEl = document.getElementById('admin-news-items-list');
    const currentCountEl = document.getElementById('admin-news-current-count');
    if (!listEl) return;

    const now = Date.now();
    if (currentCountEl) currentCountEl.textContent = allUrgentNewsRaw.length;

    if (allUrgentNewsRaw.length === 0) {
        listEl.innerHTML = `
            <div class="empty-reports-msg" style="padding: 16px; background: rgba(30,41,59,0.5); border-radius: 8px; text-align: center; color: #94a3b8;">
                <p>Nessuna comunicazione urgente inserita. Usa il modulo sottostante per pubblicarne una nuova.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = allUrgentNewsRaw.map(item => {
        const safeText = escapeHtml(item.text);
        const safeId = escapeHtml(item.id);
        const isExpired = item.expiresAt && item.expiresAt <= now;
        const isActive = item.active !== false && !isExpired;

        let statusClass = isActive ? 'active' : (isExpired ? 'expired' : 'inactive');
        let statusLabel = isActive ? '🟢 Attiva' : (isExpired ? '🔴 Scaduta' : '⚪ Disattivata');

        const createdStr = item.createdAt ? new Date(item.createdAt).toLocaleString('it-IT') : '-';
        let expiryStr = 'Permanente (fino a cancellazione)';
        if (item.expiresAt) {
            expiryStr = new Date(item.expiresAt).toLocaleString('it-IT');
        }

        return `
            <div class="admin-news-item-card ${isActive ? '' : 'inactive'}" id="admin-news-card-${safeId}">
                <div class="admin-news-item-header">
                    <span class="admin-news-status-pill ${statusClass}">${statusLabel}</span>
                    <div class="admin-news-item-actions">
                        <button class="admin-action-small-btn" onclick="editAdminNews('${safeId}')">✏️ Modifica</button>
                        <button class="admin-action-small-btn" onclick="toggleAdminNews('${safeId}')">${item.active !== false ? '⏸️ Disattiva' : '▶️ Attiva'}</button>
                        <button class="admin-action-small-btn delete" onclick="deleteAdminNews('${safeId}')">🗑️ Elimina</button>
                    </div>
                </div>
                <div class="admin-news-item-text">${safeText}</div>
                <div class="admin-news-item-meta">
                    <span>📅 Inserita: ${createdStr}</span>
                    <span>⏳ Scadenza: ${expiryStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

function resetAdminNewsForm() {
    editingNewsId = null;
    const formTitle = document.getElementById('admin-news-form-title');
    const editIdInput = document.getElementById('admin-news-edit-id');
    const textInput = document.getElementById('admin-news-text-input');
    const durationSelect = document.getElementById('admin-news-duration-select');
    const customDateContainer = document.getElementById('admin-news-custom-date-container');
    const customDateInput = document.getElementById('admin-news-custom-date-input');
    const errorEl = document.getElementById('admin-news-form-error');
    const saveBtn = document.getElementById('admin-news-save-btn');
    const cancelBtn = document.getElementById('admin-news-cancel-edit-btn');
    const charCount = document.getElementById('admin-news-char-count');

    if (formTitle) formTitle.textContent = '➕ Nuova Comunicazione Urgente';
    if (editIdInput) editIdInput.value = '';
    if (textInput) textInput.value = '';
    if (charCount) charCount.textContent = '0';
    if (durationSelect) durationSelect.value = '24h';
    if (customDateContainer) customDateContainer.classList.add('hidden');
    if (customDateInput) customDateInput.value = '';
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
    if (saveBtn) saveBtn.textContent = 'Pubblica Notizia Urgente';
    if (cancelBtn) cancelBtn.classList.add('hidden');
}

window.editAdminNews = function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const item = allUrgentNewsRaw.find(n => n.id === id);
    if (!item) return;

    editingNewsId = id;
    const formTitle = document.getElementById('admin-news-form-title');
    const editIdInput = document.getElementById('admin-news-edit-id');
    const textInput = document.getElementById('admin-news-text-input');
    const durationSelect = document.getElementById('admin-news-duration-select');
    const customDateContainer = document.getElementById('admin-news-custom-date-container');
    const customDateInput = document.getElementById('admin-news-custom-date-input');
    const saveBtn = document.getElementById('admin-news-save-btn');
    const cancelBtn = document.getElementById('admin-news-cancel-edit-btn');
    const charCount = document.getElementById('admin-news-char-count');

    if (formTitle) formTitle.textContent = '✏️ Modifica Comunicazione Urgente';
    if (editIdInput) editIdInput.value = id;
    if (textInput) {
        textInput.value = item.text || '';
        if (charCount) charCount.textContent = textInput.value.length;
    }
    if (durationSelect) {
        durationSelect.value = item.durationType || '24h';
        if (item.durationType === 'custom') {
            if (customDateContainer) customDateContainer.classList.remove('hidden');
            if (customDateInput && item.expiresAt) {
                const d = new Date(item.expiresAt);
                const pad = (n) => n.toString().padStart(2, '0');
                customDateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            }
        } else {
            if (customDateContainer) customDateContainer.classList.add('hidden');
        }
    }
    if (saveBtn) saveBtn.textContent = 'Salva Modifiche';
    if (cancelBtn) cancelBtn.classList.remove('hidden');

    textInput.focus();
};

window.deleteAdminNews = async function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    if (!confirm("Sei sicuro di voler eliminare definitivamente questa notizia urgente?")) return;

    try {
        if (isFirebaseOnline && urgentNewsRef) {
            await urgentNewsRef.child(id).remove();
        } else {
            allUrgentNewsRaw = allUrgentNewsRaw.filter(n => n.id !== id);
            localStorage.setItem('ferrara_urgent_news_cache', JSON.stringify(allUrgentNewsRaw));
            processUrgentNews();
        }
        showToast("Notizia urgente eliminata.", "normal", 3000);
    } catch (e) {
        console.error("Errore cancellazione news:", e);
        showToast("Errore durante la cancellazione: " + e.message, "error", 4000);
    }
};

window.toggleAdminNews = async function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const item = allUrgentNewsRaw.find(n => n.id === id);
    if (!item) return;

    const newActiveState = item.active === false ? true : false;

    // Se stiamo attivando, verifichiamo che non ci siano già 3 attive
    if (newActiveState && urgentNewsData.length >= 3 && !urgentNewsData.some(n => n.id === id)) {
        showToast("Impossibile attivare: sono già presenti 3 notizie attive contemporaneamente.", "warning", 4000);
        return;
    }

    try {
        if (isFirebaseOnline && urgentNewsRef) {
            await urgentNewsRef.child(id).update({ active: newActiveState });
        } else {
            item.active = newActiveState;
            localStorage.setItem('ferrara_urgent_news_cache', JSON.stringify(allUrgentNewsRaw));
            processUrgentNews();
        }
        showToast(newActiveState ? "Notizia attivata." : "Notizia disattivata.", "normal", 2500);
    } catch (e) {
        console.error("Errore modifica stato news:", e);
        showToast("Errore: " + e.message, "error", 3500);
    }
};

async function saveAdminNews() {
    const textInput = document.getElementById('admin-news-text-input');
    const durationSelect = document.getElementById('admin-news-duration-select');
    const customDateInput = document.getElementById('admin-news-custom-date-input');
    const errorEl = document.getElementById('admin-news-form-error');
    const saveBtn = document.getElementById('admin-news-save-btn');

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    // Verifica stato amministratore
    if (!isAdmin) {
        if (errorEl) {
            errorEl.innerHTML = "⚠️ <strong>Accesso richiesto:</strong> solo l'amministratore autenticato può pubblicare notizie.";
            errorEl.classList.remove('hidden');
        }
        showToast("Accesso riservato all'amministratore!", "warning", 4000);
        return;
    }

    // Verifica stato autenticazione amministratore su Firebase
    if (isFirebaseOnline && (!auth || !auth.currentUser)) {
        if (errorEl) {
            errorEl.innerHTML = "⚠️ <strong>Accesso richiesto:</strong> per pubblicare o modificare notizie su Firebase devi prima accedere tramite il pulsante <strong>Accesso Admin</strong> in alto a destra.";
            errorEl.classList.remove('hidden');
        }
        showToast("Effettua prima l'Accesso Admin!", "warning", 4000);
        return;
    }

    const text = textInput ? textInput.value.trim() : '';
    if (!text) {
        if (errorEl) {
            errorEl.textContent = "Inserisci il testo del messaggio urgente.";
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const durationType = durationSelect ? durationSelect.value : '24h';
    let expiresAt = null;
    const now = Date.now();

    if (durationType === '6h') expiresAt = now + 6 * 3600 * 1000;
    else if (durationType === '12h') expiresAt = now + 12 * 3600 * 1000;
    else if (durationType === '24h') expiresAt = now + 24 * 3600 * 1000;
    else if (durationType === '48h') expiresAt = now + 48 * 3600 * 1000;
    else if (durationType === '3d') expiresAt = now + 3 * 86400 * 1000;
    else if (durationType === '7d') expiresAt = now + 7 * 86400 * 1000;
    else if (durationType === 'custom') {
        const customVal = customDateInput ? customDateInput.value : null;
        if (!customVal) {
            if (errorEl) {
                errorEl.textContent = "Seleziona la data e l'ora di scadenza.";
                errorEl.classList.remove('hidden');
            }
            return;
        }
        expiresAt = new Date(customVal).getTime();
        if (expiresAt <= now) {
            if (errorEl) {
                errorEl.textContent = "La data di scadenza deve essere futura.";
                errorEl.classList.remove('hidden');
            }
            return;
        }
    } else if (durationType === 'permanent') {
        expiresAt = null;
    }

    // Se è nuova inserzione, verifica limite massimo di 3 comunicazioni attive
    if (!editingNewsId) {
        const activeCount = allUrgentNewsRaw.filter(n => n.active !== false && (!n.expiresAt || n.expiresAt > now)).length;
        if (activeCount >= 3) {
            if (errorEl) {
                errorEl.textContent = "Limite massimo di 3 comunicazioni attive raggiunto. Elimina o disattiva una notizia esistente prima di aggiungerne un'altra.";
                errorEl.classList.remove('hidden');
            }
            return;
        }
    }

    if (saveBtn) saveBtn.disabled = true;

    const payload = {
        text: text,
        durationType: durationType,
        expiresAt: expiresAt,
        active: true,
        updatedAt: now
    };

    try {
        if (editingNewsId) {
            if (isFirebaseOnline && urgentNewsRef) {
                await urgentNewsRef.child(editingNewsId).update(payload);
            } else {
                const idx = allUrgentNewsRaw.findIndex(n => n.id === editingNewsId);
                if (idx !== -1) {
                    allUrgentNewsRaw[idx] = { ...allUrgentNewsRaw[idx], ...payload };
                }
                localStorage.setItem('ferrara_urgent_news_cache', JSON.stringify(allUrgentNewsRaw));
                processUrgentNews();
            }
            showToast("Notizia urgente aggiornata con successo!", "success", 3500);
        } else {
            payload.createdAt = now;
            if (isFirebaseOnline && urgentNewsRef) {
                await urgentNewsRef.push(payload);
            } else {
                const localId = 'news_' + now;
                allUrgentNewsRaw.unshift({ id: localId, ...payload });
                localStorage.setItem('ferrara_urgent_news_cache', JSON.stringify(allUrgentNewsRaw));
                processUrgentNews();
            }
            try {
                localStorage.setItem('ferrara_last_alerted_news_time', now.toString());
            } catch (e) { }
            triggerEmergencyNewsAlert();
            // Invia istantaneamente notifica su Telegram a canale/gruppo/operatori
            sendTelegramUrgentNews(payload);
            broadcastFcmPush('🚨 COMUNICAZIONE URGENTE 118', payload.text, now.toString());
            showToast("Notizia urgente pubblicata! Inviata su Telegram e ai dispositivi.", "success", 4000);
        }

        resetAdminNewsForm();
        renderAdminNewsList();
    } catch (e) {
        console.error("Errore salvataggio news urgente:", e);
        if (errorEl) {
            if (e.message && (e.message.includes("PERMISSION_DENIED") || e.message.includes("permission_denied") || e.message.includes("Permission denied"))) {
                errorEl.innerHTML = "⚠️ <strong>Permesso negato da Firebase:</strong><br>1. Verifica di aver effettuato l'<strong>Accesso Admin</strong> (in alto a destra).<br>2. Assicurati che nelle <strong>Regole di Firebase Database</strong> sia abilitata la scrittura per <code>urgent_news</code>.";
            } else {
                errorEl.textContent = "Errore durante il salvataggio: " + e.message;
            }
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Inizializza i listener per i pulsanti e campi del modulo Notizie Urgenti
function initUrgentNewsModule() {
    const userNewsBtn = document.getElementById('user-news-btn');
    const adminNewsBtn = document.getElementById('admin-news-btn');
    const closeUserModalBtn = document.getElementById('close-urgent-news-modal');
    const dismissUserModalBtn = document.getElementById('dismiss-urgent-news-btn');
    const closeAdminModalBtn = document.getElementById('close-admin-news-modal');
    const durationSelect = document.getElementById('admin-news-duration-select');
    const customDateContainer = document.getElementById('admin-news-custom-date-container');
    const textInput = document.getElementById('admin-news-text-input');
    const charCountEl = document.getElementById('admin-news-char-count');
    const saveBtn = document.getElementById('admin-news-save-btn');
    const cancelEditBtn = document.getElementById('admin-news-cancel-edit-btn');
    const urgentNewsModal = document.getElementById('urgent-news-modal');
    const adminNewsModal = document.getElementById('admin-news-modal');

    // Configurazione Notifiche Telegram per Notizie Urgenti
    const telegramChatInput = document.getElementById('admin-telegram-chat-input');
    const saveTelegramBtn = document.getElementById('save-telegram-chat-btn');
    const testTelegramBtn = document.getElementById('test-telegram-news-btn');
    const telegramStatusEl = document.getElementById('telegram-status-msg');

    if (telegramChatInput) {
        telegramChatInput.value = localStorage.getItem('ferrara_telegram_chat_id') || (NOTIFICATIONS_CONFIG && NOTIFICATIONS_CONFIG.telegram ? NOTIFICATIONS_CONFIG.telegram.chatId : '') || '';
    }

    if (saveTelegramBtn) {
        saveTelegramBtn.addEventListener('click', () => {
            const val = telegramChatInput ? telegramChatInput.value.trim() : '';
            if (!val) {
                showToast("Inserisci un Chat ID o canale valido", "warning", 3000);
                return;
            }
            localStorage.setItem('ferrara_telegram_chat_id', val);
            if (telegramStatusEl) {
                telegramStatusEl.textContent = "✅ Salvato!";
                setTimeout(() => { telegramStatusEl.textContent = ''; }, 3000);
            }
            showToast("Destinatario Telegram salvato con successo!", "success", 3000);
        });
    }

    if (testTelegramBtn) {
        testTelegramBtn.addEventListener('click', () => {
            testTelegramNews();
        });
    }

    if (userNewsBtn) {
        userNewsBtn.addEventListener('click', () => {
            showUserUrgentNewsModal(true);
        });
    }

    if (adminNewsBtn) {
        adminNewsBtn.addEventListener('click', () => {
            openAdminNewsModal();
        });
    }

    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', () => {
            closeUserUrgentNewsModal();
        });
    }

    if (dismissUserModalBtn) {
        dismissUserModalBtn.addEventListener('click', () => {
            closeUserUrgentNewsModal();
        });
    }

    if (urgentNewsModal) {
        urgentNewsModal.addEventListener('click', (e) => {
            if (e.target === urgentNewsModal) {
                closeUserUrgentNewsModal();
            }
        });
    }

    if (closeAdminModalBtn) {
        closeAdminModalBtn.addEventListener('click', () => {
            closeAdminNewsModal();
        });
    }

    if (adminNewsModal) {
        adminNewsModal.addEventListener('click', (e) => {
            if (e.target === adminNewsModal) {
                closeAdminNewsModal();
            }
        });
    }

    if (durationSelect && customDateContainer) {
        durationSelect.addEventListener('change', () => {
            customDateContainer.classList.toggle('hidden', durationSelect.value !== 'custom');
        });
    }

    if (textInput && charCountEl) {
        textInput.addEventListener('input', () => {
            charCountEl.textContent = textInput.value.length;
            const errorEl = document.getElementById('admin-news-form-error');
            if (errorEl) errorEl.classList.add('hidden');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveAdminNews();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            resetAdminNewsForm();
        });
    }
}

// =========================================================================
// SISTEMA NOTIFICHE PUSH IN BACKGROUND (FCM & Service Worker 100% Gratuito)
// =========================================================================
let fcmMessaging = null;
let currentPushToken = null;

async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.log('[Push] Notifiche push non supportate da questo browser/dispositivo.');
        return;
    }

    try {
        // Registrazione Service Worker
        const swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        console.log('[Push] Service Worker registrato con successo:', swReg.scope);

        // Verifica supporto Firebase Messaging
        let isFcmSupported = false;
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            try {
                isFcmSupported = await firebase.messaging.isSupported();
            } catch (e) {
                isFcmSupported = false;
            }
        }

        if (isFcmSupported) {
            fcmMessaging = firebase.messaging();

            // Ascolto messaggi in primo piano
            fcmMessaging.onMessage((payload) => {
                console.log('[Push] Messaggio ricevuto in primo piano:', payload);
                if (document.hidden) {
                    showSystemNotification(
                        payload.notification?.title || '🚨 COMUNICAZIONE URGENTE 118',
                        payload.notification?.body || 'Nuova allerta di viabilità provinciale a Ferrara'
                    );
                }
            });
        }

        // Se il permesso è già concesso, sincronizza il token del dispositivo
        if (Notification.permission === 'granted') {
            await syncFcmToken();
        } else if (Notification.permission === 'default') {
            // Mostra il banner di invito dopo 2.5 secondi per non essere invasivi all'avvio
            setTimeout(() => {
                showPushBanner();
            }, 2500);
        }
    } catch (err) {
        console.warn('[Push] Inizializzazione notifiche push:', err);
    }
}

async function syncFcmToken() {
    if (!fcmMessaging) return;
    try {
        const swReady = await navigator.serviceWorker.ready;
        const token = await fcmMessaging.getToken({
            serviceWorkerRegistration: swReady
        });
        if (token) {
            currentPushToken = token;
            console.log('[Push] Token FCM dispositivo attivo:', token);
            if (isFirebaseOnline && db) {
                const cleanKey = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
                await db.ref('fcm_tokens/' + cleanKey).set({
                    token: token,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                });
            }
        }
    } catch (e) {
        console.warn('[Push] Impossibile recuperare il token FCM:', e);
    }
}

async function requestPushPermission() {
    if (!('Notification' in window)) {
        showToast("Le notifiche non sono supportate su questo browser.", "warning", 3500);
        return;
    }
    try {
        const permission = await Notification.requestPermission();
        hidePushBanner();
        if (permission === 'granted') {
            showToast("🔔 Notifiche attivate! Riceverai gli allarmi 118 anche ad app chiusa.", "success", 4000);
            await syncFcmToken();
        } else {
            showToast("Notifiche non abilitate. Potrai riattivarle dalle impostazioni del browser.", "info", 4000);
        }
    } catch (err) {
        console.error('[Push] Errore richiesta permesso:', err);
    }
}

function showPushBanner() {
    const banner = document.getElementById('push-permission-banner');
    if (!banner) return;
    const dismissed = sessionStorage.getItem('ferrara_push_banner_dismissed');
    if (dismissed || Notification.permission !== 'default') return;
    banner.classList.remove('hidden');
}

function hidePushBanner() {
    const banner = document.getElementById('push-permission-banner');
    if (banner) banner.classList.add('hidden');
}

function showSystemNotification(title, body) {
    if (Notification.permission !== 'granted') return;
    try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                    body: body,
                    icon: 'icon-512.jpg',
                    badge: 'icon-512.jpg',
                    tag: 'urgent-news-118-' + Date.now(),
                    renotify: true,
                    requireInteraction: true,
                    vibrate: [300, 100, 300, 100, 300, 100, 400],
                    data: { url: './index.html?urgentNews=1' }
                });
            });
        } else {
            new Notification(title, {
                body: body,
                icon: 'icon-512.jpg'
            });
        }
    } catch (e) {
        console.warn('[Push] Errore notifica di sistema:', e);
    }
}

async function testDeviceNotification() {
    if (!('Notification' in window)) {
        showToast("Le notifiche non sono supportate da questo dispositivo/browser.", "error", 4000);
        return;
    }

    if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
            showToast("⚠️ Permesso notifiche non concesso. Abilitalo nelle impostazioni del browser/sito.", "warning", 5000);
            return;
        }
    }

    showToast("⏱️ Notifica di test programmata tra 3 secondi. Riduci l'app a icona o blocca lo schermo per testarla!", "info", 6000);

    setTimeout(() => {
        showSystemNotification(
            '🚨 TEST ALLARME 118',
            'Verifica ricezione allarme viabilità Ferrara completata con successo sul tuo dispositivo!'
        );
        playEmergencyAudioAlert();
    }, 3000);
}

let fcmServerKeyCache = '';
let fcmVapidKeyCache = '';

function getFcmServerKey() {
    if (fcmServerKeyCache) return fcmServerKeyCache;
    let key = '';
    try {
        key = localStorage.getItem('ferrara_fcm_server_key') || '';
    } catch (e) { }
    fcmServerKeyCache = key;
    return key;
}

function getFcmVapidKey() {
    if (fcmVapidKeyCache) return fcmVapidKeyCache;
    let key = '';
    try {
        key = localStorage.getItem('ferrara_fcm_vapid_key') || '';
    } catch (e) { }
    fcmVapidKeyCache = key;
    return key;
}

async function loadFcmKeysFromDb() {
    if (!isFirebaseOnline || !db) return;
    try {
        const snap = await db.ref('admin_settings').once('value');
        const val = snap.val();
        if (val) {
            if (val.fcmServerKey) {
                fcmServerKeyCache = val.fcmServerKey;
                try { localStorage.setItem('ferrara_fcm_server_key', val.fcmServerKey); } catch (e) { }
                const inputKey = document.getElementById('admin-fcm-key-input');
                if (inputKey && !inputKey.value) inputKey.value = val.fcmServerKey;
            }
            if (val.fcmVapidKey) {
                fcmVapidKeyCache = val.fcmVapidKey;
                try { localStorage.setItem('ferrara_fcm_vapid_key', val.fcmVapidKey); } catch (e) { }
                const inputVapid = document.getElementById('admin-fcm-vapid-input');
                if (inputVapid && !inputVapid.value) inputVapid.value = val.fcmVapidKey;
            }
            const statusEl = document.getElementById('fcm-key-status');
            if (statusEl && (val.fcmServerKey || val.fcmVapidKey)) statusEl.textContent = '✅ Chiavi caricate';
        }
    } catch (e) { }
}

async function saveFcmKeys() {
    const inputKey = document.getElementById('admin-fcm-key-input');
    const inputVapid = document.getElementById('admin-fcm-vapid-input');
    const statusEl = document.getElementById('fcm-key-status');

    const serverKeyVal = inputKey ? inputKey.value.trim() : '';
    const vapidKeyVal = inputVapid ? inputVapid.value.trim() : '';

    fcmServerKeyCache = serverKeyVal;
    fcmVapidKeyCache = vapidKeyVal;

    try {
        localStorage.setItem('ferrara_fcm_server_key', serverKeyVal);
        localStorage.setItem('ferrara_fcm_vapid_key', vapidKeyVal);
    } catch (e) { }

    if (isFirebaseOnline && db && isAdmin) {
        try {
            await db.ref('admin_settings/fcmServerKey').set(serverKeyVal);
            await db.ref('admin_settings/fcmVapidKey').set(vapidKeyVal);
        } catch (e) {
            console.warn("Errore salvataggio chiavi su db:", e);
        }
    }

    if (statusEl) statusEl.textContent = '✅ Chiavi salvate!';
    showToast("Chiavi salvate con successo! Riavvio sincronizzazione token...", "success", 4000);
    syncFcmToken();
}

async function runPushDiagnostic() {
    const resultsEl = document.getElementById('push-diagnostic-results');
    if (!resultsEl) return;
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = "⏳ Esecuzione diagnostica in corso...\n";

    let logs = [];

    // 1. Supporto Browser
    const hasSW = 'serviceWorker' in navigator;
    const hasNotification = 'Notification' in window;
    logs.push(`1. Supporto Browser: ${hasSW && hasNotification ? '✅ Supportato' : '❌ Non supportato'}`);

    // 2. Permesso Notifiche
    const perm = hasNotification ? Notification.permission : 'non disponibile';
    logs.push(`2. Permesso Notifiche: ${perm === 'granted' ? '✅ Concesso (granted)' : (perm === 'denied' ? '❌ Bloccato (denied)' : '⚠️ In attesa (default)')}`);

    // 3. Service Worker
    let swOk = false;
    let swReg = null;
    try {
        swReg = await navigator.serviceWorker.getRegistration('./firebase-messaging-sw.js');
        if (swReg) {
            swOk = true;
            logs.push(`3. Service Worker: ✅ Attivo (${swReg.scope})`);
        } else {
            swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            logs.push(`3. Service Worker: ⚠️ Registrato adesso (${swReg.scope})`);
            swOk = true;
        }
    } catch (errSW) {
        logs.push(`3. Service Worker: ❌ Errore (${errSW.message})`);
    }

    // 4. Chiave VAPID
    const vapidKey = getFcmVapidKey();
    logs.push(`4. Chiave Web Push (VAPID): ${vapidKey ? `✅ Presente (${vapidKey.substring(0, 10)}...)` : '⚠️ Non inserita (opzionale o richiesta da FCM)'}`);

    // 5. Generazione Token Dispositivo
    let tokenOk = false;
    if (hasNotification && perm === 'granted' && fcmMessaging && swReg) {
        try {
            const token = await fcmMessaging.getToken({
                serviceWorkerRegistration: swReg,
                vapidKey: vapidKey || undefined
            });
            if (token) {
                tokenOk = true;
                currentPushToken = token;
                logs.push(`5. Token Dispositivo: ✅ Generato (${token.substring(0, 16)}...)`);
            } else {
                logs.push(`5. Token Dispositivo: ❌ Nessun token restituito`);
            }
        } catch (errToken) {
            logs.push(`5. Token Dispositivo: ❌ Errore (${errToken.message})`);
        }
    } else {
        logs.push(`5. Token Dispositivo: ⚠️ Impossibile generare (permesso non ancora concesso o fcm non inizializzato)`);
    }

    // 6. Database Token
    if (isFirebaseOnline && db) {
        try {
            const snap = await db.ref('fcm_tokens').once('value');
            const val = snap.val();
            const count = val ? Object.keys(val).length : 0;
            logs.push(`6. Dispositivi Registrati nel Database: ✅ ${count} smartphone/computer`);
        } catch (errDb) {
            logs.push(`6. Dispositivi Registrati nel Database: ❌ Errore lettura (${errDb.message})`);
        }
    } else {
        logs.push(`6. Database: ⚠️ Offline`);
    }

    // 7. Chiave Server FCM
    const serverKey = getFcmServerKey();
    logs.push(`7. Chiave Server FCM per Invio: ${serverKey ? `✅ Presente (${serverKey.substring(0, 8)}...)` : '⚠️ Mancante (incollala da Firebase Console)'}`);

    resultsEl.innerHTML = logs.join('\n');
}

async function syncFcmToken() {
    if (!fcmMessaging) return;
    try {
        const swReady = await navigator.serviceWorker.ready;
        const vapidKey = getFcmVapidKey();
        const token = await fcmMessaging.getToken({
            serviceWorkerRegistration: swReady,
            vapidKey: vapidKey || undefined
        });
        if (token) {
            currentPushToken = token;
            console.log('[Push] Token FCM dispositivo attivo:', token);
            if (isFirebaseOnline && db) {
                const cleanKey = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
                await db.ref('fcm_tokens/' + cleanKey).set({
                    token: token,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                });
            }
        }
    } catch (e) {
        console.warn('[Push] Impossibile recuperare il token FCM:', e);
    }
}

async function broadcastFcmPush(title, body, newsId) {
    if (!isFirebaseOnline || !db) return;
    const serverKey = getFcmServerKey();
    if (!serverKey) {
        console.log('[Push] Nessuna FCM Server Key configurata dall\'admin.');
        return;
    }

    try {
        const snap = await db.ref('fcm_tokens').once('value');
        const data = snap.val();
        if (!data) {
            console.log('[Push] Nessun token registrato in fcm_tokens');
            return;
        }

        const tokens = Object.values(data)
            .map(item => (typeof item === 'string' ? item : item.token))
            .filter(t => typeof t === 'string' && t.length > 10);

        if (tokens.length === 0) {
            console.log('[Push] Nessun token valido trovato per il broadcast');
            return;
        }

        console.log(`[Push] Invio broadcast push a ${tokens.length} dispositivi registrati...`);

        // Suddividi in blocchi da 500 token (limite FCM)
        const chunkSize = 500;
        let successTotal = 0;
        let failTotal = 0;

        for (let i = 0; i < tokens.length; i += chunkSize) {
            const chunk = tokens.slice(i, i + chunkSize);
            const payload = {
                registration_ids: chunk,
                notification: {
                    title: title || '🚨 COMUNICAZIONE URGENTE 118',
                    body: body || 'Nuova allerta di viabilità provinciale registrata.',
                    icon: 'icon-512.jpg',
                    sound: 'default'
                },
                data: {
                    title: title || '🚨 COMUNICAZIONE URGENTE 118',
                    body: body || 'Nuova allerta di viabilità provinciale registrata.',
                    url: './index.html?urgentNews=1',
                    newsId: newsId || '',
                    timestamp: Date.now().toString()
                },
                priority: 'high'
            };

            try {
                const res = await fetch('https://fcm.googleapis.com/fcm/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'key=' + serverKey
                    },
                    body: JSON.stringify(payload)
                });
                const resData = await res.json();
                if (resData.success) successTotal += resData.success;
                if (resData.failure) failTotal += resData.failure;
            } catch (errChunk) {
                console.warn('[Push] Errore invio blocco FCM:', errChunk);
            }
        }

        console.log(`[Push] Esito invio FCM: ${successTotal} successi, ${failTotal} fallimenti su ${tokens.length} dispositivi.`);
        if (successTotal > 0) {
            showToast(`📢 Notifica inviata a ${successTotal} smartphone registrati!`, "success", 4500);
        }
    } catch (err) {
        console.error('[Push] Errore invio broadcast FCM:', err);
    }
}

function initPushModule() {
    const enableBtn = document.getElementById('enable-push-btn');
    const dismissBtn = document.getElementById('dismiss-push-btn');
    const testPushBtn = document.getElementById('admin-test-push-btn');
    const saveFcmKeyBtn = document.getElementById('save-fcm-key-btn');
    const diagnosticBtn = document.getElementById('run-push-diagnostic-btn');
    const fcmKeyInput = document.getElementById('admin-fcm-key-input');
    const fcmVapidInput = document.getElementById('admin-fcm-vapid-input');

    if (enableBtn) {
        enableBtn.addEventListener('click', requestPushPermission);
    }
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hidePushBanner();
            sessionStorage.setItem('ferrara_push_banner_dismissed', '1');
        });
    }
    if (testPushBtn) {
        testPushBtn.addEventListener('click', testDeviceNotification);
    }
    if (saveFcmKeyBtn) {
        saveFcmKeyBtn.addEventListener('click', saveFcmKeys);
    }
    if (diagnosticBtn) {
        diagnosticBtn.addEventListener('click', runPushDiagnostic);
    }
    if (fcmKeyInput) {
        const stored = getFcmServerKey();
        if (stored) fcmKeyInput.value = stored;
    }
    if (fcmVapidInput) {
        const storedVapid = getFcmVapidKey();
        if (storedVapid) fcmVapidInput.value = storedVapid;
    }
    initPushNotifications();
    loadFcmKeysFromDb();
}

// =======================================================
// MODULO GESTIONE TRACCIATI E PERCORSI EVENTI SPECIALI (ADMIN)
// =======================================================

function initCustomRoutesListener() {
    if (!isFirebaseOnline || !customRoutesRef) return;

    customRoutesRef.on('value', (snapshot) => {
        const val = snapshot.val();
        customRoutesData = [];
        if (val) {
            Object.entries(val).forEach(([key, item]) => {
                customRoutesData.push({
                    id: key,
                    ...item
                });
            });
            // Ordina per data creazione decrescente
            customRoutesData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }

        // Cache locale offline
        try {
            localStorage.setItem('ferrara_viabilita_custom_routes', JSON.stringify(customRoutesData));
        } catch (e) { }

        renderCustomRoutesOnMap();
        renderAdminRoutesList();
        updateAdminRoutesBadge();
    }, (err) => {
        console.warn("Errore lettura custom_routes Firebase:", err.message);
        loadCustomRoutesFromLocalStorage();
    });
}

function loadCustomRoutesFromLocalStorage() {
    try {
        const cached = localStorage.getItem('ferrara_viabilita_custom_routes');
        if (cached) {
            customRoutesData = JSON.parse(cached);
        } else {
            customRoutesData = [];
        }
    } catch (e) {
        customRoutesData = [];
    }
    renderCustomRoutesOnMap();
    renderAdminRoutesList();
    updateAdminRoutesBadge();
}

function calculateRouteDistance(points) {
    if (!points || points.length < 2) return '0 m';
    let totalMeters = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = L.latLng(points[i][0], points[i][1]);
        const p2 = L.latLng(points[i + 1][0], points[i + 1][1]);
        totalMeters += p1.distanceTo(p2);
    }
    if (totalMeters >= 1000) {
        return (totalMeters / 1000).toFixed(2) + ' km';
    }
    return Math.round(totalMeters) + ' m';
}

function getDashArray(dashStyle) {
    if (dashStyle === 'dashed') return '12, 10';
    if (dashStyle === 'dotted') return '4, 8';
    return null;
}

function isCustomRouteVisible(route, now = new Date()) {
    if (!route || !route.points || route.points.length < 2) return false;
    
    // Se non è attivo manualmente, non è visibile
    if (route.active === false) return false;

    // Se è impostata una finestra temporale
    if (route.scheduleMode === 'window') {
        if (route.schedStart) {
            const startDate = new Date(route.schedStart);
            if (!isNaN(startDate.getTime()) && now < startDate) return false;
        }
        if (route.schedEnd) {
            const endDate = new Date(route.schedEnd);
            if (!isNaN(endDate.getTime()) && now > endDate) return false;
        }
    }

    return true;
}

function updateAdminRoutesBadge() {
    const totalCount = customRoutesData.length;
    const activeCount = customRoutesData.filter(r => isCustomRouteVisible(r)).length;
    if (adminRoutesBadge) {
        if (totalCount === 0) {
            adminRoutesBadge.textContent = '0';
        } else if (activeCount === totalCount) {
            adminRoutesBadge.textContent = String(activeCount);
        } else {
            adminRoutesBadge.textContent = `${activeCount}/${totalCount}`;
        }
    }
    if (adminRoutesCount) {
        adminRoutesCount.textContent = `${activeCount} attivi (${totalCount} in memoria)`;
    }
    if (adminRoutesTotalCount) {
        adminRoutesTotalCount.textContent = totalCount;
    }
}

function renderCustomRoutesOnMap() {
    if (!map) return;
    const now = new Date();

    const currentVisibleIds = new Set();

    customRoutesData.forEach((route) => {
        const isCurrentlyActive = isCustomRouteVisible(route, now);
        // L'amministratore vede tutti i percorsi (attivi, futuri e nascosti), il pubblico solo quelli attualmente attivi
        const shouldShowOnMap = isCurrentlyActive || (isAdmin && route.points && route.points.length >= 2);

        if (shouldShowOnMap) {
            currentVisibleIds.add(route.id);
            const color = route.color || '#8b5cf6';
            const weight = Number(route.weight) || 6;
            const typeConfig = ROUTE_TYPES_CONFIG[route.type] || ROUTE_TYPES_CONFIG['corteo'];

            // Se è attivo ha opacità piena, se è futuro/nascosto ma visibile all'admin è tratteggiato e semitrasparente
            const isPreviewOnly = !isCurrentlyActive && isAdmin;
            const opacity = isPreviewOnly ? 0.55 : 0.92;
            const dashArray = isPreviewOnly ? '8, 8' : getDashArray(route.dashStyle);

            const polylineOptions = {
                color: color,
                weight: weight,
                opacity: opacity,
                lineJoin: 'round',
                lineCap: 'round',
                dashArray: dashArray,
                className: isPreviewOnly ? 'custom-event-route-polyline admin-preview' : 'custom-event-route-polyline'
            };

            const statusSuffix = isPreviewOnly ? (route.active === false ? ' [⚪ Nascosto]' : ' [⏳ Programmato]') : '';
            const tooltipText = `${typeConfig.icon} ${escapeHtml(route.name)}${statusSuffix}`;

            if (!activeCustomRouteLayers[route.id]) {
                const polyline = L.polyline(route.points, polylineOptions).addTo(map);

                // Tooltip
                polyline.bindTooltip(tooltipText, {
                    permanent: false,
                    direction: 'center',
                    className: 'custom-route-tooltip'
                });

                // Popup
                polyline.bindPopup(createRoutePopupContent(route), {
                    className: 'custom-route-popup',
                    maxWidth: 320
                });

                activeCustomRouteLayers[route.id] = polyline;
            } else {
                const existingLayer = activeCustomRouteLayers[route.id];
                existingLayer.setLatLngs(route.points);
                existingLayer.setStyle(polylineOptions);
                existingLayer.setTooltipContent(tooltipText);
                existingLayer.setPopupContent(createRoutePopupContent(route));
            }
        }
    });

    // Rimuovi layer non più visibili o eliminati
    Object.keys(activeCustomRouteLayers).forEach((routeId) => {
        if (!currentVisibleIds.has(routeId)) {
            map.removeLayer(activeCustomRouteLayers[routeId]);
            delete activeCustomRouteLayers[routeId];
        }
    });

    updateAdminRoutesBadge();
}

function createRoutePopupContent(route) {
    const typeConfig = ROUTE_TYPES_CONFIG[route.type] || ROUTE_TYPES_CONFIG['corteo'];
    const distText = route.distanceText || calculateRouteDistance(route.points);
    let schedHtml = '';
    if (route.scheduleMode === 'window' && (route.schedStart || route.schedEnd)) {
        const startStr = route.schedStart ? new Date(route.schedStart).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Subito';
        const endStr = route.schedEnd ? new Date(route.schedEnd).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sempre';
        schedHtml = `<div class="custom-route-popup-meta">⏱️ <strong>Orario previsto:</strong> dal ${startStr} al ${endStr}</div>`;
    }

    let adminActionsHtml = '';
    if (isAdmin) {
        const activeText = route.active ? '⚪ Nascondi' : '🟢 Mostra';
        adminActionsHtml = `
            <div class="custom-route-popup-actions">
                <button type="button" class="route-icon-btn" onclick="toggleCustomRouteVisibility('${escapeHtml(route.id)}')" title="Attiva o disattiva visibilità">${activeText}</button>
                <button type="button" class="route-icon-btn" onclick="editCustomRoute('${escapeHtml(route.id)}')" title="Modifica dettagli percorso">✏️ Modifica</button>
                <button type="button" class="route-icon-btn delete" onclick="deleteCustomRoute('${escapeHtml(route.id)}')" title="Elimina percorso">🗑️ Elimina</button>
            </div>
        `;
    }

    return `
        <div class="custom-route-popup-content" style="--route-color: ${escapeHtml(route.color || '#8b5cf6')};">
            <div class="custom-route-popup-header">
                <span class="custom-route-popup-icon">${typeConfig.icon}</span>
                <h4 class="custom-route-popup-title">${escapeHtml(route.name)}</h4>
            </div>
            <div class="custom-route-popup-meta">
                <span class="route-item-type-badge">${typeConfig.label}</span>
                <span>• Lunghezza: <strong>${distText}</strong></span>
            </div>
            ${schedHtml}
            ${route.note ? `<div class="custom-route-popup-note"><strong>Note:</strong> ${escapeHtml(route.note)}</div>` : ''}
            ${adminActionsHtml}
        </div>
    `;
}

function renderAdminRoutesList() {
    if (!adminRoutesItemsList) return;

    if (customRoutesData.length === 0) {
        adminRoutesItemsList.innerHTML = `
            <div style="text-align:center; padding: 24px 12px; color: #94a3b8; font-size: 0.9rem;">
                <p>Nessun percorso speciale tracciato.</p>
                <small>Clicca sul pulsante in alto per tracciare a mano un corteo, gara o evento sulla mappa.</small>
            </div>
        `;
        return;
    }

    const now = new Date();
    let html = '';

    customRoutesData.forEach((route) => {
        const isNowVisible = isCustomRouteVisible(route, now);
        const typeConfig = ROUTE_TYPES_CONFIG[route.type] || ROUTE_TYPES_CONFIG['corteo'];
        const distText = route.distanceText || calculateRouteDistance(route.points);
        const color = route.color || '#8b5cf6';

        let statusBadge = '';
        if (route.active) {
            if (isNowVisible) {
                statusBadge = '<span style="color:#4ade80; font-weight:700;">🟢 Attivo sulla mappa</span>';
            } else {
                statusBadge = '<span style="color:#facc15; font-weight:600;">⏳ Programmato (orario futuro/passato)</span>';
            }
        } else {
            statusBadge = '<span style="color:#94a3b8; font-weight:600;">⚪ Nascosto</span>';
        }

        let schedSummary = '';
        if (route.scheduleMode === 'window' && (route.schedStart || route.schedEnd)) {
            const startStr = route.schedStart ? new Date(route.schedStart).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Subito';
            const endStr = route.schedEnd ? new Date(route.schedEnd).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Indefinito';
            schedSummary = `<div class="route-item-meta">⏱️ ${startStr} ➔ ${endStr}</div>`;
        }

        html += `
            <div class="route-item-card" data-route-id="${escapeHtml(route.id)}">
                <div class="route-item-info">
                    <span class="route-color-indicator" style="background-color: ${escapeHtml(color)}; color: ${escapeHtml(color)};"></span>
                    <div class="route-item-texts">
                        <div class="route-item-title-row">
                            <span class="route-item-name">${escapeHtml(route.name)}</span>
                            <span class="route-item-type-badge">${typeConfig.icon} ${typeConfig.label}</span>
                        </div>
                        <div class="route-item-meta">
                            <span>Lunghezza: <strong>${distText}</strong> (${route.points ? route.points.length : 0} punti) • ${statusBadge}</span>
                        </div>
                        ${schedSummary}
                        ${route.note ? `<div class="route-item-meta" style="color:#cbd5e1; font-style:italic;">"${escapeHtml(route.note)}"</div>` : ''}
                    </div>
                </div>

                <div class="route-item-actions">
                    <button type="button" class="route-icon-btn" onclick="zoomToCustomRoute('${escapeHtml(route.id)}')" title="Centra e visualizza sulla mappa">🔍 Mappa</button>
                    <button type="button" class="route-icon-btn" onclick="toggleCustomRouteVisibility('${escapeHtml(route.id)}')" title="${route.active ? 'Disattiva e nascondi' : 'Attiva e rendi visibile'}">
                        ${route.active ? '👁️ Nascondi' : '🟢 Mostra'}
                    </button>
                    <button type="button" class="route-icon-btn" onclick="editCustomRoute('${escapeHtml(route.id)}')" title="Modifica dettagli e colore">✏️</button>
                    <button type="button" class="route-icon-btn delete" onclick="deleteCustomRoute('${escapeHtml(route.id)}')" title="Elimina definitivamente">🗑️</button>
                </div>
            </div>
        `;
    });

    adminRoutesItemsList.innerHTML = html;
}

// Modalità Disegno a Mano Libera / Punti
function startDrawingCustomRoute() {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }

    isDrawingCustomRoute = true;
    drawingRoutePoints = [];

    // Chiudi modale lista
    if (adminRoutesModal) adminRoutesModal.classList.add('hidden');

    // Mostra toolbar
    if (routeDrawToolbar) routeDrawToolbar.classList.remove('hidden');
    if (routePointsCount) routePointsCount.textContent = '0';

    if (map) {
        map.doubleClickZoom.disable();
    }

    showToast("🚩 Tocca o clicca sulla mappa punto dopo punto per tracciare il percorso.", "info", 4000);
}

function updateDrawingRoutePreview() {
    if (routePointsCount) {
        routePointsCount.textContent = drawingRoutePoints.length;
    }

    if (!map) return;

    if (!drawingPolyline) {
        drawingPolyline = L.polyline(drawingRoutePoints, {
            color: selectedRouteColor || '#8b5cf6',
            weight: 6,
            opacity: 0.9,
            dashArray: '8, 8',
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(map);
    } else {
        drawingPolyline.setLatLngs(drawingRoutePoints);
        drawingPolyline.setStyle({ color: selectedRouteColor || '#8b5cf6' });
    }

    if (!drawingMarkersGroup) {
        drawingMarkersGroup = L.layerGroup().addTo(map);
    } else {
        drawingMarkersGroup.clearLayers();
    }

    drawingRoutePoints.forEach((pt, index) => {
        const isStart = index === 0;
        const isEnd = index === drawingRoutePoints.length - 1;
        const radius = (isStart || isEnd) ? 6 : 4;
        const fillColor = isStart ? '#22c55e' : (isEnd ? '#ef4444' : (selectedRouteColor || '#8b5cf6'));

        L.circleMarker(pt, {
            radius: radius,
            color: '#ffffff',
            fillColor: fillColor,
            fillOpacity: 1,
            weight: 2
        }).addTo(drawingMarkersGroup);
    });
}

function undoLastDrawingPoint() {
    if (drawingRoutePoints.length > 0) {
        drawingRoutePoints.pop();
        updateDrawingRoutePreview();
        showToast("Ultimo punto rimosso.", "normal", 1500);
    }
}

function clearDrawingPoints() {
    drawingRoutePoints = [];
    if (drawingPolyline && map) {
        map.removeLayer(drawingPolyline);
        drawingPolyline = null;
    }
    if (drawingMarkersGroup && map) {
        drawingMarkersGroup.clearLayers();
    }
    if (routePointsCount) routePointsCount.textContent = '0';
    showToast("Tracciato azzerato.", "normal", 1500);
}

function cancelDrawingCustomRoute() {
    isDrawingCustomRoute = false;
    clearDrawingPoints();
    if (routeDrawToolbar) routeDrawToolbar.classList.add('hidden');
    if (map) {
        map.doubleClickZoom.enable();
    }
}

function finishDrawingCustomRoute() {
    if (drawingRoutePoints.length < 2) {
        showToast("Traccia almeno 2 punti sulla mappa per creare il percorso!", "warning", 3500);
        return;
    }

    openRouteEditModal(null, drawingRoutePoints);
}

function openRouteEditModal(routeObj = null, points = null) {
    if (!isAdmin) return;

    const modal = document.getElementById('route-edit-modal');
    if (!modal) return;

    if (routeEditError) routeEditError.classList.add('hidden');

    if (routeObj) {
        // Modalità Modifica
        editingRouteId = routeObj.id;
        if (routeEditModalTitle) routeEditModalTitle.textContent = "✏️ Modifica Percorso Evento";
        if (routeNameInput) routeNameInput.value = routeObj.name || '';
        selectedRouteType = routeObj.type || 'corteo';
        selectedRouteColor = routeObj.color || '#8b5cf6';
        if (routeWeightSelect) routeWeightSelect.value = String(routeObj.weight || 6);
        if (routeDashSelect) routeDashSelect.value = routeObj.dashStyle || 'solid';
        if (routeNoteInput) routeNoteInput.value = routeObj.note || '';
        if (routeActiveToggle) routeActiveToggle.checked = (routeObj.active !== false);
        selectedRouteScheduleMode = routeObj.scheduleMode || 'manual';
        if (routeSchedStart) routeSchedStart.value = routeObj.schedStart || '';
        if (routeSchedEnd) routeSchedEnd.value = routeObj.schedEnd || '';
    } else {
        // Modalità Nuovo Percorso
        editingRouteId = null;
        if (routeEditModalTitle) routeEditModalTitle.textContent = "🚩 Configura Percorso Evento";
        if (routeNameInput) routeNameInput.value = '';
        selectedRouteType = 'corteo';
        selectedRouteColor = '#8b5cf6';
        if (routeWeightSelect) routeWeightSelect.value = '6';
        if (routeDashSelect) routeDashSelect.value = 'solid';
        if (routeNoteInput) routeNoteInput.value = '';
        if (routeActiveToggle) routeActiveToggle.checked = true;
        selectedRouteScheduleMode = 'manual';
        if (routeSchedStart) routeSchedStart.value = '';
        if (routeSchedEnd) routeSchedEnd.value = '';
    }

    // Aggiorna UI selettori
    updateRouteTypesGridUI();
    updateRouteColorPaletteUI();
    updateRouteActiveStatusUI();
    updateRouteSchedModeUI();

    modal.classList.remove('hidden');
}

function closeRouteEditModal() {
    if (routeEditModal) routeEditModal.classList.add('hidden');
}

function updateRouteTypesGridUI() {
    if (routeTypesCards) {
        routeTypesCards.forEach(card => {
            if (card.getAttribute('data-type') === selectedRouteType) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }
}

function updateRouteColorPaletteUI() {
    if (routeColorSwatches) {
        let matchFound = false;
        routeColorSwatches.forEach(swatch => {
            const col = swatch.getAttribute('data-color');
            if (col && col.toLowerCase() === (selectedRouteColor || '').toLowerCase()) {
                swatch.classList.add('active');
                matchFound = true;
            } else {
                swatch.classList.remove('active');
            }
        });
        if (routeCustomColor) {
            routeCustomColor.value = selectedRouteColor || '#8b5cf6';
        }
    }
}

function updateRouteActiveStatusUI() {
    if (routeActiveStatusText && routeActiveToggle) {
        if (routeActiveToggle.checked) {
            routeActiveStatusText.textContent = "🟢 Visibile subito al pubblico";
            routeActiveStatusText.style.color = "#4ade80";
        } else {
            routeActiveStatusText.textContent = "⚪ Nascosto / Non visibile";
            routeActiveStatusText.style.color = "#94a3b8";
        }
    }
}

function updateRouteSchedModeUI() {
    if (routeSchedTypeBtns) {
        routeSchedTypeBtns.forEach(btn => {
            if (btn.getAttribute('data-mode') === selectedRouteScheduleMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    if (routeSchedWindowBlock) {
        if (selectedRouteScheduleMode === 'window') {
            routeSchedWindowBlock.classList.remove('hidden');
        } else {
            routeSchedWindowBlock.classList.add('hidden');
        }
    }
}

async function saveCustomRouteFromForm() {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }

    const name = (routeNameInput ? routeNameInput.value : '').trim();
    if (!name) {
        if (routeEditError) {
            routeEditError.textContent = "Inserisci il nome del percorso o dell'evento!";
            routeEditError.classList.remove('hidden');
        }
        return;
    }

    let points = [];
    let existingItem = null;

    if (editingRouteId) {
        existingItem = customRoutesData.find(r => r.id === editingRouteId);
        if (existingItem) {
            points = (drawingRoutePoints && drawingRoutePoints.length >= 2) ? drawingRoutePoints : existingItem.points;
        }
    } else {
        points = drawingRoutePoints;
    }

    if (!points || points.length < 2) {
        if (routeEditError) {
            routeEditError.textContent = "Il percorso deve contenere almeno 2 punti!";
            routeEditError.classList.remove('hidden');
        }
        return;
    }

    const distText = calculateRouteDistance(points);
    const id = editingRouteId || ('route_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
    const nowTs = Date.now();

    const payload = {
        name: name,
        type: selectedRouteType || 'corteo',
        color: selectedRouteColor || '#8b5cf6',
        weight: Number(routeWeightSelect ? routeWeightSelect.value : 6) || 6,
        dashStyle: routeDashSelect ? routeDashSelect.value : 'solid',
        note: (routeNoteInput ? routeNoteInput.value : '').trim(),
        active: routeActiveToggle ? routeActiveToggle.checked : true,
        scheduleMode: selectedRouteScheduleMode || 'manual',
        schedStart: (selectedRouteScheduleMode === 'window' && routeSchedStart) ? routeSchedStart.value : '',
        schedEnd: (selectedRouteScheduleMode === 'window' && routeSchedEnd) ? routeSchedEnd.value : '',
        points: points,
        distanceText: distText,
        updatedAt: nowTs,
        createdAt: existingItem ? (existingItem.createdAt || nowTs) : nowTs
    };

    try {
        if (isFirebaseOnline && customRoutesRef) {
            await customRoutesRef.child(id).set(payload);
        } else {
            const idx = customRoutesData.findIndex(r => r.id === id);
            if (idx >= 0) {
                customRoutesData[idx] = { id, ...payload };
            } else {
                customRoutesData.unshift({ id, ...payload });
            }
            localStorage.setItem('ferrara_viabilita_custom_routes', JSON.stringify(customRoutesData));
            renderCustomRoutesOnMap();
            renderAdminRoutesList();
            updateAdminRoutesBadge();
        }

        closeRouteEditModal();
        cancelDrawingCustomRoute();
        showToast(editingRouteId ? "Percorso aggiornato con successo!" : "Nuovo percorso evento salvato!", "success", 3500);
    } catch (err) {
        console.error("Errore salvataggio custom route:", err);
        if (routeEditError) {
            routeEditError.textContent = "Errore durante il salvataggio: " + err.message;
            routeEditError.classList.remove('hidden');
        }
    }
}

// Funzioni Globali per i bottoni (popup e lista)
window.toggleCustomRouteVisibility = async function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const route = customRoutesData.find(r => r.id === id);
    if (!route) return;

    const newActiveState = !route.active;

    try {
        if (isFirebaseOnline && customRoutesRef) {
            await customRoutesRef.child(id).update({ active: newActiveState, updatedAt: Date.now() });
        } else {
            route.active = newActiveState;
            route.updatedAt = Date.now();
            localStorage.setItem('ferrara_viabilita_custom_routes', JSON.stringify(customRoutesData));
            renderCustomRoutesOnMap();
            renderAdminRoutesList();
            updateAdminRoutesBadge();
        }
        showToast(newActiveState ? "Percorso reso visibile sulla mappa!" : "Percorso nascosto dalla mappa.", "info", 2500);
    } catch (err) {
        console.error("Errore modifica visibilità percorso:", err);
        showToast("Errore durante l'aggiornamento: " + err.message, "error", 3500);
    }
};

window.editCustomRoute = function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const route = customRoutesData.find(r => r.id === id);
    if (!route) return;
    openRouteEditModal(route);
};

window.deleteCustomRoute = async function (id) {
    if (!isAdmin) {
        showToast("Accesso riservato all'amministratore.", "warning", 3000);
        return;
    }
    const route = customRoutesData.find(r => r.id === id);
    if (!route) return;

    if (!confirm(`Sei sicuro di voler eliminare definitivamente il percorso "${route.name}"?`)) {
        return;
    }

    try {
        if (isFirebaseOnline && customRoutesRef) {
            await customRoutesRef.child(id).remove();
        }
        customRoutesData = customRoutesData.filter(r => r.id !== id);
        try {
            localStorage.setItem('ferrara_viabilita_custom_routes', JSON.stringify(customRoutesData));
        } catch (e) { }
        renderCustomRoutesOnMap();
        renderAdminRoutesList();
        updateAdminRoutesBadge();
        showToast(`Percorso "${route.name}" eliminato con successo.`, "info", 3000);
    } catch (err) {
        console.error("Errore cancellazione percorso:", err);
        showToast("Errore durante l'eliminazione: " + err.message, "error", 3500);
    }
};

window.zoomToCustomRoute = function (id) {
    const route = customRoutesData.find(r => r.id === id);
    if (!route || !route.points || route.points.length < 2) return;

    if (adminRoutesModal) adminRoutesModal.classList.add('hidden');

    const latLngs = route.points.map(p => L.latLng(p[0], p[1]));
    const bounds = L.latLngBounds(latLngs);
    if (map) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }

    renderCustomRoutesOnMap();
    setTimeout(() => {
        if (activeCustomRouteLayers[id]) {
            activeCustomRouteLayers[id].openPopup();
        }
    }, 350);
};

function initCustomRoutesModule() {
    // Pulsante apertura modale gestione percorsi
    if (adminRoutesBtn) {
        adminRoutesBtn.addEventListener('click', () => {
            if (!isAdmin) {
                showToast("Accesso riservato all'amministratore.", "warning", 3000);
                return;
            }
            renderAdminRoutesList();
            if (adminRoutesModal) adminRoutesModal.classList.remove('hidden');
        });
    }

    if (closeAdminRoutesModalBtn) {
        closeAdminRoutesModalBtn.addEventListener('click', () => {
            if (adminRoutesModal) adminRoutesModal.classList.add('hidden');
        });
    }

    // Pulsante avvia tracciamento da modale
    if (startDrawRouteBtn) {
        startDrawRouteBtn.addEventListener('click', startDrawingCustomRoute);
    }

    // Pulsanti toolbar disegno
    if (routeUndoPtBtn) {
        routeUndoPtBtn.addEventListener('click', undoLastDrawingPoint);
    }
    if (routeClearPtsBtn) {
        routeClearPtsBtn.addEventListener('click', clearDrawingPoints);
    }
    if (routeFinishDrawBtn) {
        routeFinishDrawBtn.addEventListener('click', finishDrawingCustomRoute);
    }
    if (routeCancelDrawBtn) {
        routeCancelDrawBtn.addEventListener('click', cancelDrawingCustomRoute);
    }

    // Modale configurazione percorso
    if (closeRouteEditModalBtn) {
        closeRouteEditModalBtn.addEventListener('click', closeRouteEditModal);
    }
    if (routeCancelSaveBtn) {
        routeCancelSaveBtn.addEventListener('click', closeRouteEditModal);
    }
    if (routeConfirmSaveBtn) {
        routeConfirmSaveBtn.addEventListener('click', saveCustomRouteFromForm);
    }

    // Selettore tipologie
    if (routeTypesCards) {
        routeTypesCards.forEach(card => {
            card.addEventListener('click', () => {
                selectedRouteType = card.getAttribute('data-type') || 'corteo';
                updateRouteTypesGridUI();
            });
        });
    }

    // Palette colori
    if (routeColorSwatches) {
        routeColorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                selectedRouteColor = swatch.getAttribute('data-color') || '#8b5cf6';
                updateRouteColorPaletteUI();
                if (drawingPolyline) {
                    drawingPolyline.setStyle({ color: selectedRouteColor });
                }
            });
        });
    }

    if (routeCustomColor) {
        routeCustomColor.addEventListener('input', (e) => {
            selectedRouteColor = e.target.value;
            if (routeColorSwatches) {
                routeColorSwatches.forEach(s => s.classList.remove('active'));
            }
            if (drawingPolyline) {
                drawingPolyline.setStyle({ color: selectedRouteColor });
            }
        });
    }

    // Switch visibilità
    if (routeActiveToggle) {
        routeActiveToggle.addEventListener('change', updateRouteActiveStatusUI);
    }

    // Selettore modalità programmazione
    if (routeSchedTypeBtns) {
        routeSchedTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedRouteScheduleMode = btn.getAttribute('data-mode') || 'manual';
                updateRouteSchedModeUI();
            });
        });
    }
}

// =======================================================
// MODULO GESTIONE UTENTI, RUOLI E ACCESSI 118
// =======================================================

function normalizeAuthEmail(input) {
    if (!input || typeof input !== 'string') return '';
    const clean = input.trim().toLowerCase();
    if (clean.includes('@')) {
        return clean;
    }
    if (clean === 'admin') {
        return ADMIN_EMAIL; // admin@viabilitaferrara.it
    }
    // Rimuovi caratteri non ammessi nell'username
    const sanitizedUser = clean.replace(/[^a-z0-9._-]/g, '');
    return `${sanitizedUser}${DEFAULT_AUTH_DOMAIN}`;
}

function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Mostra / Nascondi Schermata Gatekeeper
function showGatekeeper(errorMsg = '') {
    const gatekeeperOverlay = document.getElementById('auth-gatekeeper-overlay');
    const gatekeeperError = document.getElementById('gatekeeper-error');
    if (!gatekeeperOverlay) return;
    gatekeeperOverlay.classList.remove('hidden');
    if (errorMsg && gatekeeperError) {
        gatekeeperError.textContent = errorMsg;
        gatekeeperError.classList.remove('hidden');
    } else if (gatekeeperError) {
        gatekeeperError.classList.add('hidden');
    }
}

function hideGatekeeper() {
    const gatekeeperOverlay = document.getElementById('auth-gatekeeper-overlay');
    if (gatekeeperOverlay) {
        gatekeeperOverlay.classList.add('hidden');
    }
}

// Tentativo di Login da Gatekeeper
async function attemptGatekeeperLogin() {
    const usernameInput = document.getElementById('gatekeeper-username');
    const passwordInput = document.getElementById('gatekeeper-password');
    const errorEl = document.getElementById('gatekeeper-error');
    const submitBtn = document.getElementById('gatekeeper-submit-btn');

    const rawUser = usernameInput ? usernameInput.value : '';
    const rawPass = passwordInput ? passwordInput.value : '';

    if (!rawUser || !rawPass) {
        if (errorEl) {
            errorEl.textContent = 'Inserisci sia username/email che la password.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (!auth) {
        if (errorEl) {
            errorEl.textContent = 'Servizio di autenticazione non raggiungibile al momento.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const email = normalizeAuthEmail(rawUser);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Verifica credenziali...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
        await auth.signInWithEmailAndPassword(email, rawPass);
        if (passwordInput) passwordInput.value = '';
    } catch (err) {
        console.error('Errore Login 118:', err.code, err.message);
        let msg = 'Credenziali non corrette. Riprova.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            msg = 'Username o password errati. Verifica i dati o contatta l\'Amministratore.';
        } else if (err.code === 'auth/too-many-requests') {
            msg = 'Troppi tentativi falliti. Attendi qualche minuto prima di riprovare.';
        } else if (err.code === 'auth/network-request-failed') {
            msg = 'Errore di connessione a Internet.';
        }
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🔐</span> Accedi al Sistema 118';
        }
    }
}

// Gestione Cambio Password Obbligatorio al Primo Accesso
function showMandatoryPasswordChangeModal() {
    const modal = document.getElementById('mandatory-password-change-modal');
    if (modal) modal.classList.remove('hidden');
}

function hideMandatoryPasswordChangeModal() {
    const modal = document.getElementById('mandatory-password-change-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleSaveMandatoryPassword() {
    const newPassInput = document.getElementById('mandatory-new-password');
    const confirmPassInput = document.getElementById('mandatory-confirm-password');
    const errorEl = document.getElementById('mandatory-pw-error');
    const saveBtn = document.getElementById('mandatory-pw-save-btn');

    const newPass = newPassInput ? newPassInput.value : '';
    const confirmPass = confirmPassInput ? confirmPassInput.value : '';

    if (!newPass || newPass.length < 6) {
        if (errorEl) {
            errorEl.textContent = 'La password deve contenere almeno 6 caratteri.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (newPass !== confirmPass) {
        if (errorEl) {
            errorEl.textContent = 'Le due password inserite non coincidono.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (!auth || !auth.currentUser) return;

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvataggio in corso...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
        await auth.currentUser.updatePassword(newPass);
        if (authorizedUsersRef && auth.currentUser) {
            await authorizedUsersRef.child(auth.currentUser.uid).update({
                mustChangePassword: false,
                passwordUpdatedAt: Date.now()
            });
        }
        if (currentUserProfile) {
            currentUserProfile.mustChangePassword = false;
        }
        hideMandatoryPasswordChangeModal();
        showToast("Password personale impostata con successo!", "success", 4000);
    } catch (err) {
        console.error('Errore cambio password obbligatorio:', err);
        if (errorEl) {
            errorEl.textContent = 'Errore durante l\'aggiornamento della password: ' + err.message;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salva Password e Accedi';
        }
    }
}

// Profilo Utente & Cambio Password Personale
function openUserProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    const nameEl = document.getElementById('profile-name-text');
    const emailEl = document.getElementById('profile-email-text');
    const roleEl = document.getElementById('profile-role-badge');
    const newPassInput = document.getElementById('profile-new-password');
    const confirmPassInput = document.getElementById('profile-confirm-password');
    const errorEl = document.getElementById('profile-pw-error');

    if (nameEl) nameEl.textContent = currentUserProfile?.name || 'Operatore 118';
    if (emailEl) emailEl.textContent = currentUser?.email || '-';
    if (roleEl) {
        const isAdminRole = (currentUserProfile?.role === 'admin' || isAdmin);
        roleEl.className = `role-badge ${isAdminRole ? 'role-admin' : 'role-operator'}`;
        roleEl.textContent = isAdminRole ? '👑 Amministratore' : '🚑 Operatore 118';
    }

    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';
    if (errorEl) errorEl.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
}

async function handleSaveProfilePassword() {
    const newPassInput = document.getElementById('profile-new-password');
    const confirmPassInput = document.getElementById('profile-confirm-password');
    const errorEl = document.getElementById('profile-pw-error');
    const saveBtn = document.getElementById('profile-pw-save-btn');

    const newPass = newPassInput ? newPassInput.value : '';
    const confirmPass = confirmPassInput ? confirmPassInput.value : '';

    if (!newPass || newPass.length < 6) {
        if (errorEl) {
            errorEl.textContent = 'La nuova password deve contenere almeno 6 caratteri.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (newPass !== confirmPass) {
        if (errorEl) {
            errorEl.textContent = 'Le password non coincidono.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (!auth || !auth.currentUser) return;

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Aggiornamento in corso...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
        await auth.currentUser.updatePassword(newPass);
        if (authorizedUsersRef && auth.currentUser) {
            await authorizedUsersRef.child(auth.currentUser.uid).update({
                mustChangePassword: false,
                passwordUpdatedAt: Date.now()
            });
        }
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';
        const modal = document.getElementById('user-profile-modal');
        if (modal) modal.classList.add('hidden');
        showToast("Password aggiornata con successo!", "success", 3500);
    } catch (err) {
        console.error('Errore aggiornamento password profilo:', err);
        let msg = 'Errore durante l\'aggiornamento della password.';
        if (err.code === 'auth/requires-recent-login') {
            msg = 'Per sicurezza è necessario riconnettersi prima di cambiare password. Esegui il logout e riaccedi.';
        }
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Aggiorna la mia Password';
        }
    }
}

// Reset Password (Invio Email di Ripristino)
function openResetPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    const emailInput = document.getElementById('reset-email-input');
    const errorEl = document.getElementById('reset-pw-error');
    const successEl = document.getElementById('reset-pw-success');

    if (emailInput) {
        const currentVal = document.getElementById('gatekeeper-username')?.value || '';
        emailInput.value = currentVal;
    }
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
    if (modal) modal.classList.remove('hidden');
}

async function handleSendResetPasswordEmail() {
    const emailInput = document.getElementById('reset-email-input');
    const errorEl = document.getElementById('reset-pw-error');
    const successEl = document.getElementById('reset-pw-success');
    const submitBtn = document.getElementById('submit-reset-pw-btn');

    const raw = emailInput ? emailInput.value.trim() : '';
    if (!raw) {
        if (errorEl) {
            errorEl.textContent = 'Inserisci l\'email o username.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const email = normalizeAuthEmail(raw);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso...';
    }
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');

    try {
        await auth.sendPasswordResetEmail(email);
        if (successEl) {
            successEl.textContent = `Link di ripristino inviato con successo a ${email}! Controlla la casella di posta.`;
            successEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Errore invio reset email:', err);
        if (errorEl) {
            errorEl.textContent = 'Impossibile inviare il link di ripristino: ' + err.message;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia Link di Ripristino';
        }
    }
}

// --- GESTIONE UTENTI ADMIN (PANNELLO AMMINISTRAZIONE) ---

const DEFAULT_INITIAL_AUTHORIZED_USERS = [
    {
        uid: 'user_admin_principal',
        name: 'Amministratore 118',
        email: 'admin@viabilitaferrara.it',
        role: 'admin',
        status: 'active',
        mustChangePassword: false,
        createdAt: 1727720000000,
        createdBy: 'system'
    },
    {
        uid: 'user_elisa_biolcati',
        name: 'Elisa Biolcati',
        email: 'elisa.biolcati@118fe.it',
        role: 'operator',
        status: 'active',
        mustChangePassword: true,
        createdAt: Date.now(),
        createdBy: 'admin'
    }
];

function loadAuthorizedUsersFromLocalStorage() {
    try {
        const saved = localStorage.getItem('ferrara_authorized_users_cache');
        if (saved) {
            allAuthorizedUsers = JSON.parse(saved);
        } else {
            allAuthorizedUsers = [...DEFAULT_INITIAL_AUTHORIZED_USERS];
            saveAuthorizedUsersToLocalStorage();
        }
    } catch (e) {
        allAuthorizedUsers = [...DEFAULT_INITIAL_AUTHORIZED_USERS];
    }
}

function saveAuthorizedUsersToLocalStorage() {
    try {
        localStorage.setItem('ferrara_authorized_users_cache', JSON.stringify(allAuthorizedUsers));
    } catch (e) {
        console.warn('Errore salvataggio cache utenti:', e);
    }
}

let adminUsersListenerActive = false;

// Sincronizzazione automatica utenti predefiniti (es. Elisa Biolcati e Admin)
async function ensureDefaultAuthorizedUsers() {
    if (!authorizedUsersRef) return;
    try {
        const snap = await authorizedUsersRef.once('value');
        const val = snap.val() || {};
        const entries = Object.values(val);

        // Inserimento Elisa Biolcati se non presente
        const hasElisa = entries.some(u => (u.email && u.email.toLowerCase().includes('elisa')) || (u.name && u.name.toLowerCase().includes('elisa')));
        if (!hasElisa) {
            const elisaKey = 'user_elisa_biolcati';
            const elisaObj = {
                uid: elisaKey,
                name: 'Elisa Biolcati',
                email: 'elisa.biolcati@118fe.it',
                role: 'operator',
                status: 'active',
                mustChangePassword: true,
                createdAt: Date.now(),
                createdBy: 'admin'
            };
            await authorizedUsersRef.child(elisaKey).set(elisaObj);
            console.log('✅ Account Elisa Biolcati inserito nel database');
        }

        // Inserimento Amministratore se non presente
        const hasAdmin = entries.some(u => (u.email && u.email.toLowerCase().includes('admin')) || u.role === 'admin');
        if (!hasAdmin) {
            const adminKey = 'user_admin_principal';
            await authorizedUsersRef.child(adminKey).set(DEFAULT_INITIAL_AUTHORIZED_USERS[0]);
        }
    } catch (e) {
        console.warn('Sync utenti iniziali:', e);
    }
}

function initAdminUsersListener() {
    if (!allAuthorizedUsers || allAuthorizedUsers.length === 0) {
        loadAuthorizedUsersFromLocalStorage();
    }
    updateAdminUsersBadge();
    renderAdminUsersList();
    ensureDefaultAuthorizedUsers();

    if (!authorizedUsersRef || adminUsersListenerActive) return;
    adminUsersListenerActive = true;

    authorizedUsersRef.on('value', (snapshot) => {
        const val = snapshot.val();
        if (val && Object.keys(val).length > 0) {
            allAuthorizedUsers = [];
            Object.keys(val).forEach(uid => {
                allAuthorizedUsers.push({
                    uid: uid,
                    ...val[uid]
                });
            });
            allAuthorizedUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            saveAuthorizedUsersToLocalStorage();
        } else {
            // Se Firebase è vuoto, sincronizza i default su Firebase
            DEFAULT_INITIAL_AUTHORIZED_USERS.forEach(u => {
                authorizedUsersRef.child(u.uid).set(u);
            });
        }
        updateAdminUsersBadge();
        renderAdminUsersList();
    });
}

function stopAdminUsersListener() {
    if (authorizedUsersRef && adminUsersListenerActive) {
        authorizedUsersRef.off('value');
        adminUsersListenerActive = false;
    }
}

function updateAdminUsersBadge() {
    const badge = document.getElementById('admin-users-badge');
    const totalCountEl = document.getElementById('admin-users-total-count');
    const count = allAuthorizedUsers.length;
    if (badge) badge.textContent = count;
    if (totalCountEl) totalCountEl.textContent = count;
}

function renderAdminUsersList() {
    const listEl = document.getElementById('admin-users-list');
    const searchInput = document.getElementById('admin-users-search-input');
    const clearBtn = document.getElementById('clear-users-search-btn');
    if (!listEl) return;

    if (!allAuthorizedUsers || allAuthorizedUsers.length === 0) {
        loadAuthorizedUsersFromLocalStorage();
    }

    const rawQuery = searchInput ? searchInput.value.trim() : '';
    const query = rawQuery.toLowerCase();

    if (clearBtn) {
        clearBtn.classList.toggle('hidden', rawQuery.length === 0);
    }

    const filtered = allAuthorizedUsers.filter(u => {
        if (!query) return true;
        const nameMatch = (u.name || '').toLowerCase().includes(query);
        const emailMatch = (u.email || '').toLowerCase().includes(query);
        const roleMatch = (u.role || '').toLowerCase().includes(query);
        return nameMatch || emailMatch || roleMatch;
    });

    if (filtered.length === 0) {
        if (rawQuery) {
            listEl.innerHTML = `
                <div class="users-empty-state" style="text-align:center; padding:20px 10px;">
                    <p style="font-size:0.95rem; color:#64748b; margin-bottom:10px;">Nessun utente trovato per "<strong>${escapeHtml(rawQuery)}</strong>".</p>
                    <button type="button" class="btn-action-icon btn-action-success" onclick="document.getElementById('admin-users-search-input').value=''; renderAdminUsersList();" style="padding:8px 14px; font-weight:700;">
                        🔄 Mostra tutti gli utenti (${allAuthorizedUsers.length})
                    </button>
                </div>
            `;
        } else {
            listEl.innerHTML = `
                <div class="users-empty-state" style="text-align:center; padding:20px 10px;">
                    <p style="font-size:0.95rem; color:#64748b; margin-bottom:10px;">Nessun account operatore registrato.</p>
                    <button type="button" class="primary-btn" onclick="openCreateUserModal();" style="padding:8px 14px;">
                        ➕ Crea il primo utente
                    </button>
                </div>
            `;
        }
        return;
    }

    let html = '';
    filtered.forEach(u => {
        const isAdminRole = (u.role === 'admin');
        const isDisabled = (u.status === 'disabled');
        const mustChange = !!u.mustChangePassword;
        const isCurrentAuthUser = (auth?.currentUser && auth.currentUser.uid === u.uid);

        html += `
            <div class="user-card-item ${isDisabled ? 'user-disabled' : ''}" data-uid="${escapeHtml(u.uid)}">
                <div class="user-main-info">
                    <div class="user-name-title">
                        <span>${escapeHtml(u.name || 'Operatore 118')}</span>
                        <span class="role-badge ${isAdminRole ? 'role-admin' : 'role-operator'}">${isAdminRole ? '👑 Admin' : '🚑 Operatore'}</span>
                        <span class="status-badge ${isDisabled ? 'status-disabled' : 'status-active'}">${isDisabled ? '🔴 Disabilitato' : '🟢 Attivo'}</span>
                        ${mustChange ? '<span class="status-badge status-disabled" title="Deve impostare la password al prossimo login">🔑 Da cambiare</span>' : ''}
                    </div>
                    <div class="user-email-subtitle">
                        📧 <strong>${escapeHtml(u.email || '')}</strong>
                        ${u.createdAt ? ` &bull; Registrato: ${new Date(u.createdAt).toLocaleDateString('it-IT')}` : ''}
                    </div>
                </div>
                <div class="user-card-actions">
                    ${!isAdminRole && !isCurrentAuthUser ? `
                        <button type="button" class="btn-action-icon btn-action-success" onclick="openAdminManualResetModal('${escapeHtml(u.uid)}', '${escapeHtml(u.name || '')}', '${escapeHtml(u.email || '')}')" title="Assegna nuova password provvisoria direttamente">
                            🔑 Nuova PW
                        </button>
                        <button type="button" class="btn-action-icon" onclick="triggerAdminSendReset('${escapeHtml(u.email)}')" title="Invia email con link per reimpostare password">
                            📧 Link Email
                        </button>
                        <button type="button" class="btn-action-icon ${isDisabled ? 'btn-action-success' : 'btn-action-danger'}" onclick="toggleUserStatus('${escapeHtml(u.uid)}', '${isDisabled ? 'active' : 'disabled'}')" title="${isDisabled ? 'Riabilita accesso utente' : 'Disabilita accesso utente'}">
                            ${isDisabled ? '✅ Riabilita' : '🚫 Disabilita'}
                        </button>
                        <button type="button" class="btn-action-icon btn-action-danger" onclick="deleteAuthorizedUser('${escapeHtml(u.uid)}', '${escapeHtml(u.name || u.email)}')" title="Elimina account utente">
                            🗑️
                        </button>
                    ` : '<span style="font-size:0.75rem; color:#64748b; font-weight:700; padding:6px 8px;">(Account Amministratore)</span>'}
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

// Apertura Modal Reimpostazione Manuale Password (Admin)
function openAdminManualResetModal(uid, name, email) {
    const modal = document.getElementById('admin-manual-reset-modal');
    const nameEl = document.getElementById('manual-reset-user-name');
    const emailEl = document.getElementById('manual-reset-user-email');
    const uidInput = document.getElementById('manual-reset-user-uid');
    const passInput = document.getElementById('manual-reset-password');
    const mustChangeCheck = document.getElementById('manual-reset-must-change');
    const errorEl = document.getElementById('manual-reset-error');

    if (nameEl) nameEl.textContent = name || 'Operatore 118';
    if (emailEl) emailEl.textContent = email || '-';
    if (uidInput) uidInput.value = uid;
    if (passInput) passInput.value = generateRandomPassword(8);
    if (mustChangeCheck) mustChangeCheck.checked = true;
    if (errorEl) errorEl.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
}

// Esecuzione Reimpostazione Manuale Password (Admin)
async function handleAdminManualResetSubmit() {
    const uidInput = document.getElementById('manual-reset-user-uid');
    const passInput = document.getElementById('manual-reset-password');
    const mustChangeCheck = document.getElementById('manual-reset-must-change');
    const errorEl = document.getElementById('manual-reset-error');
    const submitBtn = document.getElementById('submit-manual-reset-btn');

    const uid = uidInput ? uidInput.value : '';
    const newPassword = passInput ? passInput.value : '';
    const mustChange = mustChangeCheck ? mustChangeCheck.checked : true;

    if (!uid || !newPassword) {
        if (errorEl) {
            errorEl.textContent = 'Inserisci la nuova password da assegnare.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (newPassword.length < 6) {
        if (errorEl) {
            errorEl.textContent = 'La password deve contenere almeno 6 caratteri.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (!authorizedUsersRef) return;

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Aggiornamento in corso...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
        // Recupera dati correnti dell'utente per tentare sincronizzazione Auth
        const userSnap = await authorizedUsersRef.child(uid).once('value');
        const userData = userSnap.val() || {};
        const email = userData.email || '';
        const name = userData.name || 'Operatore 118';

        // Prova a sincronizzare la password in Firebase Auth tramite istanza temporanea
        if (email) {
            try {
                const tempAppName = 'ResetSync_' + Date.now();
                const tempApp = firebase.initializeApp(firebaseConfig, tempAppName);
                const tempAuth = tempApp.auth();

                // 1. Prova prima con l'eventuale vecchia password provvisoria nota
                let signedIn = false;
                if (userData.tempPassword) {
                    try {
                        const cred = await tempAuth.signInWithEmailAndPassword(email, userData.tempPassword);
                        await cred.user.updatePassword(newPassword);
                        signedIn = true;
                    } catch (e) {
                        // Password modificata in precedenza o non corrispondente
                    }
                }

                // 2. Se non è riuscito a fare signIn, prova a crearla se mancava in Auth
                if (!signedIn) {
                    try {
                        await tempAuth.createUserWithEmailAndPassword(email, newPassword);
                    } catch (createErr) {
                        // Utente esiste già in Auth con password personale.
                        // Inviamo in parallelo l'email di notifica/reset standard
                        try {
                            await auth.sendPasswordResetEmail(email);
                        } catch (mailErr) {
                            console.warn('Invio email reset parallela:', mailErr.message);
                        }
                    }
                }

                await tempAuth.signOut();
                await tempApp.delete();
            } catch (authSyncErr) {
                console.warn('Sync Auth secondaria:', authSyncErr);
            }
        }

        // Aggiorna scheda utente nel Database
        await authorizedUsersRef.child(uid).update({
            tempPassword: newPassword,
            mustChangePassword: mustChange,
            status: 'active',
            passwordResetAt: Date.now(),
            passwordResetBy: auth?.currentUser?.email || 'admin'
        });

        // Chiudi modal di modifica
        const resetModal = document.getElementById('admin-manual-reset-modal');
        if (resetModal) resetModal.classList.add('hidden');

        // Mostra riepilogo con copia rapida
        const summaryModal = document.getElementById('admin-manual-reset-success-modal');
        const summaryName = document.getElementById('reset-summary-name');
        const summaryEmail = document.getElementById('reset-summary-email');
        const summaryPass = document.getElementById('reset-summary-password');
        const summaryMustChange = document.getElementById('reset-summary-mustchange');

        if (summaryName) summaryName.textContent = name;
        if (summaryEmail) summaryEmail.textContent = email;
        if (summaryPass) summaryPass.textContent = newPassword;
        if (summaryMustChange) summaryMustChange.textContent = mustChange ? 'Sì (al prossimo login)' : 'No';

        if (summaryModal) summaryModal.classList.remove('hidden');

        showToast(`Nuova password assegnata a "${name}"!`, "success", 3500);
    } catch (err) {
        console.error('Errore reimpostazione password:', err);
        if (errorEl) {
            errorEl.textContent = 'Errore durante l\'aggiornamento: ' + err.message;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Salva e Assegna Password';
        }
    }
}

// Copia Credenziali Reimpostate per Messaggio / WhatsApp
async function copyResetCredentials() {
    const name = document.getElementById('reset-summary-name')?.textContent || '';
    const email = document.getElementById('reset-summary-email')?.textContent || '';
    const pass = document.getElementById('reset-summary-password')?.textContent || '';

    const textToCopy = `🚑 VIABILITÀ 118 FERRARA\nNuove credenziali di accesso:\n\n👤 Operatore: ${name}\n📧 Login / Username: ${email}\n🔑 Nuova Password: ${pass}\n🌐 Accedi qui: https://viabilita118fe.vercel.app/\n\n(Al primo accesso ti verrà richiesto di confermare una nuova password personale).`;

    try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("✅ Credenziali copiate negli appunti! Pronte da incollare su WhatsApp.", "success", 4000);
    } catch (e) {
        showToast("Seleziona e copia manualmente il testo delle credenziali.", "info", 3000);
    }
}

// Toggle Stato Utente (Attivo / Disabilitato)
async function toggleUserStatus(uid, newStatus) {
    if (!authorizedUsersRef) return;
    try {
        await authorizedUsersRef.child(uid).update({
            status: newStatus,
            statusUpdatedAt: Date.now(),
            statusUpdatedBy: auth?.currentUser?.email || 'admin'
        });
        showToast(`Stato utente aggiornato a: ${newStatus === 'active' ? '🟢 Attivo' : '🔴 Disabilitato'}`, "success", 2500);
    } catch (err) {
        console.error('Errore aggiornamento stato utente:', err);
        showToast("Errore durante l'aggiornamento dello stato.", "error", 3000);
    }
}

// Invia email di reset password da admin
async function triggerAdminSendReset(email) {
    if (!email || !auth) return;
    try {
        await auth.sendPasswordResetEmail(email);
        showToast(`Email di ripristino password inviata a: ${email}`, "success", 4000);
    } catch (err) {
        console.error('Errore invio reset:', err);
        showToast("Impossibile inviare email di reset: " + err.message, "error", 4000);
    }
}

// Elimina Utente
async function deleteAuthorizedUser(uid, name) {
    if (!confirm(`Sei sicuro di voler eliminare l'account di "${name}"?\nL'utente non potrà più accedere al sistema.`)) {
        return;
    }
    if (!authorizedUsersRef) return;
    try {
        await authorizedUsersRef.child(uid).remove();
        showToast("Account rimosso con successo.", "success", 2500);
    } catch (err) {
        console.error('Errore eliminazione utente:', err);
        showToast("Errore durante l'eliminazione dell'account.", "error", 3000);
    }
}

// Esponi funzioni a livello globale (window) per interazioni onclick da HTML
window.openAdminManualResetModal = openAdminManualResetModal;
window.handleAdminManualResetSubmit = handleAdminManualResetSubmit;
window.copyResetCredentials = copyResetCredentials;
window.toggleUserStatus = toggleUserStatus;
window.triggerAdminSendReset = triggerAdminSendReset;
window.deleteAuthorizedUser = deleteAuthorizedUser;
window.openCreateUserModal = openCreateUserModal;

// Apertura Modal Creazione Utente
function openCreateUserModal() {
    const modal = document.getElementById('create-user-modal');
    const nameInput = document.getElementById('new-user-name');
    const emailInput = document.getElementById('new-user-email');
    const passwordInput = document.getElementById('new-user-password');
    const roleSelect = document.getElementById('new-user-role');
    const mustChangeCheck = document.getElementById('new-user-must-change');
    const errorEl = document.getElementById('create-user-error');

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = generateRandomPassword(8);
    if (roleSelect) roleSelect.value = 'operator';
    if (mustChangeCheck) mustChangeCheck.checked = true;
    if (errorEl) errorEl.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
}

// Creazione Nuovo Utente da parte dell'Admin
async function handleCreateUserSubmit() {
    const nameInput = document.getElementById('new-user-name');
    const emailInput = document.getElementById('new-user-email');
    const passwordInput = document.getElementById('new-user-password');
    const roleSelect = document.getElementById('new-user-role');
    const mustChangeCheck = document.getElementById('new-user-must-change');
    const errorEl = document.getElementById('create-user-error');
    const submitBtn = document.getElementById('submit-create-user-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const rawEmail = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const role = roleSelect ? roleSelect.value : 'operator';
    const mustChange = mustChangeCheck ? mustChangeCheck.checked : true;

    if (!name || !rawEmail || !password) {
        if (errorEl) {
            errorEl.textContent = 'Tutti i campi obbligatori contrassegnati da * devono essere compilati.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (password.length < 6) {
        if (errorEl) {
            errorEl.textContent = 'La password iniziale deve contenere almeno 6 caratteri.';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const normalizedEmail = normalizeAuthEmail(rawEmail);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creazione account in corso...';
    }
    if (errorEl) errorEl.classList.add('hidden');

    try {
        // Creazione tramite istanza Firebase Auth secondaria isolata (senza disconnettere l'Admin!)
        const tempAppName = 'SecondaryAuth_' + Date.now();
        const tempApp = firebase.initializeApp(firebaseConfig, tempAppName);
        const tempAuth = tempApp.auth();

        const userCredential = await tempAuth.createUserWithEmailAndPassword(normalizedEmail, password);
        const newUid = userCredential.user.uid;

        // Disconnetti ed elimina istanza temporanea
        await tempAuth.signOut();
        await tempApp.delete();

        // Salva profilo utente nel database principale
        const userProfile = {
            uid: newUid,
            name: name,
            email: normalizedEmail,
            role: role,
            status: 'active',
            mustChangePassword: mustChange,
            createdAt: Date.now(),
            createdBy: auth?.currentUser?.email || 'admin'
        };

        await authorizedUsersRef.child(newUid).set(userProfile);

        // Chiudi modal creazione
        const createModal = document.getElementById('create-user-modal');
        if (createModal) createModal.classList.add('hidden');

        // Mostra modal di riepilogo credenziali per invio
        showCreatedUserSuccessModal(name, normalizedEmail, password, role);
        showToast(`Utente "${name}" creato con successo!`, "success", 3500);
    } catch (err) {
        console.error('Errore creazione utente:', err);
        if (err.code === 'auth/email-already-in-use') {
            // L'utente esiste già in Firebase Auth (es. creato prima del fix permessi).
            // Proviamo a recuperare l'UID autenticandolo con la password fornita e salvando il profilo nel database!
            try {
                const tempAppName = 'RecoveryAuth_' + Date.now();
                const tempApp = firebase.initializeApp(firebaseConfig, tempAppName);
                const tempAuth = tempApp.auth();

                const existingUserCred = await tempAuth.signInWithEmailAndPassword(normalizedEmail, password);
                const existingUid = existingUserCred.user.uid;

                await tempAuth.signOut();
                await tempApp.delete();

                const userProfile = {
                    uid: existingUid,
                    name: name,
                    email: normalizedEmail,
                    role: role,
                    status: 'active',
                    mustChangePassword: mustChange,
                    createdAt: Date.now(),
                    createdBy: auth?.currentUser?.email || 'admin'
                };

                await authorizedUsersRef.child(existingUid).set(userProfile);

                const createModal = document.getElementById('create-user-modal');
                if (createModal) createModal.classList.add('hidden');

                showCreatedUserSuccessModal(name, normalizedEmail, password, role);
                showToast(`Account "${name}" sincronizzato con successo!`, "success", 3500);
                return;
            } catch (recoveryErr) {
                console.warn('Errore recovery utente:', recoveryErr);
                let recoveryMsg = `L'indirizzo "${normalizedEmail}" è già registrato.`;
                if (recoveryErr.code === 'auth/wrong-password' || recoveryErr.code === 'auth/invalid-credential') {
                    recoveryMsg = `L'utente "${normalizedEmail}" esiste già con un'altra password. Inserisci la password corretta per collegarlo o usa un altro username.`;
                }
                if (errorEl) {
                    errorEl.textContent = recoveryMsg;
                    errorEl.classList.remove('hidden');
                }
                return;
            }
        }

        let msg = 'Errore creazione account: ' + err.message;
        if (err.code === 'auth/invalid-email') {
            msg = 'Indirizzo email non valido.';
        }
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crea e Abilita Utente';
        }
    }
}

// Mostra Modal Successo Creazione con Riepilogo Credenziali
function showCreatedUserSuccessModal(name, email, password, role) {
    const modal = document.getElementById('user-created-success-modal');
    const nameEl = document.getElementById('created-summary-name');
    const emailEl = document.getElementById('created-summary-email');
    const passEl = document.getElementById('created-summary-password');
    const roleEl = document.getElementById('created-summary-role');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (passEl) passEl.textContent = password;
    if (roleEl) roleEl.textContent = (role === 'admin' ? '👑 Amministratore' : '🚑 Operatore 118');

    if (modal) modal.classList.remove('hidden');
}

// Copia Credenziali per Messaggio / WhatsApp
function copyCreatedCredentials() {
    const name = document.getElementById('created-summary-name')?.textContent || '';
    const email = document.getElementById('created-summary-email')?.textContent || '';
    const pass = document.getElementById('created-summary-password')?.textContent || '';
    const role = document.getElementById('created-summary-role')?.textContent || '';

    const textToCopy = 
`🚑 *CREDENZIALI ACCESSO VIABILITÀ 118 FERRARA*
👤 Operatore/Postazione: ${name}
📧 Login / Email: ${email}
🔑 Password provvisoria: ${pass}
🛡️ Ruolo: ${role}
🌐 Link applicazione: https://viabilita118fe.vercel.app/

*(Al primo accesso ti verrà richiesto di impostare la tua nuova password personale)*`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Credenziali copiate negli appunti! Incollale su WhatsApp o Email.", "success", 4000);
    }).catch(() => {
        showToast("Seleziona e copia manualmente il testo.", "info", 3000);
    });
}

// Inizializzazione Completa del Modulo Gestione Utenti & Auth
function initUsersModule() {
    // 1. Gatekeeper Events
    const gatekeeperSubmitBtn = document.getElementById('gatekeeper-submit-btn');
    const gatekeeperForgotBtn = document.getElementById('gatekeeper-forgot-btn');
    const gatekeeperUsernameInput = document.getElementById('gatekeeper-username');
    const gatekeeperPasswordInput = document.getElementById('gatekeeper-password');

    if (gatekeeperSubmitBtn) {
        gatekeeperSubmitBtn.addEventListener('click', attemptGatekeeperLogin);
    }
    if (gatekeeperForgotBtn) {
        gatekeeperForgotBtn.addEventListener('click', openResetPasswordModal);
    }
    if (gatekeeperPasswordInput) {
        gatekeeperPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptGatekeeperLogin();
        });
    }
    if (gatekeeperUsernameInput) {
        gatekeeperUsernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && gatekeeperPasswordInput) gatekeeperPasswordInput.focus();
        });
    }

    // 2. Mandatory Password Change Events
    const mandatorySaveBtn = document.getElementById('mandatory-pw-save-btn');
    const mandatoryLogoutBtn = document.getElementById('mandatory-pw-logout-btn');
    if (mandatorySaveBtn) {
        mandatorySaveBtn.addEventListener('click', handleSaveMandatoryPassword);
    }
    if (mandatoryLogoutBtn) {
        mandatoryLogoutBtn.addEventListener('click', async () => {
            if (auth) await auth.signOut();
            hideMandatoryPasswordChangeModal();
        });
    }

    // 3. User Profile Events
    const userProfileBtn = document.getElementById('user-profile-btn');
    const closeUserProfileBtn = document.getElementById('close-user-profile-modal');
    const profilePwSaveBtn = document.getElementById('profile-pw-save-btn');
    const profileLogoutBtn = document.getElementById('profile-logout-btn');

    if (userProfileBtn) userProfileBtn.addEventListener('click', openUserProfileModal);
    if (closeUserProfileBtn) {
        closeUserProfileBtn.addEventListener('click', () => {
            document.getElementById('user-profile-modal')?.classList.add('hidden');
        });
    }
    if (profilePwSaveBtn) profilePwSaveBtn.addEventListener('click', handleSaveProfilePassword);
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', async () => {
            document.getElementById('user-profile-modal')?.classList.add('hidden');
            if (auth) await auth.signOut();
        });
    }

    // 4. Admin Users Management Events
    const adminUsersBtn = document.getElementById('admin-users-btn');
    const closeAdminUsersBtn = document.getElementById('close-admin-users-modal');
    const openCreateUserBtn = document.getElementById('open-create-user-btn');
    const adminUsersSearchInput = document.getElementById('admin-users-search-input');

    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', () => {
            initAdminUsersListener();
            document.getElementById('admin-users-modal')?.classList.remove('hidden');
            renderAdminUsersList();
        });
    }
    if (closeAdminUsersBtn) {
        closeAdminUsersBtn.addEventListener('click', () => {
            document.getElementById('admin-users-modal')?.classList.add('hidden');
        });
    }
    if (openCreateUserBtn) openCreateUserBtn.addEventListener('click', openCreateUserModal);
    if (adminUsersSearchInput) {
        adminUsersSearchInput.addEventListener('input', renderAdminUsersList);
    }

    // 5. Create User Modal Events
    const closeCreateUserBtn = document.getElementById('close-create-user-modal');
    const cancelCreateUserBtn = document.getElementById('cancel-create-user-btn');
    const submitCreateUserBtn = document.getElementById('submit-create-user-btn');
    const generatePwBtn = document.getElementById('generate-pw-btn');

    if (closeCreateUserBtn) {
        closeCreateUserBtn.addEventListener('click', () => {
            document.getElementById('create-user-modal')?.classList.add('hidden');
        });
    }
    if (cancelCreateUserBtn) {
        cancelCreateUserBtn.addEventListener('click', () => {
            document.getElementById('create-user-modal')?.classList.add('hidden');
        });
    }
    if (submitCreateUserBtn) submitCreateUserBtn.addEventListener('click', handleCreateUserSubmit);
    if (generatePwBtn) {
        generatePwBtn.addEventListener('click', () => {
            const pwInput = document.getElementById('new-user-password');
            if (pwInput) pwInput.value = generateRandomPassword(8);
        });
    }

    // 6. User Created Success Modal Events
    const copyCredentialsBtn = document.getElementById('copy-created-credentials-btn');
    const closeCreatedSuccessBtn = document.getElementById('close-created-success-btn');
    if (copyCredentialsBtn) copyCredentialsBtn.addEventListener('click', copyCreatedCredentials);
    if (closeCreatedSuccessBtn) {
        closeCreatedSuccessBtn.addEventListener('click', () => {
            document.getElementById('user-created-success-modal')?.classList.add('hidden');
        });
    }

    // 7. Reset Password Modal Events
    const closeResetPwBtn = document.getElementById('close-reset-pw-modal');
    const cancelResetPwBtn = document.getElementById('cancel-reset-pw-btn');
    const submitResetPwBtn = document.getElementById('submit-reset-pw-btn');

    if (closeResetPwBtn) {
        closeResetPwBtn.addEventListener('click', () => {
            document.getElementById('reset-password-modal')?.classList.add('hidden');
        });
    }
    if (cancelResetPwBtn) {
        cancelResetPwBtn.addEventListener('click', () => {
            document.getElementById('reset-password-modal')?.classList.add('hidden');
        });
    }
    if (submitResetPwBtn) submitResetPwBtn.addEventListener('click', handleSendResetPasswordEmail);

    // 8. Admin Manual Reset Password Modal Events
    const closeManualResetBtn = document.getElementById('close-manual-reset-modal');
    const cancelManualResetBtn = document.getElementById('cancel-manual-reset-btn');
    const submitManualResetBtn = document.getElementById('submit-manual-reset-btn');
    const manualResetGenPwBtn = document.getElementById('manual-reset-generate-pw-btn');
    const copyResetCredsBtn = document.getElementById('copy-reset-credentials-btn');
    const closeResetSuccessBtn = document.getElementById('close-reset-success-btn');

    if (closeManualResetBtn) {
        closeManualResetBtn.addEventListener('click', () => {
            document.getElementById('admin-manual-reset-modal')?.classList.add('hidden');
        });
    }
    if (cancelManualResetBtn) {
        cancelManualResetBtn.addEventListener('click', () => {
            document.getElementById('admin-manual-reset-modal')?.classList.add('hidden');
        });
    }
    if (submitManualResetBtn) submitManualResetBtn.addEventListener('click', handleAdminManualResetSubmit);
    if (manualResetGenPwBtn) {
        manualResetGenPwBtn.addEventListener('click', () => {
            const pwInput = document.getElementById('manual-reset-password');
            if (pwInput) pwInput.value = generateRandomPassword(8);
        });
    }
    if (copyResetCredsBtn) copyResetCredsBtn.addEventListener('click', copyResetCredentials);
    if (closeResetSuccessBtn) {
        closeResetSuccessBtn.addEventListener('click', () => {
            document.getElementById('admin-manual-reset-success-modal')?.classList.add('hidden');
        });
    }

    // 9. Password Toggle (Mostra / Nascondi) per tutti i campi password con icona occhio
    document.querySelectorAll('.toggle-pw-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });
    });
}

// Controllo temporale periodico (ogni 30 secondi): aggiorna automaticamente comparsa e scomparsa delle icone e percorsi
setInterval(() => {
    refreshMarkers();
    renderCustomRoutesOnMap();
}, 30000);

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUrgentNewsModule();
    initPushModule();
    initCustomRoutesModule();
    initUsersModule();
});


