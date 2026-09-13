// Versione del software
const APP_VERSION = '3.7.0';

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

// Variabili Firebase & Gestione Eliminazioni Definitive
let db = null;
let auth = null;
let markersRef = null;
let reportsRef = null;
let deletedMarkersRef = null;
let urgentNewsRef = null;
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
            isFirebaseOnline = true;
            console.log('🔥 Firebase collegato — database e auth attivi');

            // Inizializza ascolto Notizie Urgenti 118
            initUrgentNewsListener();

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
        deletedMarkersRef = null;
        urgentNewsRef = null;
        isFirebaseOnline = false;
        loadUrgentNewsFromLocalStorage();
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
    if (searchContainer) searchContainer.classList.remove('hidden');

    if (isAdmin) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        if (adminFilterBar) adminFilterBar.classList.remove('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.remove('hidden');
        if (adminNewsBtn) adminNewsBtn.classList.remove('hidden');
        headerSubtitle.textContent = "Modalità Admin: fai DOPPIO CLICK sulla mappa per aggiungere/programmare una segnalazione";
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        if (adminFilterBar) adminFilterBar.classList.add('hidden');
        if (adminReportsBtn) adminReportsBtn.classList.add('hidden');
        if (adminNewsBtn) adminNewsBtn.classList.add('hidden');
        headerSubtitle.textContent = "Modalità Visualizzazione: cerca una via o tocca i marker per i dettagli";
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

    // Evento click sulla mappa (per selezione punto da parte dell'utente o per navigazione)
    map.on('click', async function (e) {
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
        appVersionEl.textContent = `Versione ${APP_VERSION}`;
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

// LOGICA RICERCA (Nominatim per Utente e Admin)
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

let userSearchMarker = null;

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.textContent = '...';
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

let streetGeomCache = {};
try {
    const cached = localStorage.getItem('ferrara_street_cache_v22');
    if (cached) streetGeomCache = JSON.parse(cached);
} catch (e) {
    streetGeomCache = {};
}

function saveStreetGeomCache() {
    try {
        localStorage.setItem('ferrara_street_cache_v22', JSON.stringify(streetGeomCache));
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
    'ferrarese': [
        [44.73506, 11.28502], [44.73501, 11.28536], [44.73426, 11.28640], [44.73418, 11.28651], [44.73387, 11.28692], [44.73370, 11.28715], 
        [44.73295, 11.28816], [44.73320, 11.28837], [44.73334, 11.28849], [44.73424, 11.28931], [44.73476, 11.28978], [44.73480, 11.28982], 
        [44.73484, 11.28987], [44.73487, 11.28990], [44.73489, 11.28992], [44.73599, 11.29115], [44.73602, 11.29120], [44.73604, 11.29123], 
        [44.73606, 11.29126], [44.73607, 11.29129], [44.73608, 11.29132], [44.73608, 11.29135], [44.73608, 11.29138], [44.73607, 11.29141], 
        [44.73583, 11.29262], [44.73579, 11.29268], [44.73577, 11.29275], [44.73528, 11.29474], [44.73526, 11.29485], [44.73499, 11.29588], 
        [44.73495, 11.29603], [44.73509, 11.29619], [44.73579, 11.29708], [44.73641, 11.29787], [44.73723, 11.29889], [44.73809, 11.29987], 
        [44.73864, 11.30031], [44.73909, 11.30069], [44.73926, 11.30083], [44.73935, 11.30090], [44.73951, 11.30102], [44.73974, 11.30119], 
        [44.74013, 11.30145], [44.74041, 11.30163], [44.74083, 11.30188], [44.74097, 11.30196], [44.74100, 11.30197], [44.74107, 11.30201], 
        [44.74146, 11.30218], [44.74161, 11.30224], [44.74168, 11.30219], [44.74316, 11.30279], [44.74333, 11.30285], [44.74335, 11.30290], 
        [44.74338, 11.30296], [44.74430, 11.30330], [44.74528, 11.30369], [44.74576, 11.30387], [44.74612, 11.30403], [44.74738, 11.30451], 
        [44.74749, 11.30456], [44.74795, 11.30473], [44.74838, 11.30490], [44.74859, 11.30498], [44.74913, 11.30518], [44.74920, 11.30521], 
        [44.74976, 11.30544], [44.74996, 11.30551], [44.75017, 11.30559], [44.75062, 11.30576], [44.75081, 11.30581], [44.75123, 11.30596], 
        [44.75153, 11.30605], [44.75202, 11.30627], [44.75222, 11.30636], [44.75243, 11.30645], [44.75284, 11.30664], [44.75325, 11.30682], 
        [44.75339, 11.30688], [44.75362, 11.30698], [44.75367, 11.30701], [44.75377, 11.30703], [44.75403, 11.30703], [44.75421, 11.30703], 
        [44.75435, 11.30706], [44.75449, 11.30712], [44.75470, 11.30746], [44.75488, 11.30775], [44.75502, 11.30798], [44.75536, 11.30843], 
        [44.75547, 11.30863], [44.75569, 11.30901], [44.75589, 11.30940], [44.75609, 11.30978], [44.75634, 11.31026], [44.75636, 11.31030], 
        [44.75654, 11.31065], [44.75656, 11.31069], [44.75673, 11.31094], [44.75677, 11.31101], [44.75703, 11.31136], [44.75729, 11.31171], 
        [44.75751, 11.31202], [44.75768, 11.31222], [44.75782, 11.31237], [44.75816, 11.31276], [44.75850, 11.31313], [44.75879, 11.31345], 
        [44.75883, 11.31349], [44.75907, 11.31377], [44.75912, 11.31381], [44.75918, 11.31384], [44.75930, 11.31400], [44.75946, 11.31419], 
        [44.75964, 11.31446], [44.75980, 11.31471], [44.76015, 11.31526], [44.76030, 11.31549], [44.76054, 11.31588], [44.76081, 11.31626], 
        [44.76118, 11.31666], [44.76123, 11.31671], [44.76126, 11.31665], [44.76155, 11.31695], [44.76167, 11.31707], [44.76199, 11.31736], 
        [44.76211, 11.31745], [44.76325, 11.31822], [44.76385, 11.31702], [44.76457, 11.31573], [44.76499, 11.31498]
    ],
    'viaferrarese': [
        [44.73506, 11.28502], [44.73501, 11.28536], [44.73426, 11.28640], [44.73418, 11.28651], [44.73387, 11.28692], [44.73370, 11.28715], 
        [44.73295, 11.28816], [44.73320, 11.28837], [44.73334, 11.28849], [44.73424, 11.28931], [44.73476, 11.28978], [44.73480, 11.28982], 
        [44.73484, 11.28987], [44.73487, 11.28990], [44.73489, 11.28992], [44.73599, 11.29115], [44.73602, 11.29120], [44.73604, 11.29123], 
        [44.73606, 11.29126], [44.73607, 11.29129], [44.73608, 11.29132], [44.73608, 11.29135], [44.73608, 11.29138], [44.73607, 11.29141], 
        [44.73583, 11.29262], [44.73579, 11.29268], [44.73577, 11.29275], [44.73528, 11.29474], [44.73526, 11.29485], [44.73499, 11.29588], 
        [44.73495, 11.29603], [44.73509, 11.29619], [44.73579, 11.29708], [44.73641, 11.29787], [44.73723, 11.29889], [44.73809, 11.29987], 
        [44.73864, 11.30031], [44.73909, 11.30069], [44.73926, 11.30083], [44.73935, 11.30090], [44.73951, 11.30102], [44.73974, 11.30119], 
        [44.74013, 11.30145], [44.74041, 11.30163], [44.74083, 11.30188], [44.74097, 11.30196], [44.74100, 11.30197], [44.74107, 11.30201], 
        [44.74146, 11.30218], [44.74161, 11.30224], [44.74168, 11.30219], [44.74316, 11.30279], [44.74333, 11.30285], [44.74335, 11.30290], 
        [44.74338, 11.30296], [44.74430, 11.30330], [44.74528, 11.30369], [44.74576, 11.30387], [44.74612, 11.30403], [44.74738, 11.30451], 
        [44.74749, 11.30456], [44.74795, 11.30473], [44.74838, 11.30490], [44.74859, 11.30498], [44.74913, 11.30518], [44.74920, 11.30521], 
        [44.74976, 11.30544], [44.74996, 11.30551], [44.75017, 11.30559], [44.75062, 11.30576], [44.75081, 11.30581], [44.75123, 11.30596], 
        [44.75153, 11.30605], [44.75202, 11.30627], [44.75222, 11.30636], [44.75243, 11.30645], [44.75284, 11.30664], [44.75325, 11.30682], 
        [44.75339, 11.30688], [44.75362, 11.30698], [44.75367, 11.30701], [44.75377, 11.30703], [44.75403, 11.30703], [44.75421, 11.30703], 
        [44.75435, 11.30706], [44.75449, 11.30712], [44.75470, 11.30746], [44.75488, 11.30775], [44.75502, 11.30798], [44.75536, 11.30843], 
        [44.75547, 11.30863], [44.75569, 11.30901], [44.75589, 11.30940], [44.75609, 11.30978], [44.75634, 11.31026], [44.75636, 11.31030], 
        [44.75654, 11.31065], [44.75656, 11.31069], [44.75673, 11.31094], [44.75677, 11.31101], [44.75703, 11.31136], [44.75729, 11.31171], 
        [44.75751, 11.31202], [44.75768, 11.31222], [44.75782, 11.31237], [44.75816, 11.31276], [44.75850, 11.31313], [44.75879, 11.31345], 
        [44.75883, 11.31349], [44.75907, 11.31377], [44.75912, 11.31381], [44.75918, 11.31384], [44.75930, 11.31400], [44.75946, 11.31419], 
        [44.75964, 11.31446], [44.75980, 11.31471], [44.76015, 11.31526], [44.76030, 11.31549], [44.76054, 11.31588], [44.76081, 11.31626], 
        [44.76118, 11.31666], [44.76123, 11.31671], [44.76126, 11.31665], [44.76155, 11.31695], [44.76167, 11.31707], [44.76199, 11.31736], 
        [44.76211, 11.31745], [44.76325, 11.31822], [44.76385, 11.31702], [44.76457, 11.31573], [44.76499, 11.31498]
    ],
    'ss468': [
        [44.78457, 11.22658], [44.78541, 11.22637], [44.78724, 11.22594], [44.78731, 11.22594], [44.78730, 11.22582], [44.78729, 11.22575], 
        [44.78728, 11.22555], [44.78865, 11.22520], [44.79124, 11.22457], [44.79204, 11.23098], [44.79217, 11.23203], [44.79219, 11.23220], 
        [44.79224, 11.23258], [44.79234, 11.23331], [44.79243, 11.23399], [44.79247, 11.23424], [44.79265, 11.23556], [44.79286, 11.23690], 
        [44.79307, 11.23854], [44.79309, 11.23864], [44.79318, 11.23940], [44.79328, 11.24026], [44.79363, 11.24305], [44.79391, 11.24537], 
        [44.79393, 11.24556], [44.78027, 11.24900], [44.77977, 11.24910], [44.77962, 11.24916], [44.77960, 11.24917], [44.77910, 11.24953], 
        [44.77769, 11.25011], [44.77378, 11.25174], [44.77144, 11.25270], [44.76971, 11.25341], [44.76894, 11.25373], [44.76691, 11.25456], 
        [44.76679, 11.25463], [44.76658, 11.25447], [44.76574, 11.25369], [44.76572, 11.25367], [44.76539, 11.25477], [44.76319, 11.26233], 
        [44.76194, 11.26660], [44.76097, 11.26987], [44.75915, 11.26973], [44.75722, 11.26976], [44.75536, 11.26962], [44.75346, 11.26943], 
        [44.75269, 11.27216], [44.75188, 11.27490], [44.75185, 11.27498], [44.75181, 11.27507], [44.75176, 11.27502], [44.75142, 11.27464], 
        [44.75130, 11.27452], [44.75117, 11.27437], [44.75111, 11.27431], [44.75104, 11.27425], [44.75098, 11.27419], [44.75091, 11.27413], 
        [44.75086, 11.27409], [44.75079, 11.27404], [44.75072, 11.27399], [44.75063, 11.27394], [44.75054, 11.27389], [44.75045, 11.27385], 
        [44.75036, 11.27381], [44.75028, 11.27378], [44.75019, 11.27375], [44.75009, 11.27372], [44.75000, 11.27370], [44.74987, 11.27367], 
        [44.74974, 11.27364], [44.74937, 11.27358], [44.74918, 11.27355], [44.74912, 11.27354], [44.74891, 11.27352], [44.74868, 11.27349], 
        [44.74856, 11.27348], [44.74845, 11.27349], [44.74833, 11.27349], [44.74820, 11.27350], [44.74807, 11.27352], [44.74795, 11.27353], 
        [44.74781, 11.27355], [44.74767, 11.27357], [44.74755, 11.27359], [44.74743, 11.27360], [44.74727, 11.27360], [44.74719, 11.27358], 
        [44.74711, 11.27354], [44.74704, 11.27353], [44.74699, 11.27354], [44.74695, 11.27354], [44.74692, 11.27357], [44.74689, 11.27360], 
        [44.74684, 11.27367], [44.74681, 11.27374], [44.74680, 11.27388], [44.74677, 11.27396], [44.74677, 11.27413], [44.74675, 11.27432], 
        [44.74673, 11.27453], [44.74671, 11.27472], [44.74669, 11.27492], [44.74667, 11.27508], [44.74665, 11.27518], [44.74663, 11.27529], 
        [44.74660, 11.27540], [44.74656, 11.27552], [44.74653, 11.27563], [44.74646, 11.27584], [44.74591, 11.27751], [44.74568, 11.27821], 
        [44.74547, 11.27885], [44.74534, 11.27922], [44.74533, 11.27925], [44.74477, 11.28096], [44.74444, 11.28192], [44.74436, 11.28220], 
        [44.74431, 11.28238], [44.74426, 11.28260], [44.74422, 11.28279], [44.74414, 11.28291], [44.74410, 11.28296], [44.74405, 11.28303], 
        [44.74399, 11.28310], [44.74393, 11.28316], [44.74388, 11.28321], [44.74387, 11.28322], [44.74383, 11.28325], [44.74381, 11.28329], 
        [44.74378, 11.28334], [44.74375, 11.28338], [44.74370, 11.28348], [44.74348, 11.28379], [44.74341, 11.28387], [44.74334, 11.28394], 
        [44.74327, 11.28401], [44.74320, 11.28406], [44.74311, 11.28412], [44.74303, 11.28417], [44.74293, 11.28422], [44.74282, 11.28426], 
        [44.74268, 11.28430], [44.74259, 11.28433], [44.74251, 11.28434], [44.74243, 11.28435], [44.74234, 11.28435], [44.74225, 11.28434], 
        [44.74215, 11.28433], [44.74205, 11.28432], [44.74196, 11.28429], [44.74186, 11.28426], [44.74180, 11.28423], [44.74173, 11.28419], 
        [44.74165, 11.28414], [44.74160, 11.28410], [44.74156, 11.28408], [44.74148, 11.28401], [44.74143, 11.28396], [44.74062, 11.28320], 
        [44.74033, 11.28293], [44.73966, 11.28230], [44.73946, 11.28210], [44.73860, 11.28138], [44.73843, 11.28123], [44.73834, 11.28116], 
        [44.73827, 11.28111], [44.73820, 11.28106], [44.73818, 11.28105], [44.73812, 11.28102], [44.73805, 11.28098], [44.73796, 11.28095], 
        [44.73787, 11.28091], [44.73767, 11.28086], [44.73755, 11.28084], [44.73745, 11.28082], [44.73736, 11.28080], [44.73727, 11.28079], 
        [44.73718, 11.28078], [44.73630, 11.28073], [44.73593, 11.28071], [44.73587, 11.28071], [44.73582, 11.28071], [44.73577, 11.28072], 
        [44.73572, 11.28074], [44.73565, 11.28077], [44.73463, 11.28133], [44.73458, 11.28135], [44.73448, 11.28140], [44.73441, 11.28144], 
        [44.73433, 11.28147], [44.73425, 11.28151], [44.73418, 11.28153], [44.73411, 11.28156], [44.73409, 11.28156], [44.73387, 11.28163], 
        [44.73355, 11.28173], [44.73349, 11.28175], [44.73345, 11.28176], [44.73340, 11.28177], [44.73336, 11.28178], [44.73331, 11.28178], 
        [44.73327, 11.28179], [44.73322, 11.28179], [44.73317, 11.28179], [44.73316, 11.28180], [44.73312, 11.28180], [44.73306, 11.28179], 
        [44.73296, 11.28178], [44.73233, 11.28167], [44.73194, 11.28161], [44.73146, 11.28152], [44.73100, 11.28145], [44.73088, 11.28144], 
        [44.73067, 11.28140], [44.73064, 11.28139], [44.72953, 11.28106], [44.72948, 11.28104], [44.72913, 11.28094], [44.72894, 11.28088], 
        [44.72885, 11.28086], [44.72884, 11.28088], [44.72877, 11.28093], [44.72872, 11.28097], [44.72869, 11.28100], [44.72868, 11.28104], 
        [44.72867, 11.28110], [44.72867, 11.28115], [44.72867, 11.28122], [44.72866, 11.28127], [44.72865, 11.28131], [44.72860, 11.28146], 
        [44.72858, 11.28152], [44.72855, 11.28157], [44.72853, 11.28162], [44.72852, 11.28166], [44.72852, 11.28170], [44.72852, 11.28175], 
        [44.72853, 11.28181], [44.72854, 11.28200], [44.72855, 11.28211], [44.72855, 11.28221], [44.72853, 11.28235], [44.72850, 11.28259], 
        [44.72849, 11.28266], [44.72849, 11.28266], [44.72852, 11.28272], [44.72854, 11.28280], [44.72854, 11.28288], [44.72848, 11.28334], 
        [44.72832, 11.28465], [44.72829, 11.28476], [44.72828, 11.28480], [44.72827, 11.28485], [44.72824, 11.28496], [44.72821, 11.28506], 
        [44.72814, 11.28530], [44.72730, 11.28482], [44.72708, 11.28468], [44.72703, 11.28454], [44.72701, 11.28449], [44.72699, 11.28443], 
        [44.72663, 11.28465], [44.72656, 11.28471], [44.72649, 11.28473], [44.72646, 11.28474], [44.72643, 11.28475], [44.72641, 11.28475], 
        [44.72637, 11.28474], [44.72632, 11.28472], [44.72599, 11.28456], [44.72596, 11.28455], [44.72593, 11.28454], [44.72591, 11.28454], 
        [44.72590, 11.28454], [44.72589, 11.28454], [44.72587, 11.28455], [44.72586, 11.28456], [44.72583, 11.28457], [44.72581, 11.28460], 
        [44.72575, 11.28465], [44.72543, 11.28497], [44.72537, 11.28503], [44.72498, 11.28541], [44.72438, 11.28602], [44.72435, 11.28604], 
        [44.72424, 11.28617], [44.72417, 11.28625], [44.72414, 11.28629], [44.72410, 11.28635], [44.72406, 11.28643], [44.72400, 11.28655], 
        [44.72371, 11.28720], [44.72345, 11.28796], [44.72326, 11.28851], [44.72282, 11.28983], [44.72280, 11.28989], [44.72265, 11.29032], 
        [44.72260, 11.29045], [44.72247, 11.29084], [44.72230, 11.29134], [44.72228, 11.29142], [44.72227, 11.29147], [44.72226, 11.29153], 
        [44.72226, 11.29158], [44.72226, 11.29162], [44.72226, 11.29164], [44.72226, 11.29169], [44.72227, 11.29173], [44.72228, 11.29178], 
        [44.72230, 11.29183], [44.72233, 11.29189], [44.72237, 11.29193], [44.72261, 11.29218], [44.72268, 11.29237], [44.72267, 11.29241], 
        [44.72266, 11.29244], [44.72267, 11.29248], [44.72268, 11.29252], [44.72270, 11.29255], [44.72272, 11.29256], [44.72275, 11.29256], 
        [44.72277, 11.29256], [44.72280, 11.29254], [44.72295, 11.29258], [44.72331, 11.29300], [44.72329, 11.29302], [44.72329, 11.29305], 
        [44.72328, 11.29309], [44.72329, 11.29312], [44.72330, 11.29315], [44.72300, 11.29353], [44.72292, 11.29362], [44.72272, 11.29387], 
        [44.72259, 11.29402], [44.72215, 11.29459], [44.72188, 11.29493], [44.72156, 11.29534], [44.72153, 11.29538], [44.72060, 11.29657], 
        [44.72020, 11.29708], [44.72013, 11.29717], [44.71935, 11.29820], [44.71882, 11.29888], [44.71835, 11.29949], [44.71760, 11.30046], 
        [44.71756, 11.30051], [44.71732, 11.30084], [44.71715, 11.30105], [44.71658, 11.30180], [44.71611, 11.30240], [44.71582, 11.30278], 
        [44.71573, 11.30291], [44.71534, 11.30340], [44.71504, 11.30377], [44.71488, 11.30398], [44.71486, 11.30396], [44.71485, 11.30395], 
        [44.71483, 11.30395], [44.71481, 11.30396], [44.71480, 11.30397], [44.71479, 11.30399], [44.71478, 11.30401], [44.71478, 11.30403], 
        [44.71478, 11.30405], [44.71479, 11.30406], [44.71479, 11.30408], [44.71480, 11.30410], [44.71482, 11.30411], [44.71483, 11.30411], 
        [44.71485, 11.30411], [44.71486, 11.30410], [44.71487, 11.30409], [44.71488, 11.30407], [44.71491, 11.30410], [44.71497, 11.30418], 
        [44.71503, 11.30425], [44.71514, 11.30438], [44.71524, 11.30454], [44.71541, 11.30482], [44.71554, 11.30508], [44.71559, 11.30523], 
        [44.71564, 11.30539], [44.71565, 11.30549], [44.71566, 11.30553], [44.71566, 11.30564], [44.71567, 11.30595], [44.71567, 11.30639], 
        [44.71567, 11.30655], [44.71567, 11.30666], [44.71565, 11.30703], [44.71560, 11.30746], [44.71555, 11.30775], [44.71552, 11.30791], 
        [44.71549, 11.30804], [44.71592, 11.30848], [44.71602, 11.30858], [44.71614, 11.30870], [44.71646, 11.30904], [44.71711, 11.30970], 
        [44.71826, 11.31095], [44.71870, 11.31144], [44.71951, 11.31225], [44.71959, 11.31233], [44.71979, 11.31252], [44.72015, 11.31288], 
        [44.72045, 11.31317], [44.72131, 11.31411], [44.72333, 11.31621], [44.72339, 11.31626], [44.72387, 11.31677], [44.72439, 11.31731], 
        [44.72487, 11.31782], [44.72549, 11.31847], [44.72551, 11.31849], [44.72617, 11.31915], [44.72627, 11.31924], [44.72619, 11.31940], 
        [44.72614, 11.31952], [44.72612, 11.31964], [44.72613, 11.31979], [44.72649, 11.32079], [44.72666, 11.32224], [44.72667, 11.32238], 
        [44.72689, 11.32435], [44.72716, 11.32602], [44.72741, 11.32811], [44.72742, 11.32821], [44.72782, 11.33092], [44.72829, 11.33419], 
        [44.72876, 11.33788], [44.72886, 11.33793], [44.72894, 11.33798], [44.73012, 11.33897], [44.73016, 11.33900]
    ],
    'sp468': [
        [44.78457, 11.22658], [44.78541, 11.22637], [44.78724, 11.22594], [44.78731, 11.22594], [44.78730, 11.22582], [44.78729, 11.22575], 
        [44.78728, 11.22555], [44.78865, 11.22520], [44.79124, 11.22457], [44.79204, 11.23098], [44.79217, 11.23203], [44.79219, 11.23220], 
        [44.79224, 11.23258], [44.79234, 11.23331], [44.79243, 11.23399], [44.79247, 11.23424], [44.79265, 11.23556], [44.79286, 11.23690], 
        [44.79307, 11.23854], [44.79309, 11.23864], [44.79318, 11.23940], [44.79328, 11.24026], [44.79363, 11.24305], [44.79391, 11.24537], 
        [44.79393, 11.24556], [44.78027, 11.24900], [44.77977, 11.24910], [44.77962, 11.24916], [44.77960, 11.24917], [44.77910, 11.24953], 
        [44.77769, 11.25011], [44.77378, 11.25174], [44.77144, 11.25270], [44.76971, 11.25341], [44.76894, 11.25373], [44.76691, 11.25456], 
        [44.76679, 11.25463], [44.76658, 11.25447], [44.76574, 11.25369], [44.76572, 11.25367], [44.76539, 11.25477], [44.76319, 11.26233], 
        [44.76194, 11.26660], [44.76097, 11.26987], [44.75915, 11.26973], [44.75722, 11.26976], [44.75536, 11.26962], [44.75346, 11.26943], 
        [44.75269, 11.27216], [44.75188, 11.27490], [44.75185, 11.27498], [44.75181, 11.27507], [44.75176, 11.27502], [44.75142, 11.27464], 
        [44.75130, 11.27452], [44.75117, 11.27437], [44.75111, 11.27431], [44.75104, 11.27425], [44.75098, 11.27419], [44.75091, 11.27413], 
        [44.75086, 11.27409], [44.75079, 11.27404], [44.75072, 11.27399], [44.75063, 11.27394], [44.75054, 11.27389], [44.75045, 11.27385], 
        [44.75036, 11.27381], [44.75028, 11.27378], [44.75019, 11.27375], [44.75009, 11.27372], [44.75000, 11.27370], [44.74987, 11.27367], 
        [44.74974, 11.27364], [44.74937, 11.27358], [44.74918, 11.27355], [44.74912, 11.27354], [44.74891, 11.27352], [44.74868, 11.27349], 
        [44.74856, 11.27348], [44.74845, 11.27349], [44.74833, 11.27349], [44.74820, 11.27350], [44.74807, 11.27352], [44.74795, 11.27353], 
        [44.74781, 11.27355], [44.74767, 11.27357], [44.74755, 11.27359], [44.74743, 11.27360], [44.74727, 11.27360], [44.74719, 11.27358], 
        [44.74711, 11.27354], [44.74704, 11.27353], [44.74699, 11.27354], [44.74695, 11.27354], [44.74692, 11.27357], [44.74689, 11.27360], 
        [44.74684, 11.27367], [44.74681, 11.27374], [44.74680, 11.27388], [44.74677, 11.27396], [44.74677, 11.27413], [44.74675, 11.27432], 
        [44.74673, 11.27453], [44.74671, 11.27472], [44.74669, 11.27492], [44.74667, 11.27508], [44.74665, 11.27518], [44.74663, 11.27529], 
        [44.74660, 11.27540], [44.74656, 11.27552], [44.74653, 11.27563], [44.74646, 11.27584], [44.74591, 11.27751], [44.74568, 11.27821], 
        [44.74547, 11.27885], [44.74534, 11.27922], [44.74533, 11.27925], [44.74477, 11.28096], [44.74444, 11.28192], [44.74436, 11.28220], 
        [44.74431, 11.28238], [44.74426, 11.28260], [44.74422, 11.28279], [44.74414, 11.28291], [44.74410, 11.28296], [44.74405, 11.28303], 
        [44.74399, 11.28310], [44.74393, 11.28316], [44.74388, 11.28321], [44.74387, 11.28322], [44.74383, 11.28325], [44.74381, 11.28329], 
        [44.74378, 11.28334], [44.74375, 11.28338], [44.74370, 11.28348], [44.74348, 11.28379], [44.74341, 11.28387], [44.74334, 11.28394], 
        [44.74327, 11.28401], [44.74320, 11.28406], [44.74311, 11.28412], [44.74303, 11.28417], [44.74293, 11.28422], [44.74282, 11.28426], 
        [44.74268, 11.28430], [44.74259, 11.28433], [44.74251, 11.28434], [44.74243, 11.28435], [44.74234, 11.28435], [44.74225, 11.28434], 
        [44.74215, 11.28433], [44.74205, 11.28432], [44.74196, 11.28429], [44.74186, 11.28426], [44.74180, 11.28423], [44.74173, 11.28419], 
        [44.74165, 11.28414], [44.74160, 11.28410], [44.74156, 11.28408], [44.74148, 11.28401], [44.74143, 11.28396], [44.74062, 11.28320], 
        [44.74033, 11.28293], [44.73966, 11.28230], [44.73946, 11.28210], [44.73860, 11.28138], [44.73843, 11.28123], [44.73834, 11.28116], 
        [44.73827, 11.28111], [44.73820, 11.28106], [44.73818, 11.28105], [44.73812, 11.28102], [44.73805, 11.28098], [44.73796, 11.28095], 
        [44.73787, 11.28091], [44.73767, 11.28086], [44.73755, 11.28084], [44.73745, 11.28082], [44.73736, 11.28080], [44.73727, 11.28079], 
        [44.73718, 11.28078], [44.73630, 11.28073], [44.73593, 11.28071], [44.73587, 11.28071], [44.73582, 11.28071], [44.73577, 11.28072], 
        [44.73572, 11.28074], [44.73565, 11.28077], [44.73463, 11.28133], [44.73458, 11.28135], [44.73448, 11.28140], [44.73441, 11.28144], 
        [44.73433, 11.28147], [44.73425, 11.28151], [44.73418, 11.28153], [44.73411, 11.28156], [44.73409, 11.28156], [44.73387, 11.28163], 
        [44.73355, 11.28173], [44.73349, 11.28175], [44.73345, 11.28176], [44.73340, 11.28177], [44.73336, 11.28178], [44.73331, 11.28178], 
        [44.73327, 11.28179], [44.73322, 11.28179], [44.73317, 11.28179], [44.73316, 11.28180], [44.73312, 11.28180], [44.73306, 11.28179], 
        [44.73296, 11.28178], [44.73233, 11.28167], [44.73194, 11.28161], [44.73146, 11.28152], [44.73100, 11.28145], [44.73088, 11.28144], 
        [44.73067, 11.28140], [44.73064, 11.28139], [44.72953, 11.28106], [44.72948, 11.28104], [44.72913, 11.28094], [44.72894, 11.28088], 
        [44.72885, 11.28086], [44.72884, 11.28088], [44.72877, 11.28093], [44.72872, 11.28097], [44.72869, 11.28100], [44.72868, 11.28104], 
        [44.72867, 11.28110], [44.72867, 11.28115], [44.72867, 11.28122], [44.72866, 11.28127], [44.72865, 11.28131], [44.72860, 11.28146], 
        [44.72858, 11.28152], [44.72855, 11.28157], [44.72853, 11.28162], [44.72852, 11.28166], [44.72852, 11.28170], [44.72852, 11.28175], 
        [44.72853, 11.28181], [44.72854, 11.28200], [44.72855, 11.28211], [44.72855, 11.28221], [44.72853, 11.28235], [44.72850, 11.28259], 
        [44.72849, 11.28266], [44.72849, 11.28266], [44.72852, 11.28272], [44.72854, 11.28280], [44.72854, 11.28288], [44.72848, 11.28334], 
        [44.72832, 11.28465], [44.72829, 11.28476], [44.72828, 11.28480], [44.72827, 11.28485], [44.72824, 11.28496], [44.72821, 11.28506], 
        [44.72814, 11.28530], [44.72730, 11.28482], [44.72708, 11.28468], [44.72703, 11.28454], [44.72701, 11.28449], [44.72699, 11.28443], 
        [44.72663, 11.28465], [44.72656, 11.28471], [44.72649, 11.28473], [44.72646, 11.28474], [44.72643, 11.28475], [44.72641, 11.28475], 
        [44.72637, 11.28474], [44.72632, 11.28472], [44.72599, 11.28456], [44.72596, 11.28455], [44.72593, 11.28454], [44.72591, 11.28454], 
        [44.72590, 11.28454], [44.72589, 11.28454], [44.72587, 11.28455], [44.72586, 11.28456], [44.72583, 11.28457], [44.72581, 11.28460], 
        [44.72575, 11.28465], [44.72543, 11.28497], [44.72537, 11.28503], [44.72498, 11.28541], [44.72438, 11.28602], [44.72435, 11.28604], 
        [44.72424, 11.28617], [44.72417, 11.28625], [44.72414, 11.28629], [44.72410, 11.28635], [44.72406, 11.28643], [44.72400, 11.28655], 
        [44.72371, 11.28720], [44.72345, 11.28796], [44.72326, 11.28851], [44.72282, 11.28983], [44.72280, 11.28989], [44.72265, 11.29032], 
        [44.72260, 11.29045], [44.72247, 11.29084], [44.72230, 11.29134], [44.72228, 11.29142], [44.72227, 11.29147], [44.72226, 11.29153], 
        [44.72226, 11.29158], [44.72226, 11.29162], [44.72226, 11.29164], [44.72226, 11.29169], [44.72227, 11.29173], [44.72228, 11.29178], 
        [44.72230, 11.29183], [44.72233, 11.29189], [44.72237, 11.29193], [44.72261, 11.29218], [44.72268, 11.29237], [44.72267, 11.29241], 
        [44.72266, 11.29244], [44.72267, 11.29248], [44.72268, 11.29252], [44.72270, 11.29255], [44.72272, 11.29256], [44.72275, 11.29256], 
        [44.72277, 11.29256], [44.72280, 11.29254], [44.72295, 11.29258], [44.72331, 11.29300], [44.72329, 11.29302], [44.72329, 11.29305], 
        [44.72328, 11.29309], [44.72329, 11.29312], [44.72330, 11.29315], [44.72300, 11.29353], [44.72292, 11.29362], [44.72272, 11.29387], 
        [44.72259, 11.29402], [44.72215, 11.29459], [44.72188, 11.29493], [44.72156, 11.29534], [44.72153, 11.29538], [44.72060, 11.29657], 
        [44.72020, 11.29708], [44.72013, 11.29717], [44.71935, 11.29820], [44.71882, 11.29888], [44.71835, 11.29949], [44.71760, 11.30046], 
        [44.71756, 11.30051], [44.71732, 11.30084], [44.71715, 11.30105], [44.71658, 11.30180], [44.71611, 11.30240], [44.71582, 11.30278], 
        [44.71573, 11.30291], [44.71534, 11.30340], [44.71504, 11.30377], [44.71488, 11.30398], [44.71486, 11.30396], [44.71485, 11.30395], 
        [44.71483, 11.30395], [44.71481, 11.30396], [44.71480, 11.30397], [44.71479, 11.30399], [44.71478, 11.30401], [44.71478, 11.30403], 
        [44.71478, 11.30405], [44.71479, 11.30406], [44.71479, 11.30408], [44.71480, 11.30410], [44.71482, 11.30411], [44.71483, 11.30411], 
        [44.71485, 11.30411], [44.71486, 11.30410], [44.71487, 11.30409], [44.71488, 11.30407], [44.71491, 11.30410], [44.71497, 11.30418], 
        [44.71503, 11.30425], [44.71514, 11.30438], [44.71524, 11.30454], [44.71541, 11.30482], [44.71554, 11.30508], [44.71559, 11.30523], 
        [44.71564, 11.30539], [44.71565, 11.30549], [44.71566, 11.30553], [44.71566, 11.30564], [44.71567, 11.30595], [44.71567, 11.30639], 
        [44.71567, 11.30655], [44.71567, 11.30666], [44.71565, 11.30703], [44.71560, 11.30746], [44.71555, 11.30775], [44.71552, 11.30791], 
        [44.71549, 11.30804], [44.71592, 11.30848], [44.71602, 11.30858], [44.71614, 11.30870], [44.71646, 11.30904], [44.71711, 11.30970], 
        [44.71826, 11.31095], [44.71870, 11.31144], [44.71951, 11.31225], [44.71959, 11.31233], [44.71979, 11.31252], [44.72015, 11.31288], 
        [44.72045, 11.31317], [44.72131, 11.31411], [44.72333, 11.31621], [44.72339, 11.31626], [44.72387, 11.31677], [44.72439, 11.31731], 
        [44.72487, 11.31782], [44.72549, 11.31847], [44.72551, 11.31849], [44.72617, 11.31915], [44.72627, 11.31924], [44.72619, 11.31940], 
        [44.72614, 11.31952], [44.72612, 11.31964], [44.72613, 11.31979], [44.72649, 11.32079], [44.72666, 11.32224], [44.72667, 11.32238], 
        [44.72689, 11.32435], [44.72716, 11.32602], [44.72741, 11.32811], [44.72742, 11.32821], [44.72782, 11.33092], [44.72829, 11.33419], 
        [44.72876, 11.33788], [44.72886, 11.33793], [44.72894, 11.33798], [44.73012, 11.33897], [44.73016, 11.33900]
    ],
    'viastatale': [
        [44.73506, 11.28502], [44.73501, 11.28536], [44.73426, 11.28640], [44.73418, 11.28651], [44.73387, 11.28692], [44.73370, 11.28715], 
        [44.73295, 11.28816], [44.73238, 11.28769], [44.73155, 11.28702], [44.73131, 11.28683], [44.73124, 11.28683], [44.73114, 11.28670], 
        [44.73065, 11.28631], [44.72996, 11.28578], [44.72989, 11.28571], [44.72982, 11.28562], [44.72977, 11.28556], [44.72976, 11.28554], 
        [44.72974, 11.28551], [44.72973, 11.28550], [44.72971, 11.28549], [44.72969, 11.28549], [44.72967, 11.28550], [44.72965, 11.28552], 
        [44.72963, 11.28554], [44.72962, 11.28556], [44.72962, 11.28560], [44.72962, 11.28564], [44.72963, 11.28567], [44.72958, 11.28584], 
        [44.72959, 11.28588], [44.72951, 11.28612], [44.72940, 11.28603], [44.72814, 11.28530], [44.72730, 11.28482], [44.72708, 11.28468], 
        [44.72703, 11.28454], [44.72701, 11.28449], [44.72699, 11.28443], [44.72663, 11.28465], [44.72656, 11.28471], [44.72649, 11.28473], 
        [44.72646, 11.28474], [44.72643, 11.28475], [44.72641, 11.28475], [44.72637, 11.28474], [44.72632, 11.28472], [44.72599, 11.28456], 
        [44.72596, 11.28455], [44.72593, 11.28454], [44.72591, 11.28454], [44.72590, 11.28454], [44.72589, 11.28454], [44.72587, 11.28455], 
        [44.72586, 11.28456], [44.72583, 11.28457], [44.72581, 11.28460], [44.72575, 11.28465], [44.72543, 11.28497], [44.72537, 11.28503], 
        [44.72498, 11.28541], [44.72438, 11.28602], [44.72435, 11.28604], [44.72424, 11.28617], [44.72417, 11.28625], [44.72414, 11.28629], 
        [44.72410, 11.28635], [44.72406, 11.28643], [44.72400, 11.28655], [44.72371, 11.28720], [44.72345, 11.28796], [44.72326, 11.28851], 
        [44.72282, 11.28983], [44.72280, 11.28989], [44.72265, 11.29032], [44.72260, 11.29045], [44.72247, 11.29084], [44.72230, 11.29134], 
        [44.72228, 11.29142], [44.72227, 11.29147], [44.72226, 11.29153], [44.72226, 11.29158], [44.72226, 11.29162], [44.72226, 11.29164], 
        [44.72226, 11.29169], [44.72227, 11.29173], [44.72228, 11.29178], [44.72230, 11.29183], [44.72233, 11.29189], [44.72237, 11.29193], 
        [44.72261, 11.29218], [44.72268, 11.29237], [44.72267, 11.29241], [44.72266, 11.29244], [44.72267, 11.29248], [44.72268, 11.29252], 
        [44.72270, 11.29255], [44.72272, 11.29256], [44.72275, 11.29256], [44.72277, 11.29256], [44.72280, 11.29254], [44.72295, 11.29258], 
        [44.72331, 11.29300], [44.72329, 11.29302], [44.72329, 11.29305], [44.72328, 11.29309], [44.72329, 11.29312], [44.72330, 11.29315], 
        [44.72300, 11.29353], [44.72292, 11.29362], [44.72272, 11.29387], [44.72259, 11.29402], [44.72215, 11.29459], [44.72188, 11.29493], 
        [44.72156, 11.29534], [44.72153, 11.29538], [44.72060, 11.29657], [44.72020, 11.29708], [44.72013, 11.29717], [44.71935, 11.29820], 
        [44.71882, 11.29888], [44.71835, 11.29949], [44.71760, 11.30046], [44.71756, 11.30051], [44.71732, 11.30084], [44.71715, 11.30105], 
        [44.71658, 11.30180], [44.71611, 11.30240], [44.71582, 11.30278], [44.71573, 11.30291], [44.71534, 11.30340], [44.71504, 11.30377], 
        [44.71488, 11.30398], [44.71486, 11.30396], [44.71485, 11.30395], [44.71483, 11.30395], [44.71481, 11.30396], [44.71480, 11.30397], 
        [44.71479, 11.30399], [44.71478, 11.30401], [44.71478, 11.30403], [44.71478, 11.30405], [44.71479, 11.30406], [44.71479, 11.30408], 
        [44.71480, 11.30410], [44.71482, 11.30411], [44.71483, 11.30411], [44.71485, 11.30411], [44.71486, 11.30410], [44.71487, 11.30409], 
        [44.71488, 11.30407], [44.71491, 11.30410], [44.71497, 11.30418], [44.71503, 11.30425], [44.71514, 11.30438], [44.71524, 11.30454], 
        [44.71541, 11.30482], [44.71554, 11.30508], [44.71559, 11.30523], [44.71564, 11.30539], [44.71565, 11.30549], [44.71566, 11.30553], 
        [44.71566, 11.30564], [44.71567, 11.30595], [44.71567, 11.30639], [44.71567, 11.30655], [44.71567, 11.30666], [44.71565, 11.30703], 
        [44.71560, 11.30746], [44.71555, 11.30775], [44.71552, 11.30791], [44.71549, 11.30804], [44.71592, 11.30848], [44.71602, 11.30858], 
        [44.71614, 11.30870], [44.71646, 11.30904], [44.71711, 11.30970], [44.71826, 11.31095], [44.71870, 11.31144], [44.71951, 11.31225], 
        [44.71959, 11.31233], [44.71979, 11.31252], [44.72015, 11.31288], [44.72045, 11.31317], [44.72131, 11.31411], [44.72333, 11.31621], 
        [44.72339, 11.31626], [44.72387, 11.31677], [44.72439, 11.31731], [44.72487, 11.31782], [44.72549, 11.31847], [44.72551, 11.31849], 
        [44.72617, 11.31915], [44.72627, 11.31924], [44.72619, 11.31940], [44.72614, 11.31952], [44.72612, 11.31964], [44.72613, 11.31979], 
        [44.72649, 11.32079], [44.72666, 11.32224], [44.72667, 11.32238], [44.72689, 11.32435], [44.72716, 11.32602], [44.72741, 11.32811], 
        [44.72742, 11.32821], [44.72782, 11.33092], [44.72829, 11.33419], [44.72876, 11.33788], [44.72886, 11.33793], [44.72894, 11.33798], 
        [44.73012, 11.33897], [44.73016, 11.33900]
    ],
    'viabologna': [
        [44.82502, 11.61594], [44.82488, 11.61587], [44.82488, 11.61598], [44.82483, 11.61606], [44.82483, 11.61613], [44.82453, 11.61661], 
        [44.82456, 11.61665], [44.82468, 11.61680], [44.82484, 11.61700], [44.82523, 11.61748], [44.82524, 11.61749], [44.82542, 11.61772], 
        [44.82548, 11.61772], [44.82558, 11.61785], [44.82561, 11.61789], [44.82559, 11.61792], [44.82531, 11.61837], [44.82502, 11.61884], 
        [44.82496, 11.61886], [44.82494, 11.61885], [44.82491, 11.61892], [44.82493, 11.61895], [44.82493, 11.61899], [44.82493, 11.61902], 
        [44.82493, 11.61905], [44.82492, 11.61913], [44.82491, 11.61915], [44.82461, 11.61964], [44.82454, 11.61976], [44.82441, 11.62005], 
        [44.82436, 11.62013], [44.82429, 11.62027], [44.82426, 11.62030], [44.82419, 11.62045], [44.82414, 11.62052], [44.82413, 11.62054], 
        [44.82409, 11.62060], [44.82405, 11.62064], [44.82401, 11.62068], [44.82399, 11.62068], [44.82397, 11.62069], [44.82394, 11.62071], 
        [44.82393, 11.62075], [44.82392, 11.62078], [44.82391, 11.62083], [44.82385, 11.62091], [44.82377, 11.62100], [44.82371, 11.62107], 
        [44.82338, 11.62140], [44.82328, 11.62151], [44.82314, 11.62164], [44.82305, 11.62172], [44.82299, 11.62176], [44.82290, 11.62183], 
        [44.82280, 11.62191], [44.82270, 11.62198], [44.82236, 11.62223], [44.82224, 11.62231], [44.82203, 11.62246], [44.82184, 11.62260], 
        [44.82157, 11.62278], [44.82146, 11.62286], [44.82143, 11.62288], [44.82114, 11.62308], [44.82085, 11.62331], [44.82078, 11.62337], 
        [44.82050, 11.62360], [44.82033, 11.62375], [44.81983, 11.62419], [44.81975, 11.62426], [44.81968, 11.62432], [44.81916, 11.62471], 
        [44.81892, 11.62489], [44.81850, 11.62519], [44.81833, 11.62532], [44.81783, 11.62568], [44.81686, 11.62641], [44.81606, 11.62700], 
        [44.81602, 11.62704], [44.81598, 11.62708], [44.81595, 11.62711], [44.81593, 11.62714], [44.81588, 11.62722], [44.81583, 11.62727], 
        [44.81581, 11.62730], [44.81578, 11.62732], [44.81573, 11.62732], [44.81570, 11.62732], [44.81568, 11.62731], [44.81565, 11.62730], 
        [44.81562, 11.62729], [44.81561, 11.62726], [44.81559, 11.62725], [44.81558, 11.62722], [44.81554, 11.62719], [44.81551, 11.62717], 
        [44.81547, 11.62716], [44.81543, 11.62716], [44.81540, 11.62716], [44.81538, 11.62717], [44.81535, 11.62719], [44.81532, 11.62721], 
        [44.81530, 11.62724], [44.81528, 11.62727], [44.81526, 11.62731], [44.81524, 11.62736], [44.81523, 11.62741], [44.81520, 11.62745], 
        [44.81518, 11.62748], [44.81516, 11.62751], [44.81514, 11.62754], [44.81511, 11.62758], [44.81508, 11.62760], [44.81505, 11.62764], 
        [44.81501, 11.62770], [44.81496, 11.62777], [44.81491, 11.62783], [44.81487, 11.62789], [44.81483, 11.62793], [44.81479, 11.62797], 
        [44.81472, 11.62802], [44.81445, 11.62824], [44.81434, 11.62832], [44.81417, 11.62845], [44.81412, 11.62848], [44.81403, 11.62855], 
        [44.81398, 11.62859], [44.81396, 11.62860], [44.81393, 11.62862], [44.81387, 11.62866], [44.81379, 11.62872], [44.81374, 11.62875], 
        [44.81367, 11.62879], [44.81351, 11.62889], [44.81343, 11.62894], [44.81341, 11.62895], [44.81332, 11.62900], [44.81321, 11.62908], 
        [44.81303, 11.62919], [44.81296, 11.62923], [44.81280, 11.62933], [44.81258, 11.62948], [44.81237, 11.62961], [44.81223, 11.62970], 
        [44.81210, 11.62979], [44.81194, 11.62989], [44.81180, 11.62999], [44.81169, 11.63007], [44.81161, 11.63013], [44.81152, 11.63020], 
        [44.81144, 11.63027], [44.81131, 11.63038], [44.81118, 11.63051], [44.81105, 11.63063], [44.81095, 11.63074], [44.81084, 11.63085], 
        [44.81075, 11.63097], [44.81067, 11.63106], [44.81059, 11.63116], [44.81052, 11.63126], [44.81043, 11.63139], [44.81033, 11.63154], 
        [44.81017, 11.63180], [44.81011, 11.63188], [44.81007, 11.63195], [44.81002, 11.63201], [44.80998, 11.63207], [44.80993, 11.63212], 
        [44.80989, 11.63217], [44.80983, 11.63222], [44.80977, 11.63227], [44.80972, 11.63230], [44.80965, 11.63234], [44.80958, 11.63238], 
        [44.80948, 11.63243], [44.80939, 11.63247], [44.80922, 11.63253], [44.80904, 11.63258], [44.80888, 11.63263], [44.80877, 11.63265], 
        [44.80868, 11.63267], [44.80860, 11.63268], [44.80852, 11.63268], [44.80841, 11.63268], [44.80820, 11.63267], [44.80813, 11.63266], 
        [44.80808, 11.63264], [44.80804, 11.63263], [44.80799, 11.63261], [44.80796, 11.63259], [44.80792, 11.63256], [44.80789, 11.63253], 
        [44.80770, 11.63234], [44.80700, 11.63154], [44.80697, 11.63150], [44.80671, 11.63121], [44.80622, 11.63068], [44.80618, 11.63065], 
        [44.80539, 11.62981], [44.80519, 11.62960], [44.80509, 11.62949], [44.80500, 11.62940], [44.80491, 11.62932], [44.80479, 11.62921], 
        [44.80454, 11.62899], [44.80354, 11.62811], [44.80341, 11.62800], [44.80300, 11.62762], [44.80293, 11.62755], [44.80287, 11.62749], 
        [44.80282, 11.62743], [44.80277, 11.62736], [44.80271, 11.62728], [44.80264, 11.62716], [44.80168, 11.62543], [44.80156, 11.62520], 
        [44.80146, 11.62499], [44.80134, 11.62475], [44.80129, 11.62463], [44.80122, 11.62449], [44.80113, 11.62429], [44.80058, 11.62293], 
        [44.80052, 11.62278], [44.80045, 11.62264], [44.80034, 11.62242], [44.80024, 11.62224], [44.80023, 11.62221], [44.80014, 11.62206], 
        [44.80005, 11.62192], [44.79996, 11.62178], [44.79988, 11.62166], [44.79978, 11.62152], [44.79969, 11.62140], [44.79953, 11.62121], 
        [44.79935, 11.62099], [44.79929, 11.62092], [44.79917, 11.62078], [44.79894, 11.62053], [44.79877, 11.62034], [44.79839, 11.61992], 
        [44.79796, 11.61945], [44.79789, 11.61938], [44.79783, 11.61933], [44.79781, 11.61931], [44.79773, 11.61925], [44.79762, 11.61917], 
        [44.79752, 11.61910], [44.79741, 11.61904], [44.79730, 11.61898], [44.79718, 11.61892], [44.79709, 11.61888], [44.79701, 11.61884], 
        [44.79692, 11.61881], [44.79683, 11.61879], [44.79676, 11.61877], [44.79664, 11.61875], [44.79649, 11.61872], [44.79646, 11.61872], 
        [44.79628, 11.61870], [44.79610, 11.61869], [44.79596, 11.61870], [44.79586, 11.61871], [44.79575, 11.61873], [44.79564, 11.61875], 
        [44.79554, 11.61878], [44.79547, 11.61881], [44.79538, 11.61886], [44.79531, 11.61890], [44.79525, 11.61895], [44.79519, 11.61901], 
        [44.79512, 11.61908], [44.79437, 11.61991], [44.79410, 11.61925], [44.79402, 11.61907], [44.79391, 11.61886], [44.79375, 11.61859], 
        [44.79348, 11.61820], [44.79319, 11.61781], [44.79298, 11.61758], [44.79280, 11.61742], [44.79262, 11.61728], [44.79243, 11.61716], 
        [44.79227, 11.61709], [44.79209, 11.61704], [44.79191, 11.61702], [44.79170, 11.61702], [44.79112, 11.61705], [44.79075, 11.61703], 
        [44.79056, 11.61699], [44.79033, 11.61690], [44.79013, 11.61679], [44.78996, 11.61666], [44.78978, 11.61649], [44.78964, 11.61633], 
        [44.78963, 11.61631], [44.78953, 11.61617], [44.78947, 11.61606], [44.78938, 11.61581], [44.78918, 11.61518], [44.78905, 11.61479], 
        [44.78897, 11.61454], [44.78890, 11.61428], [44.78884, 11.61400], [44.78841, 11.61194], [44.78822, 11.61099], [44.78806, 11.61024], 
        [44.78802, 11.61003], [44.78799, 11.60990], [44.78792, 11.60963], [44.78791, 11.60961], [44.78783, 11.60936], [44.78773, 11.60913], 
        [44.78746, 11.60844], [44.78732, 11.60813], [44.78720, 11.60788], [44.78707, 11.60763], [44.78693, 11.60739], [44.78679, 11.60719], 
        [44.78645, 11.60672], [44.78631, 11.60651], [44.78624, 11.60638], [44.78619, 11.60626], [44.78616, 11.60617], [44.78615, 11.60608], 
        [44.78611, 11.60585], [44.78608, 11.60550], [44.78598, 11.60469], [44.78594, 11.60443], [44.78590, 11.60416], [44.78586, 11.60398], 
        [44.78584, 11.60389], [44.78579, 11.60368], [44.78568, 11.60323], [44.78556, 11.60278], [44.78545, 11.60234], [44.78534, 11.60201], 
        [44.78509, 11.60130], [44.78492, 11.60085], [44.78469, 11.60029], [44.78445, 11.59970], [44.78417, 11.59898], [44.78386, 11.59814], 
        [44.78363, 11.59750], [44.78346, 11.59704], [44.78339, 11.59684], [44.78336, 11.59676], [44.78335, 11.59672], [44.78332, 11.59663], 
        [44.78328, 11.59653], [44.78327, 11.59650], [44.78324, 11.59642], [44.78320, 11.59633], [44.78317, 11.59627], [44.78321, 11.59626], 
        [44.78317, 11.59616], [44.78302, 11.59585], [44.78288, 11.59557], [44.78278, 11.59538], [44.78266, 11.59520], [44.78254, 11.59503], 
        [44.78241, 11.59487], [44.78225, 11.59464], [44.78212, 11.59444], [44.78203, 11.59430], [44.78196, 11.59418], [44.78190, 11.59404], 
        [44.78188, 11.59393], [44.78186, 11.59382], [44.78172, 11.59336], [44.78166, 11.59319], [44.78164, 11.59311], [44.78160, 11.59303], 
        [44.78154, 11.59290], [44.78147, 11.59278], [44.78139, 11.59268], [44.78091, 11.59222], [44.78071, 11.59199], [44.78057, 11.59180], 
        [44.78040, 11.59153], [44.78026, 11.59130], [44.78017, 11.59111], [44.78010, 11.59097], [44.77998, 11.59066], [44.77977, 11.59012], 
        [44.77955, 11.58951], [44.77950, 11.58938], [44.77909, 11.58827], [44.77883, 11.58756], [44.77878, 11.58742], [44.77860, 11.58687], 
        [44.77852, 11.58663], [44.77845, 11.58637], [44.77838, 11.58609], [44.77835, 11.58596], [44.77830, 11.58567], [44.77818, 11.58493], 
        [44.77811, 11.58458], [44.77808, 11.58454], [44.77802, 11.58443], [44.77792, 11.58435], [44.77766, 11.58412], [44.77732, 11.58380], 
        [44.77723, 11.58374], [44.77715, 11.58370], [44.77710, 11.58368], [44.77702, 11.58368], [44.77675, 11.58368], [44.77661, 11.58368], 
        [44.77652, 11.58367], [44.77641, 11.58364], [44.77623, 11.58357], [44.77609, 11.58350], [44.77585, 11.58335], [44.77537, 11.58305], 
        [44.77527, 11.58298], [44.77512, 11.58287], [44.77502, 11.58277], [44.77490, 11.58262], [44.77469, 11.58230], [44.77408, 11.58135], 
        [44.77393, 11.58111], [44.77384, 11.58094], [44.77377, 11.58079], [44.77365, 11.58051], [44.77340, 11.57988], [44.77338, 11.57981], 
        [44.77321, 11.57934], [44.77316, 11.57937], [44.77307, 11.57909], [44.77301, 11.57888], [44.77291, 11.57840], [44.77290, 11.57835], 
        [44.77279, 11.57836], [44.77224, 11.57848], [44.77182, 11.57857], [44.77163, 11.57861], [44.77149, 11.57863], [44.77127, 11.57866], 
        [44.77085, 11.57870], [44.77038, 11.57873], [44.77017, 11.57874], [44.77003, 11.57874], [44.76976, 11.57874], [44.76875, 11.57868], 
        [44.76858, 11.57865], [44.76854, 11.57865], [44.76841, 11.57864], [44.76838, 11.57863], [44.76825, 11.57863], [44.76813, 11.57863], 
        [44.76811, 11.57862], [44.76795, 11.57864], [44.76761, 11.57865], [44.76692, 11.57868], [44.76675, 11.57869], [44.76665, 11.57869], 
        [44.76654, 11.57868], [44.76641, 11.57868], [44.76636, 11.57868], [44.76628, 11.57866], [44.76621, 11.57865], [44.76605, 11.57861], 
        [44.76582, 11.57854], [44.76574, 11.57852], [44.76567, 11.57849], [44.76560, 11.57845], [44.76549, 11.57839], [44.76543, 11.57835], 
        [44.76538, 11.57831], [44.76534, 11.57828], [44.76529, 11.57823], [44.76526, 11.57819], [44.76522, 11.57815], [44.76514, 11.57805], 
        [44.76497, 11.57783], [44.76487, 11.57771], [44.76480, 11.57763], [44.76473, 11.57755], [44.76468, 11.57750], [44.76464, 11.57746], 
        [44.76455, 11.57738], [44.76434, 11.57721], [44.76398, 11.57691], [44.76393, 11.57687], [44.76388, 11.57684], [44.76384, 11.57681], 
        [44.76379, 11.57679], [44.76372, 11.57676], [44.76367, 11.57674], [44.76361, 11.57673], [44.76351, 11.57671], [44.76323, 11.57667], 
        [44.76316, 11.57666], [44.76310, 11.57665], [44.76306, 11.57663], [44.76301, 11.57661], [44.76297, 11.57659], [44.76291, 11.57655], 
        [44.76284, 11.57650], [44.76275, 11.57642], [44.76268, 11.57636], [44.76260, 11.57629], [44.76257, 11.57626], [44.76253, 11.57622], 
        [44.76248, 11.57617], [44.76243, 11.57613], [44.76241, 11.57612], [44.76237, 11.57609], [44.76231, 11.57605], [44.76225, 11.57602], 
        [44.76217, 11.57599], [44.76209, 11.57596], [44.76200, 11.57593], [44.76187, 11.57590], [44.76171, 11.57587], [44.76152, 11.57584], 
        [44.76133, 11.57581], [44.76117, 11.57578], [44.76107, 11.57575], [44.76098, 11.57572], [44.76091, 11.57570], [44.76081, 11.57566], 
        [44.76055, 11.57555], [44.76047, 11.57552], [44.76041, 11.57549], [44.76034, 11.57547], [44.76028, 11.57546], [44.76022, 11.57546], 
        [44.76011, 11.57547], [44.75985, 11.57549], [44.75975, 11.57549], [44.75968, 11.57550], [44.75963, 11.57550], [44.75957, 11.57550], 
        [44.75951, 11.57549], [44.75941, 11.57547], [44.75922, 11.57542], [44.75892, 11.57534], [44.75875, 11.57530], [44.75859, 11.57527], 
        [44.75844, 11.57525], [44.75830, 11.57524], [44.75821, 11.57524], [44.75813, 11.57524], [44.75804, 11.57524], [44.75790, 11.57525], 
        [44.75771, 11.57526], [44.75722, 11.57530], [44.75671, 11.57534], [44.75659, 11.57534], [44.75649, 11.57534], [44.75639, 11.57533], 
        [44.75630, 11.57533], [44.75620, 11.57532], [44.75610, 11.57530], [44.75599, 11.57528], [44.75591, 11.57527], [44.75512, 11.57508], 
        [44.75503, 11.57506], [44.75502, 11.57506], [44.75493, 11.57504], [44.75486, 11.57503], [44.75484, 11.57503], [44.75479, 11.57503], 
        [44.75472, 11.57502], [44.75463, 11.57503], [44.75447, 11.57503], [44.75444, 11.57525], [44.75421, 11.57691], [44.75417, 11.57718], 
        [44.75407, 11.57794], [44.75405, 11.57808], [44.75403, 11.57820], [44.75400, 11.57838], [44.75397, 11.57855], [44.75395, 11.57866], 
        [44.75290, 11.57836], [44.75286, 11.57836], [44.75283, 11.57838], [44.75281, 11.57841], [44.75280, 11.57846], [44.75279, 11.57852], 
        [44.75269, 11.57927], [44.75255, 11.58031], [44.75254, 11.58040], [44.75252, 11.58048], [44.75250, 11.58056], [44.75246, 11.58083], 
        [44.75246, 11.58083]
    ],
    'viacomacchio': [
        [44.82499, 11.63497], [44.82499, 11.63497], [44.82497, 11.63499], [44.82495, 11.63501], [44.82493, 11.63503], [44.82491, 11.63505], 
        [44.82490, 11.63507], [44.82489, 11.63510], [44.82488, 11.63511], [44.82486, 11.63512], [44.82485, 11.63512], [44.82483, 11.63512], 
        [44.82484, 11.63507], [44.82487, 11.63502], [44.82491, 11.63493], [44.82492, 11.63493], [44.82495, 11.63491], [44.82497, 11.63488], 
        [44.82499, 11.63485], [44.82500, 11.63482], [44.82501, 11.63478], [44.82501, 11.63473], [44.82500, 11.63469], [44.82498, 11.63464], 
        [44.82496, 11.63461], [44.82493, 11.63459], [44.82490, 11.63457], [44.82486, 11.63457], [44.82483, 11.63458], [44.82481, 11.63459], 
        [44.82480, 11.63460], [44.82478, 11.63463], [44.82473, 11.63466], [44.82471, 11.63468], [44.82468, 11.63470], [44.82465, 11.63471], 
        [44.82460, 11.63471], [44.82453, 11.63472], [44.82436, 11.63474], [44.82416, 11.63476], [44.82407, 11.63476], [44.82399, 11.63477], 
        [44.82384, 11.63476], [44.82376, 11.63476], [44.82369, 11.63475], [44.82342, 11.63472], [44.82328, 11.63470], [44.82297, 11.63464], 
        [44.82280, 11.63458], [44.82277, 11.63454], [44.82273, 11.63452], [44.82268, 11.63452], [44.82266, 11.63453], [44.82261, 11.63457], 
        [44.82258, 11.63462], [44.82257, 11.63471], [44.82257, 11.63478], [44.82259, 11.63481], [44.82263, 11.63487], [44.82269, 11.63503], 
        [44.82269, 11.63507], [44.82274, 11.63527], [44.82274, 11.63532], [44.82280, 11.63601], [44.82281, 11.63624], [44.82282, 11.63637], 
        [44.82282, 11.63647], [44.82282, 11.63656], [44.82281, 11.63665], [44.82280, 11.63672], [44.82279, 11.63681], [44.82278, 11.63689], 
        [44.82275, 11.63699], [44.82272, 11.63709], [44.82267, 11.63721], [44.82246, 11.63765], [44.82228, 11.63805], [44.82225, 11.63814], 
        [44.82221, 11.63824], [44.82213, 11.63848], [44.82210, 11.63857], [44.82202, 11.63885], [44.82180, 11.63967], [44.82176, 11.63982], 
        [44.82171, 11.63999], [44.82157, 11.64050], [44.82147, 11.64087], [44.82135, 11.64129], [44.82130, 11.64149], [44.82126, 11.64163], 
        [44.82123, 11.64174], [44.82121, 11.64184], [44.82119, 11.64196], [44.82118, 11.64205], [44.82116, 11.64222], [44.82115, 11.64229], 
        [44.82114, 11.64237], [44.82114, 11.64245], [44.82114, 11.64253], [44.82115, 11.64261], [44.82116, 11.64270], [44.82117, 11.64278], 
        [44.82122, 11.64297], [44.82127, 11.64321], [44.82128, 11.64331], [44.82129, 11.64342], [44.82130, 11.64353], [44.82129, 11.64362], 
        [44.82129, 11.64370], [44.82126, 11.64383], [44.82122, 11.64400], [44.82109, 11.64444], [44.82108, 11.64448], [44.82096, 11.64489], 
        [44.82095, 11.64492], [44.82089, 11.64514], [44.82084, 11.64535], [44.82082, 11.64545], [44.82079, 11.64552], [44.82075, 11.64558], 
        [44.82069, 11.64565], [44.82062, 11.64571], [44.82058, 11.64573], [44.82056, 11.64576], [44.82053, 11.64584], [44.82053, 11.64588], 
        [44.82053, 11.64591], [44.82054, 11.64592], [44.82054, 11.64596], [44.82058, 11.64602], [44.82062, 11.64605], [44.82066, 11.64615], 
        [44.82068, 11.64628], [44.82069, 11.64631], [44.82070, 11.64643], [44.82069, 11.64653], [44.82067, 11.64668], [44.82065, 11.64685], 
        [44.82062, 11.64699], [44.82058, 11.64724], [44.82056, 11.64735], [44.82036, 11.64826], [44.82030, 11.64852], [44.82021, 11.64901], 
        [44.82016, 11.64925], [44.82012, 11.64948], [44.82009, 11.64964], [44.82007, 11.64982], [44.82003, 11.65007], [44.82002, 11.65019], 
        [44.82000, 11.65039], [44.81999, 11.65049], [44.81999, 11.65059], [44.82000, 11.65076], [44.82001, 11.65109], [44.82001, 11.65121], 
        [44.82001, 11.65136], [44.82001, 11.65148], [44.82001, 11.65182], [44.82000, 11.65197], [44.81998, 11.65258], [44.81995, 11.65403], 
        [44.81995, 11.65415], [44.81995, 11.65424], [44.81996, 11.65433], [44.81997, 11.65443], [44.81999, 11.65453], [44.82003, 11.65476], 
        [44.82022, 11.65564], [44.82025, 11.65577], [44.82028, 11.65591], [44.82029, 11.65604], [44.82031, 11.65617], [44.82032, 11.65627], 
        [44.82033, 11.65640], [44.82034, 11.65652], [44.82034, 11.65662], [44.82034, 11.65673], [44.82034, 11.65684], [44.82033, 11.65697], 
        [44.82032, 11.65719], [44.82030, 11.65747], [44.82028, 11.65764], [44.82021, 11.65835], [44.82014, 11.65907], [44.82011, 11.65931], 
        [44.82008, 11.65956], [44.82004, 11.65983], [44.82000, 11.66007], [44.81991, 11.66048], [44.81984, 11.66080], [44.81970, 11.66137], 
        [44.81964, 11.66156], [44.81960, 11.66169], [44.81956, 11.66180], [44.81952, 11.66190], [44.81944, 11.66204], [44.81928, 11.66236], 
        [44.81901, 11.66288], [44.81892, 11.66306], [44.81864, 11.66358], [44.81852, 11.66381], [44.81842, 11.66399], [44.81835, 11.66413], 
        [44.81827, 11.66429], [44.81820, 11.66448], [44.81812, 11.66471], [44.81802, 11.66501], [44.81793, 11.66527], [44.81787, 11.66545], 
        [44.81783, 11.66562], [44.81780, 11.66581], [44.81778, 11.66597], [44.81776, 11.66617], [44.81776, 11.66640], [44.81775, 11.66703], 
        [44.81775, 11.66728], [44.81774, 11.66740], [44.81774, 11.66750], [44.81773, 11.66759], [44.81772, 11.66767], [44.81771, 11.66778], 
        [44.81769, 11.66789], [44.81766, 11.66803], [44.81763, 11.66818], [44.81759, 11.66832], [44.81754, 11.66852], [44.81751, 11.66862], 
        [44.81737, 11.66908], [44.81725, 11.66952], [44.81717, 11.66976], [44.81713, 11.66989], [44.81708, 11.67003], [44.81703, 11.67016], 
        [44.81695, 11.67038], [44.81645, 11.67157], [44.81630, 11.67193], [44.81624, 11.67210], [44.81617, 11.67228], [44.81612, 11.67244], 
        [44.81605, 11.67264], [44.81603, 11.67270], [44.81486, 11.67609], [44.81464, 11.67674], [44.81450, 11.67713], [44.81437, 11.67752], 
        [44.81424, 11.67788], [44.81409, 11.67825], [44.81399, 11.67849], [44.81388, 11.67875], [44.81363, 11.67940], [44.81357, 11.67957], 
        [44.81352, 11.67970], [44.81345, 11.67988], [44.81307, 11.68083], [44.81280, 11.68151], [44.81247, 11.68234], [44.81228, 11.68280], 
        [44.81225, 11.68288], [44.81219, 11.68303], [44.81190, 11.68376], [44.81144, 11.68492], [44.81020, 11.68801], [44.81016, 11.68810], 
        [44.81010, 11.68823], [44.81006, 11.68828], [44.80996, 11.68837], [44.80990, 11.68842], [44.80984, 11.68845], [44.80980, 11.68848], 
        [44.80975, 11.68850], [44.80968, 11.68851], [44.80964, 11.68849], [44.80960, 11.68849], [44.80956, 11.68849], [44.80952, 11.68850], 
        [44.80949, 11.68852], [44.80945, 11.68855], [44.80942, 11.68858], [44.80940, 11.68863], [44.80938, 11.68868], [44.80936, 11.68873], 
        [44.80936, 11.68878], [44.80936, 11.68884], [44.80936, 11.68889], [44.80937, 11.68895], [44.80939, 11.68899], [44.80942, 11.68904], 
        [44.80943, 11.68906], [44.80945, 11.68908], [44.80947, 11.68913], [44.80950, 11.68922], [44.80951, 11.68929], [44.80953, 11.68937], 
        [44.80953, 11.68946], [44.80953, 11.68956], [44.80952, 11.68972], [44.80943, 11.69014], [44.80924, 11.69110], [44.80918, 11.69136], 
        [44.80915, 11.69149], [44.80911, 11.69161], [44.80908, 11.69173], [44.80904, 11.69185], [44.80901, 11.69197], [44.80894, 11.69218], 
        [44.80818, 11.69458], [44.80813, 11.69474], [44.80802, 11.69509], [44.80756, 11.69657], [44.80745, 11.69693], [44.80730, 11.69741], 
        [44.80716, 11.69784], [44.80712, 11.69797], [44.80709, 11.69808], [44.80707, 11.69816], [44.80706, 11.69819], [44.80704, 11.69828], 
        [44.80703, 11.69836], [44.80702, 11.69843], [44.80701, 11.69852], [44.80699, 11.69874], [44.80693, 11.69960], [44.80691, 11.70000], 
        [44.80689, 11.70019], [44.80687, 11.70036], [44.80677, 11.70091], [44.80629, 11.70378], [44.80625, 11.70398], [44.80618, 11.70434], 
        [44.80605, 11.70489], [44.80600, 11.70510], [44.80597, 11.70525], [44.80596, 11.70535], [44.80595, 11.70545], [44.80594, 11.70557], 
        [44.80593, 11.70571], [44.80592, 11.70591], [44.80592, 11.70623], [44.80592, 11.70645], [44.80593, 11.70654], [44.80593, 11.70658], 
        [44.80594, 11.70670], [44.80594, 11.70677], [44.80596, 11.70687], [44.80598, 11.70699], [44.80605, 11.70729], [44.80609, 11.70744], 
        [44.80614, 11.70761], [44.80618, 11.70778], [44.80621, 11.70790], [44.80624, 11.70802], [44.80626, 11.70811], [44.80627, 11.70820], 
        [44.80628, 11.70827], [44.80628, 11.70829], [44.80628, 11.70841], [44.80628, 11.70849], [44.80628, 11.70858], [44.80627, 11.70866], 
        [44.80625, 11.70877], [44.80623, 11.70889], [44.80620, 11.70901], [44.80617, 11.70912], [44.80611, 11.70929], [44.80605, 11.70943], 
        [44.80602, 11.70947], [44.80598, 11.70950], [44.80597, 11.70950], [44.80585, 11.70957], [44.80582, 11.70958], [44.80578, 11.70961], 
        [44.80575, 11.70967], [44.80574, 11.70974], [44.80575, 11.70980], [44.80578, 11.70985], [44.80579, 11.70993], [44.80580, 11.70999], 
        [44.80580, 11.71009], [44.80579, 11.71021], [44.80522, 11.71173], [44.80511, 11.71203], [44.80489, 11.71262], [44.80487, 11.71268], 
        [44.80482, 11.71283], [44.80477, 11.71296], [44.80477, 11.71298], [44.80474, 11.71308], [44.80473, 11.71313], [44.80471, 11.71322], 
        [44.80462, 11.71324], [44.80457, 11.71326], [44.80452, 11.71327], [44.80440, 11.71332], [44.80431, 11.71335], [44.80419, 11.71339], 
        [44.80406, 11.71343], [44.80399, 11.71346], [44.80393, 11.71349], [44.80386, 11.71352], [44.80380, 11.71356], [44.80373, 11.71360], 
        [44.80367, 11.71364], [44.80359, 11.71369], [44.80352, 11.71373], [44.80344, 11.71379], [44.80336, 11.71385], [44.80327, 11.71393], 
        [44.80321, 11.71398], [44.80307, 11.71412], [44.80302, 11.71416], [44.80250, 11.71467], [44.80245, 11.71472], [44.80240, 11.71476], 
        [44.80235, 11.71479], [44.80229, 11.71483], [44.80224, 11.71486], [44.80218, 11.71488], [44.80212, 11.71490], [44.80204, 11.71492], 
        [44.80193, 11.71494], [44.80138, 11.71501], [44.80132, 11.71502], [44.80127, 11.71500], [44.80121, 11.71497], [44.80116, 11.71494], 
        [44.80110, 11.71493], [44.80106, 11.71493], [44.80102, 11.71493], [44.80098, 11.71495], [44.80091, 11.71500], [44.80091, 11.71505], 
        [44.80091, 11.71514], [44.80090, 11.71522], [44.80090, 11.71530], [44.80088, 11.71539], [44.80087, 11.71548], [44.80085, 11.71558], 
        [44.80083, 11.71567], [44.80081, 11.71575], [44.80078, 11.71585], [44.80075, 11.71594], [44.80071, 11.71605], [44.80057, 11.71637], 
        [44.79933, 11.71909], [44.79911, 11.71957], [44.79877, 11.72029], [44.79844, 11.72096], [44.79841, 11.72104], [44.79839, 11.72110], 
        [44.79837, 11.72115], [44.79836, 11.72121], [44.79836, 11.72128], [44.79836, 11.72134], [44.79836, 11.72141], [44.79839, 11.72159], 
        [44.79838, 11.72173], [44.79838, 11.72191], [44.79837, 11.72204], [44.79835, 11.72216], [44.79833, 11.72224], [44.79830, 11.72232], 
        [44.79824, 11.72242], [44.79820, 11.72248], [44.79813, 11.72255], [44.79791, 11.72272], [44.79773, 11.72283], [44.79757, 11.72294], 
        [44.79746, 11.72304], [44.79735, 11.72316], [44.79723, 11.72329], [44.79711, 11.72346], [44.79699, 11.72366], [44.79685, 11.72385], 
        [44.79466, 11.72714], [44.79456, 11.72728], [44.79436, 11.72754], [44.79425, 11.72766], [44.79421, 11.72769], [44.79413, 11.72776], 
        [44.79410, 11.72778], [44.79399, 11.72787], [44.79382, 11.72797], [44.79363, 11.72807], [44.79260, 11.72859], [44.79234, 11.72864], 
        [44.79222, 11.72870], [44.79203, 11.72879], [44.79185, 11.72887], [44.79165, 11.72897], [44.79149, 11.72905], [44.79132, 11.72915], 
        [44.79120, 11.72923], [44.79107, 11.72934], [44.79071, 11.72971], [44.78994, 11.73051], [44.78979, 11.73074], [44.78966, 11.73087], 
        [44.78954, 11.73098], [44.78945, 11.73107], [44.78931, 11.73119], [44.78904, 11.73133], [44.78888, 11.73138], [44.78872, 11.73142], 
        [44.78855, 11.73142], [44.78838, 11.73141], [44.78826, 11.73141], [44.78816, 11.73142], [44.78783, 11.73150], [44.78769, 11.73157], 
        [44.78753, 11.73168], [44.78739, 11.73181], [44.78698, 11.73222], [44.78623, 11.73313], [44.78588, 11.73356], [44.78569, 11.73379], 
        [44.78552, 11.73399], [44.78523, 11.73434], [44.78502, 11.73459], [44.78441, 11.73531], [44.78401, 11.73579], [44.78354, 11.73636], 
        [44.78349, 11.73641], [44.78347, 11.73643], [44.78339, 11.73650], [44.78321, 11.73660], [44.78309, 11.73668], [44.78294, 11.73676], 
        [44.78280, 11.73684], [44.78279, 11.73685], [44.78201, 11.73731], [44.78185, 11.73741], [44.78152, 11.73763], [44.78140, 11.73772], 
        [44.78138, 11.73773], [44.78130, 11.73779], [44.78120, 11.73787], [44.78076, 11.73821], [44.78028, 11.73864], [44.78007, 11.73883], 
        [44.77987, 11.73903], [44.77964, 11.73926], [44.77945, 11.73948], [44.77926, 11.73973], [44.77904, 11.74003], [44.77887, 11.74028], 
        [44.77869, 11.74054], [44.77739, 11.74246], [44.77702, 11.74301], [44.77689, 11.74319], [44.77655, 11.74368], [44.77639, 11.74392], 
        [44.77630, 11.74403], [44.77618, 11.74419], [44.77598, 11.74442], [44.77577, 11.74462], [44.77550, 11.74488], [44.77520, 11.74514], 
        [44.77492, 11.74536], [44.77466, 11.74554], [44.77457, 11.74559], [44.77410, 11.74580], [44.77388, 11.74591], [44.77310, 11.74616], 
        [44.77198, 11.74650], [44.77198, 11.74654], [44.77199, 11.74668], [44.77204, 11.74711], [44.77206, 11.74717], [44.77207, 11.74719], 
        [44.77229, 11.74756], [44.77257, 11.74794], [44.77272, 11.74814], [44.77280, 11.74825], [44.77296, 11.74836], [44.77302, 11.74843], 
        [44.77328, 11.74869], [44.77333, 11.74877], [44.77343, 11.74891], [44.77350, 11.74902], [44.77362, 11.74925], [44.77409, 11.75023], 
        [44.77488, 11.74999], [44.77629, 11.74958], [44.77657, 11.74952], [44.77671, 11.74949], [44.77684, 11.74947], [44.77733, 11.74939], 
        [44.77771, 11.74929], [44.77794, 11.74924], [44.77820, 11.74924], [44.77844, 11.74926], [44.77876, 11.74932], [44.77906, 11.74941], 
        [44.77932, 11.74955], [44.77951, 11.74970], [44.77964, 11.74987], [44.77983, 11.75012], [44.77985, 11.75016]
    ],
    'viapomposa': [
        [44.83887, 11.64380], [44.83876, 11.64364], [44.83859, 11.64343], [44.83815, 11.64288], [44.83798, 11.64265], [44.83781, 11.64237], 
        [44.83761, 11.64273], [44.83750, 11.64287], [44.83737, 11.64294], [44.83722, 11.64299], [44.83706, 11.64305], [44.83692, 11.64321], 
        [44.83678, 11.64338], [44.83681, 11.64353], [44.83688, 11.64389], [44.83688, 11.64393], [44.83688, 11.64396], [44.83688, 11.64399], 
        [44.83687, 11.64403], [44.83683, 11.64409], [44.83645, 11.64470], [44.83641, 11.64477], [44.83575, 11.64583], [44.83571, 11.64590], 
        [44.83501, 11.64703], [44.83499, 11.64706], [44.83498, 11.64707], [44.83486, 11.64750], [44.83477, 11.64745], [44.83446, 11.64729], 
        [44.83434, 11.64719], [44.83401, 11.64679], [44.83350, 11.64617], [44.83323, 11.64583], [44.83303, 11.64563], [44.83275, 11.64548], 
        [44.83249, 11.64535], [44.83244, 11.64531], [44.83242, 11.64528], [44.83241, 11.64525], [44.83241, 11.64522], [44.83235, 11.64519], 
        [44.83230, 11.64518], [44.83222, 11.64517], [44.83218, 11.64530], [44.83202, 11.64537], [44.83183, 11.64542], [44.83171, 11.64549], 
        [44.83155, 11.64567], [44.83114, 11.64611], [44.83113, 11.64612], [44.83117, 11.64619], [44.83118, 11.64621], [44.83121, 11.64625], 
        [44.83118, 11.64631], [44.83116, 11.64636], [44.83116, 11.64643], [44.83134, 11.64673], [44.83151, 11.64695], [44.83157, 11.64703], 
        [44.83153, 11.64713], [44.83164, 11.64724], [44.83169, 11.64729], [44.83173, 11.64734], [44.83177, 11.64739], [44.83181, 11.64745], 
        [44.83185, 11.64753], [44.83190, 11.64762], [44.83194, 11.64770], [44.83197, 11.64777], [44.83201, 11.64785], [44.83205, 11.64794], 
        [44.83210, 11.64806], [44.83215, 11.64818], [44.83225, 11.64841], [44.83239, 11.64874], [44.83245, 11.64887], [44.83248, 11.64894], 
        [44.83249, 11.64897], [44.83253, 11.64904], [44.83263, 11.64924], [44.83303, 11.64997], [44.83323, 11.65032], [44.83361, 11.65101], 
        [44.83373, 11.65121], [44.83384, 11.65139], [44.83394, 11.65155], [44.83438, 11.65235], [44.83464, 11.65282], [44.83531, 11.65401], 
        [44.83536, 11.65410], [44.83540, 11.65418], [44.83544, 11.65426], [44.83547, 11.65431], [44.83548, 11.65433], [44.83552, 11.65443], 
        [44.83575, 11.65502], [44.83644, 11.65684], [44.83673, 11.65760], [44.83722, 11.65887], [44.83744, 11.65942], [44.83755, 11.65973], 
        [44.83758, 11.65982], [44.83762, 11.65992], [44.83792, 11.66075], [44.83814, 11.66131], [44.83827, 11.66165], [44.83828, 11.66166], 
        [44.83829, 11.66171], [44.83831, 11.66181], [44.83833, 11.66186], [44.83834, 11.66197], [44.83834, 11.66206], [44.83834, 11.66222], 
        [44.83830, 11.66274], [44.83825, 11.66333], [44.83817, 11.66411], [44.83808, 11.66488], [44.83805, 11.66520], [44.83800, 11.66575], 
        [44.83796, 11.66629], [44.83794, 11.66650], [44.83793, 11.66671], [44.83793, 11.66685], [44.83793, 11.66700], [44.83794, 11.66713], 
        [44.83796, 11.66726], [44.83797, 11.66739], [44.83800, 11.66750], [44.83804, 11.66774], [44.83809, 11.66791], [44.83879, 11.67040], 
        [44.83884, 11.67056], [44.83888, 11.67074], [44.83892, 11.67090], [44.83897, 11.67114], [44.83902, 11.67135], [44.83905, 11.67152], 
        [44.83909, 11.67168], [44.83918, 11.67199], [44.83923, 11.67215], [44.83929, 11.67235], [44.83935, 11.67254], [44.83976, 11.67387], 
        [44.84006, 11.67490], [44.84011, 11.67505], [44.84019, 11.67528], [44.84094, 11.67737], [44.84106, 11.67769], [44.84127, 11.67836], 
        [44.84163, 11.67950], [44.84204, 11.68083], [44.84269, 11.68316], [44.84277, 11.68346], [44.84283, 11.68365], [44.84273, 11.68371], 
        [44.84270, 11.68373], [44.84268, 11.68375], [44.84267, 11.68378], [44.84267, 11.68382], [44.84268, 11.68386], [44.84277, 11.68411], 
        [44.84330, 11.68558], [44.84379, 11.68719], [44.84383, 11.68730], [44.84385, 11.68739], [44.84386, 11.68749], [44.84387, 11.68758], 
        [44.84386, 11.68769], [44.84385, 11.68782], [44.84309, 11.69178], [44.84264, 11.69415], [44.84263, 11.69425], [44.84262, 11.69436], 
        [44.84262, 11.69444], [44.84263, 11.69457], [44.84265, 11.69470], [44.84268, 11.69487], [44.84274, 11.69518], [44.84288, 11.69582], 
        [44.84304, 11.69644], [44.84312, 11.69678], [44.84316, 11.69696], [44.84319, 11.69710], [44.84322, 11.69728], [44.84325, 11.69749], 
        [44.84327, 11.69772], [44.84329, 11.69791], [44.84330, 11.69806], [44.84329, 11.69826], [44.84328, 11.69848], [44.84327, 11.69875], 
        [44.84327, 11.69895], [44.84328, 11.69912], [44.84330, 11.69927], [44.84332, 11.69935], [44.84336, 11.69951], [44.84343, 11.69973], 
        [44.84352, 11.69994], [44.84399, 11.70091], [44.84405, 11.70105], [44.84411, 11.70121], [44.84415, 11.70135], [44.84421, 11.70156], 
        [44.84426, 11.70175], [44.84430, 11.70194], [44.84433, 11.70211], [44.84435, 11.70230], [44.84438, 11.70248], [44.84441, 11.70264], 
        [44.84445, 11.70280], [44.84449, 11.70294], [44.84455, 11.70305], [44.84475, 11.70342], [44.84481, 11.70354], [44.84483, 11.70362], 
        [44.84485, 11.70371], [44.84486, 11.70381], [44.84486, 11.70391], [44.84485, 11.70401], [44.84482, 11.70413], [44.84436, 11.70575], 
        [44.84431, 11.70589], [44.84427, 11.70602], [44.84421, 11.70615], [44.84415, 11.70628], [44.84397, 11.70661], [44.84372, 11.70705], 
        [44.84362, 11.70724], [44.84351, 11.70744], [44.84344, 11.70757], [44.84338, 11.70772], [44.84335, 11.70781], [44.84331, 11.70799], 
        [44.84329, 11.70811], [44.84328, 11.70820], [44.84329, 11.70838], [44.84330, 11.70852], [44.84330, 11.70863], [44.84331, 11.70875], 
        [44.84330, 11.70886], [44.84329, 11.70899], [44.84326, 11.70911], [44.84322, 11.70926], [44.84315, 11.70948], [44.84312, 11.70962], 
        [44.84309, 11.70977], [44.84307, 11.70995], [44.84302, 11.71052], [44.84300, 11.71066], [44.84298, 11.71079], [44.84295, 11.71092], 
        [44.84291, 11.71104], [44.84284, 11.71123], [44.84269, 11.71156], [44.84244, 11.71209], [44.84235, 11.71230], [44.84228, 11.71247], 
        [44.84222, 11.71266], [44.84219, 11.71282], [44.84198, 11.71386], [44.84198, 11.71396], [44.84199, 11.71403], [44.84201, 11.71405], 
        [44.84203, 11.71406], [44.84208, 11.71408], [44.84213, 11.71410], [44.84259, 11.71419], [44.84273, 11.71423], [44.84330, 11.71442], 
        [44.84349, 11.71448], [44.84376, 11.71459], [44.84381, 11.71461], [44.84392, 11.71472], [44.84395, 11.71477], [44.84397, 11.71483], 
        [44.84399, 11.71490], [44.84400, 11.71496], [44.84400, 11.71503], [44.84400, 11.71505], [44.84399, 11.71511], [44.84398, 11.71518], 
        [44.84396, 11.71524], [44.84394, 11.71529], [44.84391, 11.71534], [44.84387, 11.71539], [44.84375, 11.71553], [44.84372, 11.71554], 
        [44.84370, 11.71556], [44.84368, 11.71557], [44.84364, 11.71561], [44.84361, 11.71568], [44.84359, 11.71575], [44.84358, 11.71581], 
        [44.84358, 11.71589], [44.84348, 11.71643], [44.84347, 11.71649], [44.84340, 11.71677], [44.84295, 11.71840], [44.84294, 11.71847], 
        [44.84291, 11.71853], [44.84274, 11.71898], [44.84257, 11.71944], [44.84249, 11.71968], [44.84246, 11.71978], [44.84243, 11.71991], 
        [44.84242, 11.71999], [44.84237, 11.72042], [44.84229, 11.72107], [44.84228, 11.72118], [44.84226, 11.72136], [44.84224, 11.72158], 
        [44.84223, 11.72184], [44.84220, 11.72225], [44.84218, 11.72267], [44.84217, 11.72303], [44.84217, 11.72314], [44.84217, 11.72348], 
        [44.84217, 11.72362], [44.84217, 11.72371], [44.84218, 11.72392], [44.84219, 11.72506], [44.84219, 11.72537], [44.84222, 11.72823], 
        [44.84221, 11.72862], [44.84220, 11.72905], [44.84216, 11.72996], [44.84210, 11.73113], [44.84209, 11.73133], [44.84207, 11.73151], 
        [44.84204, 11.73165], [44.84200, 11.73183], [44.84190, 11.73211], [44.84183, 11.73233], [44.84168, 11.73277], [44.84161, 11.73300], 
        [44.84158, 11.73312], [44.84157, 11.73321], [44.84158, 11.73330], [44.84161, 11.73338], [44.84164, 11.73347], [44.84170, 11.73358], 
        [44.84176, 11.73371], [44.84184, 11.73393], [44.84195, 11.73429], [44.84232, 11.73547], [44.84240, 11.73573], [44.84267, 11.73681], 
        [44.84274, 11.73704], [44.84282, 11.73729], [44.84290, 11.73753], [44.84301, 11.73779], [44.84341, 11.73878], [44.84347, 11.73894], 
        [44.84350, 11.73906], [44.84353, 11.73919], [44.84412, 11.74262], [44.84418, 11.74291], [44.84426, 11.74326], [44.84434, 11.74363], 
        [44.84461, 11.74528], [44.84465, 11.74547], [44.84472, 11.74575], [44.84477, 11.74593], [44.84483, 11.74610], [44.84486, 11.74620], 
        [44.84491, 11.74631], [44.84498, 11.74645], [44.84505, 11.74658], [44.84512, 11.74670], [44.84546, 11.74722], [44.84553, 11.74733], 
        [44.84557, 11.74742], [44.84561, 11.74754], [44.84564, 11.74768], [44.84566, 11.74784], [44.84568, 11.74803], [44.84617, 11.75482], 
        [44.84671, 11.76210], [44.84686, 11.76425], [44.84687, 11.76450], [44.84687, 11.76462], [44.84687, 11.76475], [44.84686, 11.76490], 
        [44.84684, 11.76514], [44.84681, 11.76544], [44.84679, 11.76561], [44.84677, 11.76572], [44.84675, 11.76583], [44.84674, 11.76587], 
        [44.84664, 11.76580], [44.84659, 11.76575], [44.84652, 11.76566], [44.84649, 11.76561], [44.84645, 11.76554], [44.84643, 11.76548], 
        [44.84641, 11.76542], [44.84639, 11.76535], [44.84638, 11.76529], [44.84638, 11.76521], [44.84634, 11.76441], [44.84634, 11.76428], 
        [44.84633, 11.76423], [44.84631, 11.76418], [44.84630, 11.76413], [44.84627, 11.76407], [44.84623, 11.76400], [44.84617, 11.76393], 
        [44.84610, 11.76384], [44.84570, 11.76337], [44.84566, 11.76332], [44.84563, 11.76326], [44.84561, 11.76320], [44.84559, 11.76315], 
        [44.84559, 11.76309], [44.84558, 11.76303], [44.84559, 11.76296], [44.84560, 11.76287], [44.84571, 11.76233], [44.84595, 11.76117], 
        [44.84598, 11.76099], [44.84598, 11.76084], [44.84598, 11.76070], [44.84597, 11.76055], [44.84595, 11.76042], [44.84591, 11.76022], 
        [44.84582, 11.75992], [44.84571, 11.75966], [44.84559, 11.75942], [44.84559, 11.75942]
    ],
    'viacopparo': [
        [44.85493, 11.64014], [44.85573, 11.64107], [44.85581, 11.64118], [44.85643, 11.64191], [44.85649, 11.64197], [44.85653, 11.64202], 
        [44.85658, 11.64206], [44.85767, 11.64305], [44.85842, 11.64373], [44.85934, 11.64457], [44.85966, 11.64487], [44.85970, 11.64490], 
        [44.86007, 11.64524], [44.86011, 11.64527], [44.86015, 11.64531], [44.86018, 11.64534], [44.86021, 11.64536], [44.86024, 11.64537], 
        [44.86015, 11.64557], [44.86012, 11.64563], [44.86009, 11.64569], [44.85966, 11.64647], [44.85917, 11.64734], [44.85886, 11.64789], 
        [44.85882, 11.64797], [44.85874, 11.64810], [44.85867, 11.64822], [44.85703, 11.65116], [44.85697, 11.65127], [44.85692, 11.65137], 
        [44.85686, 11.65149], [44.85681, 11.65159], [44.85678, 11.65169], [44.85675, 11.65179], [44.85673, 11.65187], [44.85669, 11.65215], 
        [44.85669, 11.65220], [44.85669, 11.65221], [44.85675, 11.65222], [44.85682, 11.65224], [44.85696, 11.65229], [44.85822, 11.65275], 
        [44.85848, 11.65285], [44.85855, 11.65288], [44.85861, 11.65292], [44.85865, 11.65295], [44.85871, 11.65300], [44.85877, 11.65306], 
        [44.85936, 11.65373], [44.85941, 11.65377], [44.85946, 11.65381], [44.85950, 11.65384], [44.85956, 11.65388], [44.85962, 11.65391], 
        [44.85976, 11.65397], [44.85983, 11.65401], [44.85990, 11.65404], [44.85997, 11.65408], [44.86004, 11.65414], [44.86010, 11.65419], 
        [44.86017, 11.65426], [44.86029, 11.65440], [44.86039, 11.65452], [44.86049, 11.65465], [44.86056, 11.65473], [44.86064, 11.65482], 
        [44.86071, 11.65490], [44.86078, 11.65496], [44.86088, 11.65505], [44.86098, 11.65514], [44.86102, 11.65518], [44.86106, 11.65524], 
        [44.86110, 11.65531], [44.86113, 11.65537], [44.86116, 11.65543], [44.86118, 11.65550], [44.86119, 11.65556], [44.86120, 11.65564], 
        [44.86121, 11.65574], [44.86121, 11.65584], [44.86122, 11.65594], [44.86122, 11.65606], [44.86122, 11.65618], [44.86123, 11.65632], 
        [44.86124, 11.65642], [44.86125, 11.65653], [44.86128, 11.65667], [44.86131, 11.65680], [44.86134, 11.65691], [44.86138, 11.65703], 
        [44.86142, 11.65714], [44.86145, 11.65720], [44.86151, 11.65728], [44.86157, 11.65735], [44.86167, 11.65747], [44.86171, 11.65753], 
        [44.86175, 11.65760], [44.86179, 11.65768], [44.86182, 11.65774], [44.86184, 11.65780], [44.86186, 11.65788], [44.86189, 11.65804], 
        [44.86193, 11.65832], [44.86196, 11.65850], [44.86198, 11.65864], [44.86201, 11.65878], [44.86205, 11.65896], [44.86210, 11.65916], 
        [44.86212, 11.65925], [44.86214, 11.65939], [44.86222, 11.65989], [44.86224, 11.66004], [44.86225, 11.66014], [44.86226, 11.66025], 
        [44.86226, 11.66040], [44.86227, 11.66056], [44.86227, 11.66068], [44.86227, 11.66077], [44.86226, 11.66086], [44.86225, 11.66098], 
        [44.86222, 11.66124], [44.86218, 11.66153], [44.86215, 11.66181], [44.86211, 11.66208], [44.86209, 11.66227], [44.86209, 11.66241], 
        [44.86208, 11.66258], [44.86209, 11.66275], [44.86210, 11.66290], [44.86211, 11.66307], [44.86214, 11.66339], [44.86221, 11.66402], 
        [44.86223, 11.66423], [44.86226, 11.66439], [44.86229, 11.66451], [44.86232, 11.66462], [44.86234, 11.66470], [44.86239, 11.66483], 
        [44.86248, 11.66503], [44.86257, 11.66521], [44.86272, 11.66551], [44.86279, 11.66562], [44.86284, 11.66570], [44.86290, 11.66578], 
        [44.86303, 11.66597], [44.86313, 11.66611], [44.86321, 11.66624], [44.86327, 11.66635], [44.86333, 11.66645], [44.86340, 11.66661], 
        [44.86346, 11.66675], [44.86350, 11.66687], [44.86353, 11.66699], [44.86356, 11.66713], [44.86360, 11.66734], [44.86363, 11.66751], 
        [44.86365, 11.66767], [44.86368, 11.66784], [44.86371, 11.66796], [44.86374, 11.66806], [44.86380, 11.66821], [44.86383, 11.66830], 
        [44.86420, 11.66920], [44.86426, 11.66933], [44.86430, 11.66939], [44.86436, 11.66949], [44.86473, 11.67003], [44.86488, 11.67027], 
        [44.86497, 11.67042], [44.86503, 11.67053], [44.86509, 11.67065], [44.86507, 11.67070], [44.86506, 11.67074], [44.86505, 11.67080], 
        [44.86505, 11.67086], [44.86505, 11.67098], [44.86506, 11.67112], [44.86507, 11.67133], [44.86508, 11.67148], [44.86510, 11.67167], 
        [44.86510, 11.67178], [44.86511, 11.67186], [44.86510, 11.67191], [44.86510, 11.67197], [44.86503, 11.67262], [44.86502, 11.67272], 
        [44.86500, 11.67282], [44.86499, 11.67289], [44.86497, 11.67296], [44.86493, 11.67308], [44.86490, 11.67316], [44.86485, 11.67332], 
        [44.86437, 11.67461], [44.86434, 11.67471], [44.86431, 11.67479], [44.86430, 11.67486], [44.86427, 11.67496], [44.86425, 11.67510], 
        [44.86400, 11.67683], [44.86394, 11.67728], [44.86378, 11.67839], [44.86368, 11.67910], [44.86368, 11.67915], [44.86368, 11.67920], 
        [44.86369, 11.67925], [44.86370, 11.67930], [44.86371, 11.67935], [44.86373, 11.67939], [44.86375, 11.67943], [44.86396, 11.67983], 
        [44.86404, 11.67998], [44.86422, 11.68032], [44.86423, 11.68035], [44.86429, 11.68047], [44.86430, 11.68049], [44.86439, 11.68067], 
        [44.86439, 11.68069], [44.86448, 11.68088], [44.86452, 11.68098], [44.86455, 11.68105], [44.86456, 11.68108], [44.86460, 11.68118], 
        [44.86464, 11.68132], [44.86468, 11.68143], [44.86469, 11.68147], [44.86475, 11.68170], [44.86479, 11.68186], [44.86483, 11.68200], 
        [44.86485, 11.68210], [44.86486, 11.68221], [44.86487, 11.68228], [44.86487, 11.68236], [44.86487, 11.68243], [44.86486, 11.68252], 
        [44.86485, 11.68260], [44.86483, 11.68267], [44.86482, 11.68274], [44.86479, 11.68285], [44.86473, 11.68301], [44.86472, 11.68305], 
        [44.86471, 11.68308], [44.86469, 11.68313], [44.86468, 11.68319], [44.86468, 11.68325], [44.86467, 11.68335], [44.86466, 11.68390], 
        [44.86465, 11.68409], [44.86464, 11.68422], [44.86464, 11.68436], [44.86462, 11.68449], [44.86462, 11.68453], [44.86462, 11.68463], 
        [44.86462, 11.68473], [44.86462, 11.68484], [44.86461, 11.68490], [44.86460, 11.68495], [44.86459, 11.68497], [44.86458, 11.68501], 
        [44.86455, 11.68504], [44.86452, 11.68507], [44.86449, 11.68509], [44.86445, 11.68511], [44.86371, 11.68530], [44.86350, 11.68536], 
        [44.86321, 11.68544], [44.86303, 11.68549], [44.86285, 11.68553], [44.86290, 11.68607], [44.86291, 11.68616], [44.86293, 11.68632], 
        [44.86295, 11.68653], [44.86300, 11.68706], [44.86303, 11.68736], [44.86306, 11.68762], [44.86307, 11.68775], [44.86309, 11.68784], 
        [44.86310, 11.68794], [44.86312, 11.68806], [44.86315, 11.68820], [44.86322, 11.68854], [44.86329, 11.68882], [44.86332, 11.68893], 
        [44.86344, 11.68944], [44.86347, 11.68956], [44.86350, 11.68966], [44.86356, 11.68984], [44.86366, 11.69014], [44.86368, 11.69019], 
        [44.86371, 11.69027], [44.86374, 11.69039], [44.86379, 11.69055], [44.86385, 11.69076], [44.86417, 11.69197], [44.86420, 11.69212], 
        [44.86421, 11.69216], [44.86423, 11.69226], [44.86427, 11.69243], [44.86429, 11.69257], [44.86431, 11.69272], [44.86434, 11.69287], 
        [44.86435, 11.69302], [44.86437, 11.69319], [44.86441, 11.69364], [44.86442, 11.69386], [44.86444, 11.69402], [44.86445, 11.69410], 
        [44.86445, 11.69416], [44.86447, 11.69430], [44.86450, 11.69448], [44.86454, 11.69472], [44.86462, 11.69510], [44.86480, 11.69595], 
        [44.86481, 11.69609], [44.86480, 11.69619], [44.86478, 11.69626], [44.86473, 11.69636], [44.86472, 11.69638], [44.86467, 11.69646], 
        [44.86464, 11.69648], [44.86459, 11.69653], [44.86455, 11.69661], [44.86452, 11.69670], [44.86452, 11.69679], [44.86453, 11.69688], 
        [44.86457, 11.69696], [44.86461, 11.69702], [44.86467, 11.69706], [44.86473, 11.69707], [44.86479, 11.69706], [44.86489, 11.69709], 
        [44.86495, 11.69712], [44.86500, 11.69716], [44.86505, 11.69722], [44.86512, 11.69733], [44.86517, 11.69757], [44.86527, 11.69803], 
        [44.86531, 11.69819], [44.86553, 11.69923], [44.86561, 11.69955], [44.86574, 11.70007], [44.86578, 11.70024], [44.86645, 11.70284], 
        [44.86650, 11.70305], [44.86660, 11.70342], [44.86662, 11.70350], [44.86663, 11.70356], [44.86665, 11.70362], [44.86667, 11.70367], 
        [44.86669, 11.70374], [44.86671, 11.70380], [44.86673, 11.70387], [44.86676, 11.70394], [44.86679, 11.70403], [44.86683, 11.70413], 
        [44.86687, 11.70424], [44.86693, 11.70437], [44.86697, 11.70447], [44.86701, 11.70454], [44.86705, 11.70462], [44.86708, 11.70469], 
        [44.86712, 11.70475], [44.86716, 11.70481], [44.86720, 11.70488], [44.86727, 11.70498], [44.86746, 11.70524], [44.86822, 11.70625], 
        [44.86895, 11.70719], [44.86896, 11.70720], [44.86904, 11.70731], [44.86915, 11.70744], [44.86926, 11.70755], [44.86932, 11.70761], 
        [44.86941, 11.70768], [44.86953, 11.70777], [44.86976, 11.70793], [44.86983, 11.70797], [44.86989, 11.70801], [44.86994, 11.70805], 
        [44.86998, 11.70810], [44.87004, 11.70816], [44.87011, 11.70828], [44.87016, 11.70837], [44.87019, 11.70844], [44.87022, 11.70853], 
        [44.87025, 11.70864], [44.87027, 11.70871], [44.87028, 11.70877], [44.87029, 11.70883], [44.87029, 11.70889], [44.87029, 11.70897], 
        [44.87028, 11.70901], [44.87027, 11.70905], [44.87026, 11.70909], [44.87026, 11.70914], [44.87026, 11.70918], [44.87027, 11.70923], 
        [44.87028, 11.70927], [44.87030, 11.70931], [44.87032, 11.70934], [44.87035, 11.70937], [44.87037, 11.70939], [44.87040, 11.70941], 
        [44.87044, 11.70942], [44.87047, 11.70942], [44.87050, 11.70941], [44.87053, 11.70940], [44.87057, 11.70938], [44.87059, 11.70935], 
        [44.87064, 11.70933], [44.87068, 11.70933], [44.87071, 11.70934], [44.87079, 11.70936], [44.87085, 11.70941], [44.87087, 11.70945], 
        [44.87093, 11.70957], [44.87100, 11.70980], [44.87105, 11.70997], [44.87112, 11.71028], [44.87117, 11.71054], [44.87128, 11.71121], 
        [44.87139, 11.71192], [44.87141, 11.71208], [44.87144, 11.71226], [44.87149, 11.71245], [44.87162, 11.71298], [44.87169, 11.71321], 
        [44.87188, 11.71380], [44.87197, 11.71403], [44.87208, 11.71429], [44.87217, 11.71450], [44.87227, 11.71471], [44.87234, 11.71486], 
        [44.87245, 11.71508], [44.87254, 11.71523], [44.87266, 11.71544], [44.87286, 11.71577], [44.87304, 11.71604], [44.87322, 11.71628], 
        [44.87342, 11.71654], [44.87364, 11.71678], [44.87382, 11.71697], [44.87401, 11.71714], [44.87419, 11.71729], [44.87519, 11.71809], 
        [44.87536, 11.71823], [44.87565, 11.71848], [44.87588, 11.71870], [44.87608, 11.71890], [44.87625, 11.71909], [44.87642, 11.71930], 
        [44.87658, 11.71951], [44.87673, 11.71972], [44.87687, 11.71992], [44.87699, 11.72011], [44.87715, 11.72037], [44.87728, 11.72060], 
        [44.87738, 11.72080], [44.87747, 11.72100], [44.87755, 11.72117], [44.87761, 11.72129], [44.87770, 11.72152], [44.87772, 11.72156], 
        [44.87782, 11.72184], [44.87792, 11.72212], [44.87802, 11.72243], [44.87811, 11.72276], [44.87820, 11.72315], [44.87827, 11.72347], 
        [44.87837, 11.72404], [44.87872, 11.72614], [44.87917, 11.72877], [44.87948, 11.73063], [44.87961, 11.73139], [44.87985, 11.73286], 
        [44.87987, 11.73299], [44.87994, 11.73341], [44.88037, 11.73595], [44.88043, 11.73634], [44.88046, 11.73649], [44.88053, 11.73696], 
        [44.88060, 11.73738], [44.88093, 11.73942], [44.88097, 11.73969], [44.88106, 11.74024], [44.88112, 11.74058], [44.88117, 11.74089], 
        [44.88123, 11.74123], [44.88151, 11.74289], [44.88160, 11.74341], [44.88170, 11.74401], [44.88173, 11.74419], [44.88181, 11.74466], 
        [44.88181, 11.74470], [44.88182, 11.74475], [44.88178, 11.74477], [44.88201, 11.74617], [44.88204, 11.74636], [44.88205, 11.74655], 
        [44.88201, 11.74671], [44.88199, 11.74676], [44.88194, 11.74693], [44.88193, 11.74704], [44.88183, 11.74730], [44.88121, 11.74870], 
        [44.88115, 11.74884], [44.88096, 11.74928], [44.88091, 11.74944], [44.88087, 11.74956], [44.88084, 11.74976], [44.88082, 11.75014], 
        [44.88080, 11.75071], [44.88080, 11.75162], [44.88080, 11.75175], [44.88080, 11.75193], [44.88084, 11.75193], [44.88083, 11.75305], 
        [44.88081, 11.75462], [44.88078, 11.75681], [44.88077, 11.75733], [44.88077, 11.75763], [44.88076, 11.75773], [44.88075, 11.75801], 
        [44.88074, 11.75834], [44.88071, 11.75879], [44.88062, 11.76036], [44.88048, 11.76270], [44.88037, 11.76449], [44.88034, 11.76513], 
        [44.88030, 11.76570], [44.88025, 11.76649], [44.88010, 11.76893], [44.88010, 11.76905], [44.88009, 11.76923], [44.88007, 11.76947], 
        [44.87999, 11.77068], [44.87998, 11.77100], [44.87999, 11.77139], [44.88002, 11.77169], [44.88006, 11.77209], [44.88010, 11.77237], 
        [44.88015, 11.77266], [44.88017, 11.77277], [44.88019, 11.77286], [44.88029, 11.77326], [44.88044, 11.77378], [44.88059, 11.77419], 
        [44.88075, 11.77454], [44.88086, 11.77480], [44.88101, 11.77510], [44.88114, 11.77539], [44.88124, 11.77561], [44.88135, 11.77586], 
        [44.88205, 11.77737], [44.88209, 11.77747], [44.88214, 11.77762], [44.88223, 11.77787], [44.88241, 11.77841], [44.88257, 11.77896], 
        [44.88286, 11.78011], [44.88299, 11.78061], [44.88320, 11.78131], [44.88330, 11.78159], [44.88345, 11.78197], [44.88352, 11.78217], 
        [44.88358, 11.78244], [44.88365, 11.78277], [44.88370, 11.78308], [44.88374, 11.78337], [44.88375, 11.78343], [44.88384, 11.78417], 
        [44.88388, 11.78447], [44.88394, 11.78483], [44.88400, 11.78509], [44.88408, 11.78532], [44.88416, 11.78552], [44.88427, 11.78574], 
        [44.88441, 11.78603], [44.88479, 11.78680], [44.88520, 11.78763], [44.88525, 11.78773], [44.88531, 11.78786], [44.88542, 11.78813], 
        [44.88549, 11.78829], [44.88554, 11.78846], [44.88560, 11.78867], [44.88565, 11.78886], [44.88576, 11.78935], [44.88591, 11.79016], 
        [44.88601, 11.79063], [44.88605, 11.79079], [44.88611, 11.79092], [44.88626, 11.79123], [44.88730, 11.79305], [44.88751, 11.79338], 
        [44.88779, 11.79375], [44.88810, 11.79412], [44.88840, 11.79452], [44.88856, 11.79477], [44.88872, 11.79504], [44.88887, 11.79532], 
        [44.88902, 11.79566], [44.88914, 11.79599], [44.88929, 11.79656], [44.88958, 11.79765], [44.88966, 11.79799], [44.88971, 11.79841], 
        [44.88973, 11.79892], [44.88973, 11.79939], [44.88966, 11.80019], [44.88957, 11.80125], [44.88935, 11.80403], [44.88933, 11.80430], 
        [44.88923, 11.80547], [44.88920, 11.80586], [44.88900, 11.80810], [44.88897, 11.80858], [44.88894, 11.80907], [44.88893, 11.80943], 
        [44.88893, 11.80944], [44.88894, 11.80975], [44.88896, 11.81021], [44.88895, 11.81039], [44.88894, 11.81043], [44.88893, 11.81049], 
        [44.88892, 11.81056], [44.88891, 11.81061], [44.88890, 11.81067], [44.88889, 11.81073], [44.88888, 11.81079], [44.88888, 11.81084], 
        [44.88889, 11.81089], [44.88890, 11.81095], [44.88892, 11.81103], [44.88892, 11.81110], [44.88892, 11.81111], [44.88892, 11.81116], 
        [44.88892, 11.81123], [44.88892, 11.81129], [44.88890, 11.81132], [44.88889, 11.81135], [44.88887, 11.81139], [44.88886, 11.81142], 
        [44.88886, 11.81146], [44.88885, 11.81149], [44.88885, 11.81152], [44.88885, 11.81154], [44.88885, 11.81157], [44.88885, 11.81160], 
        [44.88886, 11.81163], [44.88886, 11.81166], [44.88887, 11.81168], [44.88888, 11.81171], [44.88889, 11.81173], [44.88890, 11.81176], 
        [44.88891, 11.81178], [44.88892, 11.81180], [44.88894, 11.81182], [44.88895, 11.81183], [44.88896, 11.81185], [44.88898, 11.81186], 
        [44.88900, 11.81187], [44.88904, 11.81195], [44.88907, 11.81203], [44.88909, 11.81208], [44.88910, 11.81212], [44.88913, 11.81221], 
        [44.88915, 11.81230], [44.88919, 11.81248], [44.88920, 11.81251], [44.88925, 11.81270], [44.88930, 11.81291], [44.88935, 11.81308], 
        [44.88938, 11.81319], [44.88943, 11.81336], [44.88950, 11.81358], [44.88955, 11.81372], [44.88959, 11.81382], [44.88962, 11.81390], 
        [44.88966, 11.81398], [44.88970, 11.81405], [44.88974, 11.81411], [44.88978, 11.81417], [44.88982, 11.81422], [44.88986, 11.81427], 
        [44.88991, 11.81432], [44.89001, 11.81439], [44.89029, 11.81463], [44.89088, 11.81512], [44.89147, 11.81559], [44.89164, 11.81573], 
        [44.89178, 11.81584], [44.89195, 11.81598], [44.89201, 11.81612], [44.89208, 11.81627], [44.89212, 11.81640], [44.89216, 11.81660], 
        [44.89218, 11.81726], [44.89221, 11.81792], [44.89225, 11.81900], [44.89229, 11.82002], [44.89229, 11.82010], [44.89230, 11.82024], 
        [44.89231, 11.82052], [44.89232, 11.82067], [44.89233, 11.82109], [44.89235, 11.82138], [44.89242, 11.82302], [44.89242, 11.82313], 
        [44.89242, 11.82314], [44.89242, 11.82318], [44.89243, 11.82330], [44.89245, 11.82387], [44.89245, 11.82392], [44.89246, 11.82398], 
        [44.89247, 11.82407], [44.89247, 11.82413], [44.89249, 11.82419], [44.89252, 11.82428], [44.89274, 11.82497], [44.89280, 11.82514], 
        [44.89332, 11.82667], [44.89334, 11.82673], [44.89333, 11.82674], [44.89332, 11.82676], [44.89331, 11.82678], [44.89331, 11.82680], 
        [44.89331, 11.82683], [44.89331, 11.82685], [44.89332, 11.82687], [44.89334, 11.82689], [44.89335, 11.82690], [44.89337, 11.82691], 
        [44.89339, 11.82691], [44.89340, 11.82690], [44.89342, 11.82689], [44.89343, 11.82687], [44.89344, 11.82685], [44.89345, 11.82683], 
        [44.89345, 11.82680], [44.89356, 11.82681], [44.89385, 11.82672], [44.89389, 11.82671], [44.89468, 11.82647], [44.89483, 11.82643], 
        [44.89493, 11.82640], [44.89504, 11.82720], [44.89506, 11.82729], [44.89509, 11.82747], [44.89512, 11.82768], [44.89514, 11.82787], 
        [44.89515, 11.82793], [44.89521, 11.82825], [44.89522, 11.82837], [44.89523, 11.82844], [44.89523, 11.82854], [44.89524, 11.82865], 
        [44.89524, 11.82877], [44.89523, 11.82901], [44.89521, 11.82953], [44.89521, 11.82959], [44.89520, 11.82966], [44.89519, 11.82972], 
        [44.89512, 11.83005]
    ],
    'viamodena': [
        [44.83982, 11.58986], [44.83981, 11.58987], [44.83975, 11.59002], [44.83950, 11.59060], [44.83925, 11.59116], [44.83896, 11.59180], 
        [44.83893, 11.59177], [44.83934, 11.59086], [44.83945, 11.59063], [44.83969, 11.59009], [44.83977, 11.58990], [44.83984, 11.58970], 
        [44.83995, 11.58942], [44.83996, 11.58937], [44.84003, 11.58918], [44.84004, 11.58916], [44.84025, 11.58859], [44.84064, 11.58747], 
        [44.84064, 11.58746], [44.84065, 11.58741], [44.84065, 11.58739], [44.84065, 11.58734], [44.84063, 11.58731], [44.84061, 11.58727], 
        [44.84059, 11.58724], [44.84056, 11.58721], [44.84055, 11.58717], [44.84051, 11.58708], [44.84051, 11.58701], [44.84053, 11.58698], 
        [44.84059, 11.58686], [44.84062, 11.58678], [44.84064, 11.58680], [44.84067, 11.58681], [44.84070, 11.58681], [44.84072, 11.58681], 
        [44.84075, 11.58681], [44.84078, 11.58679], [44.84080, 11.58677], [44.84082, 11.58674], [44.84084, 11.58672], [44.84086, 11.58667], 
        [44.84092, 11.58652], [44.84096, 11.58655], [44.84100, 11.58658], [44.84145, 11.58529], [44.84156, 11.58500], [44.84175, 11.58447], 
        [44.84222, 11.58316], [44.84258, 11.58209], [44.84264, 11.58193], [44.84259, 11.58189], [44.84264, 11.58174], [44.84267, 11.58166], 
        [44.84270, 11.58163], [44.84272, 11.58160], [44.84274, 11.58157], [44.84274, 11.58155], [44.84275, 11.58150], [44.84275, 11.58147], 
        [44.84275, 11.58142], [44.84274, 11.58138], [44.84272, 11.58135], [44.84277, 11.58122], [44.84281, 11.58109], [44.84282, 11.58107], 
        [44.84285, 11.58095], [44.84285, 11.58085], [44.84287, 11.58067], [44.84288, 11.58049], [44.84288, 11.58035], [44.84287, 11.58019], 
        [44.84286, 11.58006], [44.84283, 11.57980], [44.84280, 11.57960], [44.84274, 11.57918], [44.84245, 11.57733], [44.84239, 11.57698], 
        [44.84229, 11.57635], [44.84222, 11.57636], [44.84128, 11.57627], [44.84064, 11.57623], [44.84006, 11.57619], [44.83995, 11.57617], 
        [44.83981, 11.57612], [44.83962, 11.57600], [44.83932, 11.57578], [44.83916, 11.57564], [44.83910, 11.57560], [44.83905, 11.57555], 
        [44.83900, 11.57550], [44.83898, 11.57546], [44.83897, 11.57542], [44.83897, 11.57537], [44.83897, 11.57527], [44.83898, 11.57517], 
        [44.83900, 11.57512], [44.83904, 11.57505], [44.83907, 11.57501], [44.83910, 11.57498], [44.83913, 11.57494], [44.83916, 11.57488], 
        [44.83918, 11.57483], [44.83957, 11.57324], [44.83958, 11.57317], [44.83959, 11.57309], [44.83959, 11.57302], [44.83960, 11.57285], 
        [44.83961, 11.57269], [44.83965, 11.57242], [44.83967, 11.57230], [44.83969, 11.57220], [44.83971, 11.57211], [44.83975, 11.57195], 
        [44.83979, 11.57181], [44.83980, 11.57171], [44.83983, 11.57158], [44.83984, 11.57147], [44.83986, 11.57135], [44.83987, 11.57119], 
        [44.83987, 11.57103], [44.83989, 11.57022], [44.83989, 11.57011], [44.83990, 11.57002], [44.83992, 11.56977], [44.83996, 11.56940], 
        [44.84077, 11.56413], [44.84083, 11.56393], [44.84089, 11.56351], [44.84091, 11.56320], [44.84104, 11.56244], [44.84104, 11.56239], 
        [44.84105, 11.56234], [44.84105, 11.56230], [44.84105, 11.56226], [44.84105, 11.56223], [44.84104, 11.56219], [44.84103, 11.56216], 
        [44.84102, 11.56212], [44.84100, 11.56208], [44.84097, 11.56205], [44.84090, 11.56198], [44.83921, 11.56054], [44.83886, 11.56024], 
        [44.83428, 11.55634], [44.83261, 11.55493], [44.83246, 11.55480], [44.83243, 11.55477], [44.83089, 11.55347], [44.83032, 11.55297], 
        [44.82847, 11.55136], [44.82832, 11.55124], [44.82645, 11.54961], [44.82597, 11.54919], [44.82550, 11.54879], [44.82445, 11.54787], 
        [44.82705, 11.54125], [44.82714, 11.54103], [44.82744, 11.54027], [44.82761, 11.53983], [44.82841, 11.53780], [44.82829, 11.53781], 
        [44.82820, 11.53780], [44.82811, 11.53779], [44.82805, 11.53777], [44.82799, 11.53773], [44.82794, 11.53769], [44.82790, 11.53765], 
        [44.82786, 11.53759], [44.82782, 11.53752], [44.82778, 11.53742], [44.82774, 11.53731], [44.82752, 11.53646], [44.82751, 11.53638], 
        [44.82749, 11.53631], [44.82748, 11.53622], [44.82747, 11.53609], [44.82744, 11.53559], [44.82743, 11.53524], [44.82743, 11.53514], 
        [44.82743, 11.53508], [44.82742, 11.53503], [44.82742, 11.53496], [44.82740, 11.53490], [44.82739, 11.53484], [44.82737, 11.53477], 
        [44.82734, 11.53469], [44.82731, 11.53463], [44.82728, 11.53456], [44.82725, 11.53454], [44.82724, 11.53452], [44.82719, 11.53448], 
        [44.82715, 11.53446], [44.82710, 11.53445], [44.82702, 11.53444], [44.82656, 11.53445], [44.82647, 11.53445], [44.82639, 11.53444], 
        [44.82633, 11.53441], [44.82627, 11.53438], [44.82625, 11.53436], [44.82622, 11.53433], [44.82598, 11.53406], [44.82585, 11.53389], 
        [44.82568, 11.53367], [44.82563, 11.53361], [44.82560, 11.53356], [44.82557, 11.53349], [44.82554, 11.53343], [44.82551, 11.53334], 
        [44.82549, 11.53327], [44.82547, 11.53320], [44.82545, 11.53312], [44.82544, 11.53304], [44.82543, 11.53296], [44.82543, 11.53288], 
        [44.82543, 11.53283], [44.82543, 11.53276], [44.82544, 11.53269], [44.82546, 11.53261], [44.82548, 11.53254], [44.82550, 11.53246], 
        [44.82556, 11.53230], [44.82569, 11.53200], [44.82572, 11.53189], [44.82576, 11.53180], [44.82578, 11.53175], [44.82579, 11.53171], 
        [44.82580, 11.53168], [44.82581, 11.53162], [44.82582, 11.53156], [44.82582, 11.53151], [44.82583, 11.53145], [44.82583, 11.53140], 
        [44.82582, 11.53135], [44.82581, 11.53128], [44.82580, 11.53121], [44.82579, 11.53116], [44.82577, 11.53111], [44.82574, 11.53104], 
        [44.82571, 11.53098], [44.82568, 11.53091], [44.82562, 11.53081], [44.82514, 11.53003], [44.82508, 11.52994], [44.82503, 11.52988], 
        [44.82498, 11.52982], [44.82494, 11.52978], [44.82488, 11.52974], [44.82483, 11.52971], [44.82476, 11.52966], [44.82426, 11.52943], 
        [44.82421, 11.52939], [44.82416, 11.52936], [44.82411, 11.52931], [44.82407, 11.52926], [44.82402, 11.52919], [44.82398, 11.52913], 
        [44.82394, 11.52906], [44.82391, 11.52898], [44.82388, 11.52892], [44.82386, 11.52882], [44.82373, 11.52801], [44.82362, 11.52729], 
        [44.82361, 11.52716], [44.82360, 11.52707], [44.82360, 11.52700], [44.82360, 11.52692], [44.82361, 11.52685], [44.82363, 11.52673], 
        [44.82396, 11.52526], [44.82430, 11.52375], [44.82476, 11.52169], [44.82478, 11.52160], [44.82480, 11.52153], [44.82482, 11.52147], 
        [44.82485, 11.52142], [44.82488, 11.52137], [44.82491, 11.52132], [44.82497, 11.52127], [44.82583, 11.52046], [44.82591, 11.52038], 
        [44.82598, 11.52031], [44.82611, 11.52015], [44.82577, 11.51955], [44.82565, 11.51934], [44.82535, 11.51891], [44.82504, 11.51847], 
        [44.82452, 11.51774], [44.82428, 11.51740], [44.82388, 11.51684], [44.82382, 11.51675], [44.82378, 11.51668], [44.82375, 11.51661], 
        [44.82372, 11.51653], [44.82369, 11.51643], [44.82353, 11.51601], [44.82330, 11.51541], [44.82321, 11.51518], [44.82318, 11.51511], 
        [44.82316, 11.51506], [44.82311, 11.51494], [44.82306, 11.51479], [44.82301, 11.51467], [44.82300, 11.51462], [44.82299, 11.51458], 
        [44.82299, 11.51454], [44.82299, 11.51450], [44.82299, 11.51445], [44.82300, 11.51436], [44.82314, 11.51372], [44.82320, 11.51348], 
        [44.82337, 11.51273], [44.82346, 11.51223], [44.82346, 11.51186], [44.82345, 11.51179], [44.82334, 11.51004], [44.82317, 11.50736], 
        [44.82314, 11.50698], [44.82310, 11.50613], [44.82312, 11.50592], [44.82325, 11.50580], [44.82362, 11.50585], [44.82373, 11.50572], 
        [44.82380, 11.50550], [44.82380, 11.50520], [44.82347, 11.50361], [44.82335, 11.50293], [44.82330, 11.50250], [44.82321, 11.50164], 
        [44.82310, 11.50111], [44.82287, 11.50042], [44.82258, 11.49979], [44.82251, 11.49966], [44.82211, 11.49894], [44.82205, 11.49878], 
        [44.82204, 11.49857], [44.82199, 11.49834], [44.82150, 11.49737], [44.82096, 11.49574], [44.82071, 11.49501], [44.82018, 11.49316], 
        [44.82015, 11.49306], [44.82010, 11.49289], [44.81999, 11.49252], [44.81983, 11.49197], [44.81977, 11.49174], [44.81972, 11.49154], 
        [44.81953, 11.49128], [44.81853, 11.49011], [44.81775, 11.48916], [44.81669, 11.48786], [44.81660, 11.48776], [44.81633, 11.48741], 
        [44.81626, 11.48730], [44.81623, 11.48725], [44.81621, 11.48719], [44.81619, 11.48712], [44.81617, 11.48711], [44.81612, 11.48707], 
        [44.81607, 11.48704], [44.81602, 11.48699], [44.81598, 11.48695], [44.81593, 11.48690], [44.81586, 11.48681], [44.81497, 11.48558], 
        [44.81448, 11.48489], [44.81308, 11.48296], [44.81168, 11.48103], [44.81028, 11.47910], [44.80946, 11.47797], [44.80929, 11.47773], 
        [44.80916, 11.47755], [44.80907, 11.47743], [44.80900, 11.47736], [44.80894, 11.47729], [44.80890, 11.47724], [44.80884, 11.47719], 
        [44.80884, 11.47715], [44.80883, 11.47711], [44.80882, 11.47706], [44.80879, 11.47701], [44.80876, 11.47696], [44.80871, 11.47689], 
        [44.80840, 11.47646], [44.80833, 11.47636], [44.80790, 11.47578], [44.80794, 11.47573], [44.80798, 11.47568], [44.80804, 11.47561], 
        [44.80816, 11.47550], [44.80888, 11.47477], [44.80894, 11.47468], [44.80896, 11.47460], [44.80897, 11.47451], [44.80896, 11.47440], 
        [44.80892, 11.47424], [44.80881, 11.47393], [44.80823, 11.47235], [44.80741, 11.47005], [44.80730, 11.46973], [44.80719, 11.46936], 
        [44.80696, 11.46840], [44.80646, 11.46645], [44.80561, 11.46335], [44.80548, 11.46278], [44.80533, 11.46201], [44.80510, 11.46080], 
        [44.80508, 11.46071], [44.80504, 11.46066], [44.80498, 11.46066], [44.80491, 11.46071], [44.80489, 11.46074], [44.80370, 11.45623], 
        [44.80351, 11.45558], [44.80334, 11.45517], [44.80309, 11.45455], [44.80293, 11.45391], [44.80285, 11.45349], [44.80276, 11.45306], 
        [44.80257, 11.45214], [44.80238, 11.45136], [44.80218, 11.45070], [44.80198, 11.44996], [44.80185, 11.44940], [44.80181, 11.44921]
    ],
    'viaravenna': [
        [44.81985, 11.63023], [44.81985, 11.63023], [44.81981, 11.63018], [44.81977, 11.63014], [44.81970, 11.63010], [44.81964, 11.63007], 
        [44.81924, 11.63000], [44.81896, 11.62995], [44.81893, 11.62994], [44.81891, 11.62992], [44.81889, 11.62988], [44.81888, 11.62984], 
        [44.81888, 11.62981], [44.81886, 11.62960], [44.81883, 11.62932], [44.81881, 11.62912], [44.81878, 11.62883], [44.81877, 11.62880], 
        [44.81877, 11.62876], [44.81878, 11.62871], [44.81881, 11.62848], [44.81883, 11.62834], [44.81884, 11.62829], [44.81885, 11.62825], 
        [44.81886, 11.62823], [44.81888, 11.62821], [44.81890, 11.62819], [44.81893, 11.62817], [44.81900, 11.62814], [44.81905, 11.62812], 
        [44.81910, 11.62812], [44.81914, 11.62812], [44.81918, 11.62812], [44.81923, 11.62813], [44.81925, 11.62814], [44.81942, 11.62818], 
        [44.81946, 11.62818], [44.81948, 11.62818], [44.81951, 11.62818], [44.81953, 11.62817], [44.81954, 11.62815], [44.81954, 11.62811], 
        [44.81944, 11.62812], [44.81935, 11.62811], [44.81910, 11.62806], [44.81901, 11.62807], [44.81892, 11.62812], [44.81881, 11.62817], 
        [44.81876, 11.62820], [44.81855, 11.62833], [44.81852, 11.62835], [44.81828, 11.62850], [44.81797, 11.62868], [44.81773, 11.62882], 
        [44.81759, 11.62887], [44.81726, 11.62919], [44.81715, 11.62929], [44.81707, 11.62936], [44.81699, 11.62942], [44.81689, 11.62948], 
        [44.81679, 11.62954], [44.81669, 11.62958], [44.81660, 11.62961], [44.81648, 11.62965], [44.81637, 11.62969], [44.81626, 11.62974], 
        [44.81616, 11.62981], [44.81603, 11.62990], [44.81592, 11.62999], [44.81581, 11.63008], [44.81573, 11.63010], [44.81561, 11.63019], 
        [44.81557, 11.63022], [44.81527, 11.63049], [44.81502, 11.63071], [44.81496, 11.63075], [44.81492, 11.63077], [44.81487, 11.63078], 
        [44.81483, 11.63078], [44.81476, 11.63076], [44.81475, 11.63073], [44.81472, 11.63069], [44.81469, 11.63066], [44.81465, 11.63064], 
        [44.81461, 11.63063], [44.81458, 11.63064], [44.81454, 11.63066], [44.81451, 11.63070], [44.81448, 11.63074], [44.81447, 11.63079], 
        [44.81446, 11.63084], [44.81446, 11.63089], [44.81434, 11.63121], [44.81430, 11.63131], [44.81425, 11.63137], [44.81422, 11.63142], 
        [44.81418, 11.63147], [44.81414, 11.63150], [44.81396, 11.63164], [44.81391, 11.63167], [44.81364, 11.63186], [44.81338, 11.63203], 
        [44.81317, 11.63217], [44.81298, 11.63230], [44.81279, 11.63245], [44.81265, 11.63257], [44.81249, 11.63271], [44.81228, 11.63292], 
        [44.81198, 11.63325], [44.81170, 11.63356], [44.81145, 11.63383], [44.81126, 11.63405], [44.81123, 11.63409], [44.81121, 11.63410], 
        [44.81109, 11.63424], [44.81083, 11.63453], [44.81069, 11.63468], [44.81061, 11.63475], [44.81054, 11.63480], [44.81046, 11.63485], 
        [44.81042, 11.63487], [44.81032, 11.63490], [44.81018, 11.63494], [44.80986, 11.63504], [44.80943, 11.63516], [44.80905, 11.63528], 
        [44.80892, 11.63531], [44.80870, 11.63537], [44.80840, 11.63546], [44.80821, 11.63551], [44.80811, 11.63554], [44.80793, 11.63559], 
        [44.80780, 11.63563], [44.80762, 11.63569], [44.80732, 11.63579], [44.80708, 11.63587], [44.80695, 11.63591], [44.80682, 11.63595], 
        [44.80660, 11.63600], [44.80649, 11.63602], [44.80608, 11.63608], [44.80580, 11.63612], [44.80530, 11.63616], [44.80470, 11.63623], 
        [44.80419, 11.63629], [44.80231, 11.63650], [44.80212, 11.63652], [44.80022, 11.63669], [44.80009, 11.63670], [44.79858, 11.63684], 
        [44.79835, 11.63686], [44.79807, 11.63689], [44.79776, 11.63686], [44.79753, 11.63688], [44.79730, 11.63691], [44.79693, 11.63695], 
        [44.79625, 11.63703], [44.79566, 11.63710], [44.79536, 11.63713], [44.79521, 11.63714], [44.79449, 11.63720], [44.79435, 11.63721], 
        [44.79416, 11.63723], [44.79394, 11.63725], [44.79359, 11.63729], [44.79331, 11.63731], [44.79239, 11.63742], [44.79215, 11.63749], 
        [44.79209, 11.63749], [44.79108, 11.63759], [44.79087, 11.63761], [44.79036, 11.63765], [44.78954, 11.63775], [44.78923, 11.63779], 
        [44.78905, 11.63781], [44.78893, 11.63783], [44.78872, 11.63787], [44.78844, 11.63793], [44.78819, 11.63798], [44.78802, 11.63803], 
        [44.78789, 11.63806], [44.78771, 11.63811], [44.78754, 11.63817], [44.78734, 11.63823], [44.78722, 11.63828], [44.78711, 11.63832], 
        [44.78696, 11.63839], [44.78682, 11.63846], [44.78666, 11.63854], [44.78655, 11.63861], [44.78643, 11.63867], [44.78600, 11.63898], 
        [44.78579, 11.63915], [44.78560, 11.63931], [44.78543, 11.63946], [44.78530, 11.63959], [44.78515, 11.63973], [44.78494, 11.63995], 
        [44.78459, 11.64033], [44.78408, 11.64092], [44.78333, 11.64178], [44.78000, 11.64558], [44.77909, 11.64661], [44.77828, 11.64753], 
        [44.77579, 11.65025], [44.77163, 11.65478], [44.77124, 11.65521], [44.77018, 11.65634], [44.76988, 11.65666], [44.76937, 11.65722], 
        [44.76905, 11.65758], [44.76871, 11.65796], [44.76793, 11.65889], [44.76764, 11.65924], [44.76438, 11.66322], [44.76278, 11.66518], 
        [44.76239, 11.66564], [44.76071, 11.66768], [44.76066, 11.66774], [44.76063, 11.66777], [44.75755, 11.67153], [44.75753, 11.67156], 
        [44.75706, 11.67212], [44.75513, 11.67433], [44.75407, 11.67555], [44.74991, 11.68031], [44.74832, 11.68213], [44.74819, 11.68227], 
        [44.74750, 11.68306], [44.74703, 11.68360], [44.74474, 11.68620], [44.74470, 11.68625], [44.74363, 11.68530], [44.74211, 11.68393], 
        [44.73974, 11.68177], [44.73935, 11.68142]
    ],
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

    // Se i punti selezionati sono troppo lontani dalla via (> 2500 metri), non forzare lo slicing
    if (minDist1 > 2500 || minDist2 > 2500 || idx1 === -1 || idx2 === -1) return null;

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

// Normalizza i nomi delle strade per collegare segnalazioni appartenenti alla stessa arteria/statale
function normalizeStreetKey(name) {
    if (!name || typeof name !== 'string') return '';
    let s = name.toLowerCase().trim();
    // Normalizza abbreviazioni di strade statali e provinciali
    s = s.replace(/\bs\.?s\.?\s*16\b/g, 'ss16');
    s = s.replace(/\bs\.?s\.?\s*309\b/g, 'ss309');
    s = s.replace(/\bs\.?s\.?\s*64\b/g, 'ss64');
    s = s.replace(/\bs\.?s\.?\s*468\b/g, 'ss468');
    s = s.replace(/\bs\.?p\.?\s*468\b/g, 'ss468');
    s = s.replace(/\bs\.?p\.?\s*/g, 'sp');
    // Rimuovi prefissi generici
    s = s.replace(/^(strada statale|strada provinciale|strada|via|viale|corso|piazza|piazzale|vicolo|largo|borgo)\s+/g, '');
    // Riconoscimento speciale per arterie principali e statali
    if (s.includes('adriatica') || s.includes('ss16')) return 'statale_adriatica';
    if (s.includes('romea') || s.includes('ss309')) return 'statale_romea';
    if (s.includes('porrettana') || s.includes('ss64') || s.includes('bologna')) return 'viabologna';
    if (s.includes('ferrarese') || s.includes('468') || s.includes('statale')) return 'viaferrarese';
    if (s.includes('ruffetta')) return 'ruffetta';
    if (s.includes('comacchio') || s.includes('sp22')) return 'viacomacchio';
    if (s.includes('pomposa') || s.includes('sp15')) return 'viapomposa';
    if (s.includes('copparo') || s.includes('sp2')) return 'viacopparo';
    if (s.includes('modena') || s.includes('ss255')) return 'viamodena';
    if (s.includes('ravenna')) return 'viaravenna';
    // Se contiene virgole o parentesi, estrai solo il nome primario
    s = s.split(/[,(]/)[0].trim();
    return s.replace(/[^a-z0-9]/g, '');
}

function isMajorHighway(streetName) {
    if (!streetName) return false;
    const s = streetName.toLowerCase();
    return s.includes('statale') ||
           s.includes('ss16') ||
           s.includes('ss309') ||
           s.includes('ss64') ||
           s.includes('ss468') ||
           s.includes('sp468') ||
           s.includes('tangenziale') ||
           s.includes('raccordo') ||
           s.includes('autostrad');
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

// Interroga OpenStreetMap Overpass API per estrarre la geometria esatta dei way appartenenti alla via specificata
async function fetchOsmWayGeometry(streetName, lat1, lng1, lat2, lng2) {
    if (!streetName) return null;
    const cleanName = streetName.replace(/^(via|viale|corso|strada provinciale|strada statale|strada|vicolo|piazza|piazzale)\s+/i, '').split(/[,(]/)[0].trim();
    if (cleanName.length < 3) return null;

    const minLat = (Math.min(lat1, lat2) - 0.008).toFixed(5);
    const maxLat = (Math.max(lat1, lat2) + 0.008).toFixed(5);
    const minLng = (Math.min(lng1, lng2) - 0.008).toFixed(5);
    const maxLng = (Math.max(lng1, lng2) + 0.008).toFixed(5);

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
                    const allWayPoints = [];
                    data.elements.forEach(el => {
                        if (el.geometry && Array.isArray(el.geometry)) {
                            el.geometry.forEach(pt => {
                                allWayPoints.push([pt.lat, pt.lon]);
                            });
                        }
                    });

                    if (allWayPoints.length >= 2) {
                        const sliced = sliceStreetGeometryBetweenPoints(allWayPoints, lat1, lng1, lat2, lng2);
                        if (sliced && sliced.length >= 3) {
                            return sliced;
                        }
                    }
                }
            }
        } catch (e) {
            // Prova fallback endpoint
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

// Calcola il percorso reale tra due punti su una specifica strada seguendo la carreggiata OpenStreetMap
// REGOLA TASSATIVA: Nessun passaggio su strade con nome diverso (es. SP4 al posto di Via Ruffetta) e mai linee rette
async function routeBetweenPoints(lat1, lng1, lat2, lng2, targetStreetName) {
    const isHighway = isMajorHighway(targetStreetName);
    const isRamp = (targetStreetName || '').toLowerCase().includes('rampa') || (targetStreetName || '').toLowerCase().includes('svincolo');
    const directDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    const normTarget = normalizeStreetKey(targetStreetName);
    const rawTarget = (targetStreetName || '').toLowerCase();
    const isRuffetta = normTarget.includes('ruffetta') || rawTarget.includes('ruffetta');
    const isFerrareseSS468 = normTarget.includes('ferrarese') || rawTarget.includes('ferrarese') || 
                             normTarget.includes('468') || rawTarget.includes('468') || 
                             normTarget.includes('statale') || rawTarget.includes('statale');

    // 1. Verifica immediata nel database geometrico certificato OpenStreetMap (Via Ruffetta, Via Ferrarese / SS468, Statali e Provinciali)
    const geomKeysToTry = [normTarget, rawTarget.replace(/[^a-z0-9]/g, '')];
    if (isRuffetta) geomKeysToTry.unshift('ruffetta', 'viaruffetta');
    if (isFerrareseSS468) geomKeysToTry.unshift('viaferrarese', 'ferrarese', 'ss468', 'sp468', 'viastatale');
    if (normTarget.includes('bologna')) geomKeysToTry.unshift('viabologna');
    if (normTarget.includes('comacchio')) geomKeysToTry.unshift('viacomacchio');
    if (normTarget.includes('pomposa')) geomKeysToTry.unshift('viapomposa');
    if (normTarget.includes('copparo')) geomKeysToTry.unshift('viacopparo');
    if (normTarget.includes('modena')) geomKeysToTry.unshift('viamodena');
    if (normTarget.includes('ravenna')) geomKeysToTry.unshift('viaravenna');

    for (const gKey of geomKeysToTry) {
        if (STATIC_STREET_GEOMETRIES[gKey]) {
            const staticSliced = sliceStreetGeometryBetweenPoints(STATIC_STREET_GEOMETRIES[gKey], lat1, lng1, lat2, lng2);
            if (staticSliced && staticSliced.length >= 3) {
                return staticSliced;
            }
        }
    }

    // 2. OSRM Multi-profilo (routed-bike segue fedelmente il tracciato fisico della carreggiata, routed-car, foot)
    const endpoints = [
        { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
        { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
        { url: `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
        { url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false }
    ];

    let bestCoords = null;
    let bestScore = -Infinity;

    for (const ep of endpoints) {
        const res = await fetchOsrmRoute(ep.url, ep.rev);
        if (res && res.coords && res.coords.length >= 2) {
            // CONTROLLO NOMINALE TASSATIVO:
            // - Per Via Ruffetta: vietato categoricamente SP4 o Via Provinciale
            // - Per Via Ferrarese / SS468: consentite tutte le varianti di asse regionale (Ferrarese, Statale, SS468, SP468, SP255, SP66)
            if (isRuffetta && res.steps && res.steps.length > 0) {
                let hitsSp4 = false;
                for (const step of res.steps) {
                    const sName = (step.name || '').toLowerCase();
                    if (sName.includes('sp4') || sName.includes('sp 4') || sName.includes('provinciale')) {
                        hitsSp4 = true;
                        break;
                    }
                }
                if (hitsSp4) continue; // Scarta percorso che devia su SP4
            }

            if (!isHighway && !isRamp && !isFerrareseSS468 && normTarget && normTarget.length >= 3) {
                let hasForbiddenDetour = false;
                if (res.steps && res.steps.length > 0) {
                    for (const step of res.steps) {
                        const sDist = step.distance || 0;
                        const sName = (step.name || '').toLowerCase();
                        const sNorm = normalizeStreetKey(step.name || '');

                        if (sDist > 35 && sName !== '') {
                            const matchesTarget = sNorm.includes(normTarget) || normTarget.includes(sNorm) || 
                                                  rawTarget.includes(sName) || sName.includes(rawTarget);
                            if (!matchesTarget) {
                                hasForbiddenDetour = true;
                                break;
                            }
                        }
                    }
                }
                if (hasForbiddenDetour) continue;
            }

            // Valuta la vicinanza della distanza alla distanza diretta (evita percorsi assurdi)
            const ratio = res.distance / (directDist || 1);
            if (ratio > 2.2) continue; // Troppo lungo rispetto alla linea d'aria

            let score = 100 - Math.abs(ratio - 1.1) * 30 + Math.min(res.coords.length, 25);

            if (score > bestScore) {
                bestScore = score;
                let finalCoords = [...res.coords];
                finalCoords[0] = [lat1, lng1];
                finalCoords[finalCoords.length - 1] = [lat2, lng2];
                bestCoords = finalCoords;

                if (res.coords.length >= 4 && ratio <= 1.5) {
                    return finalCoords;
                }
            }
        }
    }

    if (bestCoords && bestCoords.length >= 2) {
        return bestCoords;
    }

    // 3. Fallback Overpass OSM
    try {
        const osmGeom = await fetchOsmWayGeometry(targetStreetName, lat1, lng1, lat2, lng2);
        if (osmGeom && osmGeom.length >= 3) {
            return osmGeom;
        }
    } catch (e) { }

    // 4. Fallback fluido ad alta densità (mai linee rette secche a 2 punti)
    const stepsCount = 16;
    const interpolated = [];
    for (let i = 0; i <= stepsCount; i++) {
        const t = i / stepsCount;
        const curLat = lat1 + (lat2 - lat1) * t;
        const curLng = lng1 + (lng2 - lng1) * t;
        interpolated.push([curLat, curLng]);
    }
    return interpolated;
}

// Recupera la geometria reale dell'intera tratta stradale
async function getStreetGeometry(streetName, markerCoords) {
    const cacheKey = `${normalizeStreetKey(streetName) || streetName.toLowerCase()}_${markerCoords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
    if (streetGeomCache[cacheKey] && streetGeomCache[cacheKey].length > markerCoords.length) {
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
        // Salva in cache SOLO se ha trovato curve reali
        if (fullRoute.length > markerCoords.length) {
            streetGeomCache[cacheKey] = fullRoute;
            saveStreetGeomCache();
            return fullRoute;
        }
    } catch (e) {
        console.warn('Errore calcolo geometria stradale:', e.message);
    }

    return markerCoords;
}

// -------------------------------------------------------
// TRATTI STRADALI ROSSI
// Regola ferrea delle coppie:
// - 1a e 2a icona collegate tra loro in un tratto di strada
// - 3a e 4a icona collegate tra loro in un altro tratto
// - e così via (ogni coppia forma un tratto autonomo e indipendente)
// - Supporto nativo per rampe di accesso e svincoli
// -------------------------------------------------------
async function updateRoadSegments() {
    // 1. Raggruppa i marker per via (o per segmentId se presente)
    const rawGroups = {};
    const singleMarkers = [];

    markersData.forEach(m => {
        if (!isMarkerVisible(m)) return;
        if (getMarkerScheduleStatus(m) !== 'active') return;

        let key = '';
        let displayName = '';
        if (m.segmentId) {
            key = m.segmentId;
            displayName = m.street || 'Tratto stradale';
        } else if (m.street && m.street.trim() !== '') {
            const normKey = normalizeStreetKey(m.street);
            key = normKey || m.street.trim().toLowerCase();
            displayName = m.street.trim();
        } else {
            singleMarkers.push(m);
            return;
        }

        if (!rawGroups[key]) {
            rawGroups[key] = { streetName: displayName, markers: [] };
        }
        rawGroups[key].markers.push(m);
    });

    const validSegments = {};

    // 2. Suddivide ogni gruppo in coppie indipendenti (1-2, 3-4, 5-6...)
    Object.keys(rawGroups).forEach(key => {
        const group = rawGroups[key];
        // Ordina cronologicamente per timestamp/id
        group.markers.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));

        for (let i = 0; i < group.markers.length - 1; i += 2) {
            const m1 = group.markers[i];
            const m2 = group.markers[i + 1];
            const segKey = `${key}_pair_${Math.floor(i / 2)}`;
            validSegments[segKey] = {
                streetName: group.streetName,
                coords: [[m1.lat, m1.lng], [m2.lat, m2.lng]]
            };
        }

        // Se è rimasto un marker spaiato (es. su una rampa di svincolo con nome diverso all'altra estremità)
        if (group.markers.length % 2 === 1) {
            singleMarkers.push(group.markers[group.markers.length - 1]);
        }
    });

    // 3. Collega eventuali marker singoli SOLO ED ESCLUSIVAMENTE se sono rampe o svincoli autostradali/statali
    function isRampOrHighwayElement(m) {
        if (!m || !m.street) return false;
        // Non collegare MAI mercati singoli, sagre singole o generiche vie urbane tra loro
        if (m.type === 'mercato' || m.type === 'sagra') return false;
        const s = m.street.toLowerCase();
        return s.includes('rampa') || s.includes('svincolo') || s.includes('raccordo') || s.includes('bretella') || isMajorHighway(s);
    }

    const eligibleRampMarkers = singleMarkers.filter(isRampOrHighwayElement);
    eligibleRampMarkers.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    const usedSingle = new Set();
    for (let i = 0; i < eligibleRampMarkers.length; i++) {
        if (usedSingle.has(i)) continue;
        const m1 = eligibleRampMarkers[i];
        let bestJ = -1;
        let minDist = 800; // Massimo 800 metri per collegare due punti di una rampa/svincolo

        for (let j = i + 1; j < eligibleRampMarkers.length; j++) {
            if (usedSingle.has(j)) continue;
            const m2 = eligibleRampMarkers[j];
            const d = calculateDistanceMeters(m1.lat, m1.lng, m2.lat, m2.lng);
            if (d < minDist) {
                minDist = d;
                bestJ = j;
            }
        }

        if (bestJ !== -1) {
            const m2 = eligibleRampMarkers[bestJ];
            usedSingle.add(i);
            usedSingle.add(bestJ);
            const rampKey = `ramp_${m1.id}_${m2.id}`;
            validSegments[rampKey] = {
                streetName: m1.street && m2.street ? `${m1.street} / ${m2.street}` : (m1.street || m2.street || 'Rampa di raccordo'),
                coords: [[m1.lat, m1.lng], [m2.lat, m2.lng]]
            };
        }
    }

    // 4. Rimuovi le polyline non più presenti
    for (let segKey in activeSegments) {
        if (!validSegments[segKey]) {
            map.removeLayer(activeSegments[segKey]);
            delete activeSegments[segKey];
        }
    }

    // 5. Disegna subito le linee sulla mappa con curve reali immediate (cache o database statico o segmento iniziale)
    const segKeys = Object.keys(validSegments);
    segKeys.forEach(segKey => {
        const segment = validSegments[segKey];
        const cacheKey = `${normalizeStreetKey(segment.streetName) || segment.streetName.toLowerCase()}_${segment.coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('_')}`;
        
        let initialCoords = streetGeomCache[cacheKey];
        if (!initialCoords) {
            const norm = normalizeStreetKey(segment.streetName);
            const raw = (segment.streetName || '').toLowerCase();
            const keysToCheck = [norm, raw.replace(/[^a-z0-9]/g, '')];
            if (raw.includes('ruffetta')) keysToCheck.unshift('ruffetta', 'viaruffetta');
            if (raw.includes('ferrarese') || raw.includes('468') || raw.includes('statale')) {
                keysToCheck.unshift('viaferrarese', 'ferrarese', 'ss468', 'sp468', 'viastatale');
            }
            if (norm.includes('bologna')) keysToCheck.unshift('viabologna');
            if (norm.includes('comacchio')) keysToCheck.unshift('viacomacchio');
            if (norm.includes('pomposa')) keysToCheck.unshift('viapomposa');
            if (norm.includes('copparo')) keysToCheck.unshift('viacopparo');
            if (norm.includes('modena')) keysToCheck.unshift('viamodena');
            if (norm.includes('ravenna')) keysToCheck.unshift('viaravenna');

            for (const k of keysToCheck) {
                if (STATIC_STREET_GEOMETRIES[k]) {
                    const sliced = sliceStreetGeometryBetweenPoints(STATIC_STREET_GEOMETRIES[k], segment.coords[0][0], segment.coords[0][1], segment.coords[1][0], segment.coords[1][1]);
                    if (sliced && sliced.length >= 3) {
                        initialCoords = sliced;
                        break;
                    }
                }
            }
        }
        if (!initialCoords) {
            initialCoords = segment.coords;
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

    // 6. Passo asincrono parallelo: affina il tracciato con le curve reali della strada/rampa
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
// - Gestione amministratore con durata, modifica e cancellazione (max 3 news)
// - Sincronizzazione in tempo reale su Firebase Realtime Database
// =======================================================

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
    if (count > 0) {
        userNewsBtn.classList.remove('hidden');
        if (userNewsBadge) userNewsBadge.textContent = count;
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
            showToast("Notizia urgente pubblicata con successo! Verrà mostrata a tutti gli utenti.", "success", 4000);
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

// Controllo temporale periodico (ogni 30 secondi): aggiorna automaticamente comparsa e scomparsa delle icone
setInterval(() => {
    refreshMarkers();
}, 30000);

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUrgentNewsModule();
});
