// Versione del software
const APP_VERSION = '3.6.8';

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

// --- DATABASE MERCATI SETTIMANALI DELLA PROVINCIA DI FERRARA E LIMITROFI (118) ---
// Configurazione completa con programmazione ricorrente e coppie per evidenziare il tratto stradale / piazza
const DEFAULT_WEEKLY_MARKETS = [
    // 1. FERRARA - Centro (Venerdì) - Piazza Travaglio / Via Kennedy / Baluardi
    {
        id: 'mkt_fe_ven_1',
        lat: 44.83155,
        lng: 11.62145,
        type: 'mercato',
        street: 'Piazza Travaglio / Via Kennedy, Ferrara',
        segmentId: 'mercato_fe_ven',
        note: 'Mercato settimanale del Venerdì - Area mercatale centrale',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:30' }
    },
    {
        id: 'mkt_fe_ven_2',
        lat: 44.83080,
        lng: 11.61860,
        type: 'mercato',
        street: 'Piazza Travaglio / Via Kennedy, Ferrara',
        segmentId: 'mercato_fe_ven',
        note: 'Mercato settimanale del Venerdì - Via Kennedy e Baluardi',
        schedule: { mode: 'recurring', days: [5], timeStart: '06:00', timeEnd: '14:30' }
    },

    // 3. FERRARA - Barco (Martedì)
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
// GEOMETRIA STRADALE da OpenStreetMap (OSRM Driving & Bicycle Engine)
// Segue fedelmente tutte le curve e i tratti della strada (Statali, Tangenziali, Svincoli e vie comunali)
// - Cache persistente locale v17 (istantaneo ai successivi caricamenti)
// - Per vie locali (es. Via Ruffetta): segue fedelmente ogni curva della via ed esclude deviazioni su SP4
// - Per arterie e svincoli/rampe (es. RA8, SS16): segue la carreggiata e lo svincolo
// -------------------------------------------------------

let streetGeomCache = {};
try {
    const cached = localStorage.getItem('ferrara_street_cache_v17');
    if (cached) streetGeomCache = JSON.parse(cached);
} catch (e) {
    streetGeomCache = {};
}

function saveStreetGeomCache() {
    try {
        localStorage.setItem('ferrara_street_cache_v17', JSON.stringify(streetGeomCache));
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

// Helper per scaricare il tracciato da endpoint OSRM
async function fetchOsrmRoute(url, isReverse = false) {
    try {
        let signal;
        if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
            signal = AbortSignal.timeout(4000);
        }
        const response = await fetch(url, signal ? { signal } : {});
        if (response.ok) {
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                let coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                if (isReverse) coords = coords.slice().reverse();
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

// Calcola il percorso reale tra due punti (anche su rampe a senso unico, svincoli e curve strette)
// e garantisce che per le vie locali (es. Via Ruffetta) non si devii mai su provinciali (SP4) o statali
async function routeBetweenPoints(lat1, lng1, lat2, lng2, targetStreetName = '') {
    const directDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    const isHighway = isMajorHighway(targetStreetName);
    const isRamp = targetStreetName.toLowerCase().includes('ramp') || targetStreetName.toLowerCase().includes('svincolo') || targetStreetName.includes('/');
    const normTarget = normalizeStreetKey(targetStreetName);

    // Endpoints in ordine di priorità:
    // Per arterie e rampe: usa i profili automobilistici ad alta precisione
    // Per vie locali (es. Via Ruffetta): usa profili bicycle/foot per seguire esattamente il tracciato locale della via senza deviare sulla SP4
    const endpoints = (isHighway || isRamp)
        ? [
            { url: `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
            { url: `https://router.project-osrm.org/route/v1/driving/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
            { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
            { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
            { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false }
        ]
        : [
            { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
            { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
            { url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false },
            { url: `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lng2},${lat2};${lng1},${lat1}?geometries=geojson&overview=full&steps=true`, rev: true },
            { url: `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=true`, rev: false }
        ];

    let bestCoords = null;
    let maxMatchedDist = -1;
    let bestDistDiff = Infinity;

    for (const ep of endpoints) {
        const res = await fetchOsrmRoute(ep.url, ep.rev);
        if (res && res.coords && res.coords.length >= 2) {
            // Se è una via locale, controlla che il percorso non sia deviato su una provinciale o statale (es. SP4)
            if (!isHighway && !isRamp) {
                let hasHighwayDetour = false;
                if (res.steps && res.steps.length > 0) {
                    for (const step of res.steps) {
                        const normStep = (step.name || '').toLowerCase();
                        if (normStep.includes('sp4') || normStep.includes('strada provinciale') || (normStep.includes('statale') && !targetStreetName.toLowerCase().includes('statale'))) {
                            hasHighwayDetour = true;
                            break;
                        }
                    }
                }
                if (hasHighwayDetour) continue; // Scarta categoricamente qualsiasi deviazione su SP4
            }

            let matchedDist = 0;
            if (normTarget && normTarget.length >= 3 && res.steps && res.steps.length > 0) {
                for (const step of res.steps) {
                    const normStep = normalizeStreetKey(step.name || '');
                    if (normStep && (normStep.includes(normTarget) || normTarget.includes(normStep))) {
                        matchedDist += step.distance;
                    }
                }
            }

            const distDiff = Math.abs(res.distance - directDist);

            if (!isRamp && normTarget && matchedDist > maxMatchedDist) {
                maxMatchedDist = matchedDist;
                bestCoords = res.coords;
                if (matchedDist >= directDist * 0.7 && res.coords.length > 2) {
                    return res.coords;
                }
            } else if (distDiff < bestDistDiff && res.coords.length > 2) {
                bestDistDiff = distDiff;
                bestCoords = res.coords;
                if (res.distance <= directDist * 2.2) {
                    return res.coords;
                }
            }
        }
    }

    if (bestCoords && bestCoords.length >= 2) {
        return bestCoords;
    }

    return [[lat1, lng1], [lat2, lng2]];
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

    // 3. Collega eventuali marker singoli vicini tra loro (es. estremità di rampe/svincoli tra SS16 e RA8)
    singleMarkers.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    const usedSingle = new Set();
    for (let i = 0; i < singleMarkers.length; i++) {
        if (usedSingle.has(i)) continue;
        const m1 = singleMarkers[i];
        let bestJ = -1;
        let minDist = 2500; // Massimo 2.5 km per collegare due punti di una rampa/svincolo

        for (let j = i + 1; j < singleMarkers.length; j++) {
            if (usedSingle.has(j)) continue;
            const m2 = singleMarkers[j];
            const d = calculateDistanceMeters(m1.lat, m1.lng, m2.lat, m2.lng);
            if (d < minDist) {
                minDist = d;
                bestJ = j;
            }
        }

        if (bestJ !== -1) {
            const m2 = singleMarkers[bestJ];
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

    // 5. Disegna subito le linee sulla mappa (cache o coordinate dirette)
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
                    if (localId === 'mkt_fe_lun_1' || localId === 'mkt_fe_lun_2' || m.id === 'mkt_fe_lun_1' || m.id === 'mkt_fe_lun_2') {
                        return; // Rimosso su richiesta
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

            // Includi i mercati settimanali di default della provincia di Ferrara e territori limitrofi se non già presenti
            if (typeof DEFAULT_WEEKLY_MARKETS !== 'undefined' && Array.isArray(DEFAULT_WEEKLY_MARKETS)) {
                DEFAULT_WEEKLY_MARKETS.forEach(dm => {
                    if (!loadedIds.has(dm.id)) {
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
    const saved = localStorage.getItem('ferrara_viabilita_markers');
    markersData = [];
    const loadedIds = new Set();
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            parsed.forEach(m => {
                if (m.id === 'mkt_fe_lun_1' || m.id === 'mkt_fe_lun_2') return;
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

    // Includi i mercati settimanali di default della provincia di Ferrara e territori limitrofi se non già presenti
    if (typeof DEFAULT_WEEKLY_MARKETS !== 'undefined' && Array.isArray(DEFAULT_WEEKLY_MARKETS)) {
        DEFAULT_WEEKLY_MARKETS.forEach(dm => {
            if (!loadedIds.has(dm.id)) {
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
        addMarker(m.lat, m.lng, m.type, m.id, false, m.note, m.fbKey || null, m.street || null, m.schedule || null, m.segmentId || null);
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
// MODULO NAVIGATORE SOCCORSO 118 (MOBILE & DESKTOP)
// - Calcolo percorsi con proposta di 2 opzioni (se presenti)
// - Esclusione automatica strade interrotte / sagre / mercati
// - Allerta visivo immediato se la destinazione è in area chiusa
// - Transito ZTL ammesso e valorizzato per massima celerità
// - Guida Turn-by-Turn con tracciamento GPS veicolo
// =======================================================

// =======================================================
// MODULO NAVIGATORE 118 CON DEVIAZIONI DI EMERGENZA,
// GUIDA VOCALE FEMMINILE E 3 SCELTE DI PERCORSO (v3.6.3)
// =======================================================

// --- MODULO SINTESI VOCALE NAVIGATORE (Voce Femminile & Doppio Avviso) ---
const VoiceNavigator = {
    enabled: true,
    synth: (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null,
    preferredVoice: null,
    init() {
        try {
            const saved = localStorage.getItem('nav_voice_enabled');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
        } catch (e) { }
        this.loadVoices();
        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    },
    loadVoices() {
        if (!this.synth) return;
        const voices = this.synth.getVoices() || [];
        const italianVoices = voices.filter(v => v.lang && (v.lang.startsWith('it') || v.lang.toLowerCase().includes('ita')));

        // Cerca con priorità voci femminili italiane
        const femaleKeywords = ['alice', 'elsa', 'federica', 'chiara', 'giulia', 'elena', 'cosimo', 'female', 'donna', 'google italiano', 'natural'];
        let selected = italianVoices.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
        if (!selected && italianVoices.length > 0) {
            selected = italianVoices[0];
        }
        this.preferredVoice = selected || null;
    },
    speak(text, priority = false) {
        if (!this.enabled || !this.synth || !text) return;
        try {
            if (priority || this.synth.speaking) {
                this.synth.cancel();
            }
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'it-IT';
            if (this.preferredVoice) {
                utter.voice = this.preferredVoice;
            }
            // Timbro e intonazione femminile chiara e squillante
            utter.pitch = 1.15;
            utter.rate = 1.02;
            utter.volume = 1.0;
            this.synth.speak(utter);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    },
    stop() {
        if (this.synth) {
            try { this.synth.cancel(); } catch (e) { }
        }
    },
    toggleMute() {
        this.enabled = !this.enabled;
        try {
            localStorage.setItem('nav_voice_enabled', this.enabled ? 'true' : 'false');
        } catch (e) { }
        this.updateButtonState();
        if (this.enabled) {
            this.speak("Indicazioni vocali attivate", true);
        } else {
            this.stop();
        }
        return this.enabled;
    },
    updateButtonState() {
        const btn = document.getElementById('hud-voice-btn');
        if (btn) {
            if (this.enabled) {
                btn.textContent = '🔊';
                btn.classList.remove('muted');
                btn.title = "Voce attiva (tocca per silenziare)";
            } else {
                btn.textContent = '🔇';
                btn.classList.add('muted');
                btn.title = "Voce silenziata (tocca per attivare)";
            }
        }
    }
};

let navStartPoint = null; // { lat, lng, label }
let navDestPoint = null;  // { lat, lng, label }
let navPickerMode = null; // 'start' | 'dest' | null
let navRoutes = [];       // Array fino a 3 percorsi
let activeNavRouteIdx = 0;
let navRouteLayers = [];
let navMarkerStart = null;
let navMarkerDest = null;
let guidanceActive = false;
let guidanceWatchId = null;
let vehicleMarker = null;

// Configurazione grafica e semantica per i 3 percorsi
const ROUTE_CONFIGS = [
    { color: '#2563eb', altColor: '#1d4ed8', name: 'Percorso 1 (Consigliato)', dotColor: '#2563eb', badgeClass: 'fastest', badgeText: '⚡ Più Veloce', titleFallback: 'Percorso 1 (Più Veloce)' },
    { color: '#059669', altColor: '#047857', name: 'Percorso 2 (Alternativa 1)', dotColor: '#059669', badgeClass: 'alt1', badgeText: '🌿 Alternativa 1', titleFallback: 'Percorso 2 (Alternativa 1)' },
    { color: '#7c3aed', altColor: '#6d28d9', name: 'Percorso 3 (Alternativa 2)', dotColor: '#7c3aed', badgeClass: 'alt2', badgeText: '🟣 Alternativa 2', titleFallback: 'Percorso 3 (Alternativa 2)' }
];

// Stato della sessione di guida Turn-by-Turn attiva
let guidanceState = {
    active: false,
    route: null,
    currentStepIdx: 0,
    announced100m: new Set(),
    announcedImmediate: new Set(),
    lastPosition: null,
    isRerouting: false,
    lastRerouteTime: 0,
    offRouteStreak: 0,
    arrivedAnnounced: false
};

// Inizializza i listener del Navigatore
function initNavigationModule() {
    const navBtn = document.getElementById('nav-btn');
    const closeNavBtn = document.getElementById('close-nav-btn');
    const navStartGpsBtn = document.getElementById('nav-start-gps-btn');
    const navStartMapBtn = document.getElementById('nav-start-map-btn');
    const navDestMapBtn = document.getElementById('nav-dest-map-btn');
    const navCalcBtn = document.getElementById('nav-calc-btn');
    const navToggleStepsBtn = document.getElementById('nav-toggle-steps-btn');
    const navStartGuidanceBtn = document.getElementById('nav-start-guidance-btn');
    const navClearBtn = document.getElementById('nav-clear-btn');
    const hudStopBtn = document.getElementById('hud-stop-btn');
    const hudVoiceBtn = document.getElementById('hud-voice-btn');
    const navStartInput = document.getElementById('nav-start-input');
    const navDestInput = document.getElementById('nav-dest-input');

    if (navBtn) navBtn.addEventListener('click', toggleNavPanel);
    if (closeNavBtn) closeNavBtn.addEventListener('click', closeNavPanel);
    if (navStartGpsBtn) navStartGpsBtn.addEventListener('click', setNavStartToGps);
    if (navStartMapBtn) navStartMapBtn.addEventListener('click', () => startNavMapPick('start'));
    if (navDestMapBtn) navDestMapBtn.addEventListener('click', () => startNavMapPick('dest'));
    if (navCalcBtn) navCalcBtn.addEventListener('click', handleCalculateNav);
    if (navToggleStepsBtn) navToggleStepsBtn.addEventListener('click', toggleNavSteps);
    if (navStartGuidanceBtn) navStartGuidanceBtn.addEventListener('click', startTurnByTurnGuidance);
    if (navClearBtn) navClearBtn.addEventListener('click', clearNavRoutes);
    if (hudStopBtn) hudStopBtn.addEventListener('click', stopTurnByTurnGuidance);
    if (hudVoiceBtn) hudVoiceBtn.addEventListener('click', () => VoiceNavigator.toggleMute());

    if (navStartInput) {
        navStartInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalculateNav();
        });
    }
    if (navDestInput) {
        navDestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalculateNav();
        });
    }

    VoiceNavigator.init();
    VoiceNavigator.updateButtonState();
}

function toggleNavPanel() {
    const navPanel = document.getElementById('nav-panel');
    if (!navPanel) return;
    if (navPanel.classList.contains('hidden')) {
        openNavPanel();
    } else {
        closeNavPanel();
    }
}

function openNavPanel() {
    const navPanel = document.getElementById('nav-panel');
    if (!navPanel) return;
    navPanel.classList.remove('hidden');

    if (!navStartPoint) {
        setNavStartToGps(false);
    }
}

function closeNavPanel() {
    const navPanel = document.getElementById('nav-panel');
    if (!navPanel) return;
    navPanel.classList.add('hidden');
    navPickerMode = null;
    const pickerBanner = document.getElementById('picker-banner');
    if (pickerBanner) pickerBanner.classList.add('hidden');
}

// Imposta la partenza sulla posizione GPS attuale
function setNavStartToGps(showToastMsg = true) {
    const startInput = document.getElementById('nav-start-input');
    if (startInput) startInput.value = "Rilevamento GPS in corso...";

    if (!navigator.geolocation) {
        if (startInput) startInput.value = "";
        if (showToastMsg) showToast("Geolocalizzazione non supportata dal browser.", "error");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            navStartPoint = { lat, lng, label: "Posizione GPS attuale" };
            if (startInput) startInput.value = "📍 La mia posizione";
            if (showToastMsg) showToast("📍 Posizione GPS impostata come partenza.", "success");
        },
        (err) => {
            console.warn("GPS error:", err.message);
            const center = map.getCenter();
            navStartPoint = { lat, lng: center.lng, label: "Centro Mappa" };
            if (startInput) startInput.value = "📍 Centro mappa Ferrara";
            if (showToastMsg) showToast("Impossibile rilevare GPS. Impostato centro mappa.", "normal");
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// Avvia la selezione su mappa per partenza o arrivo
function startNavMapPick(mode) {
    navPickerMode = mode;
    const pickerBanner = document.getElementById('picker-banner');
    const bannerText = pickerBanner ? pickerBanner.querySelector('.picker-banner-text') : null;
    if (bannerText) {
        bannerText.textContent = mode === 'start'
            ? 'Tocca la mappa per indicare il punto di PARTENZA'
            : 'Tocca la mappa per indicare la DESTINAZIONE';
    }
    if (pickerBanner) pickerBanner.classList.remove('hidden');
    showToast(mode === 'start' ? "Tocca la mappa per scegliere la Partenza" : "Tocca la mappa per scegliere la Destinazione", "normal", 3000);
}

// Gestisce il punto cliccato su mappa
async function handleNavMapPicked(mode, lat, lng) {
    const street = await reverseGeocode(lat, lng);
    const label = street ? `${street}, Ferrara` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (mode === 'start') {
        navStartPoint = { lat, lng, label };
        const startInput = document.getElementById('nav-start-input');
        if (startInput) startInput.value = label;
        showToast(`📍 Partenza impostata: ${street || 'Punto mappa'}`, "success");
    } else {
        navDestPoint = { lat, lng, label };
        const destInput = document.getElementById('nav-dest-input');
        if (destInput) destInput.value = label;
        showToast(`🏁 Destinazione impostata: ${street || 'Punto mappa'}`, "success");
    }

    openNavPanel();
}

// Geocodifica un testo di indirizzo
async function geocodeAddressQuery(query) {
    if (!query || query.trim() === '') return null;
    const clean = query.replace(/^📍\s*/, '').trim();
    try {
        const searchQuery = encodeURIComponent(clean.includes('Ferrara') ? clean : `${clean}, Ferrara`);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    label: data[0].display_name.split(',')[0]
                };
            }
        }
    } catch (e) {
        console.warn("Geocoding error:", e);
    }
    return null;
}

// Calcola la distanza minima in metri tra un punto P e un segmento stradale AB (coordinate geografiche)
function distPointToSegmentMeters(pLat, pLng, lat1, lng1, lat2, lng2) {
    const latMid = (lat1 + lat2) / 2;
    const cosLat = Math.cos(latMid * Math.PI / 180);

    const x1 = (lng1 - pLng) * 111320 * cosLat;
    const y1 = (lat1 - pLat) * 110540;
    const x2 = (lng2 - pLng) * 111320 * cosLat;
    const y2 = (lat2 - pLat) * 110540;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq < 1e-6) {
        return Math.sqrt(x1 * x1 + y1 * y1);
    }

    let t = -(x1 * dx + y1 * dy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt(projX * projX + projY * projY);
}

// Calcola la distanza minima reale in metri tra un punto e l'intera geometria di un percorso
function distPointToPolylineMeters(pLat, pLng, coords) {
    if (!coords || coords.length === 0) return Infinity;
    if (coords.length === 1) return calculateDistanceMeters(pLat, pLng, coords[0][0], coords[0][1]);

    let minDist = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
        const d = distPointToSegmentMeters(
            pLat, pLng,
            coords[i][0], coords[i][1],
            coords[i + 1][0], coords[i + 1][1]
        );
        if (d < minDist) {
            minDist = d;
            if (minDist < 5) break;
        }
    }
    return minDist;
}

// Calcola la distanza chilometrica residua lungo il percorso a partire dalla posizione del mezzo
function calcRemainingDistanceKm(pLat, pLng, coords) {
    if (!coords || coords.length === 0) return "0.0";
    if (coords.length === 1) return (calculateDistanceMeters(pLat, pLng, coords[0][0], coords[0][1]) / 1000).toFixed(1);

    let closestSegIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
        const d = distPointToSegmentMeters(pLat, pLng, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
        if (d < minDist) {
            minDist = d;
            closestSegIdx = i;
        }
    }

    let totalMeters = calculateDistanceMeters(pLat, pLng, coords[closestSegIdx + 1][0], coords[closestSegIdx + 1][1]);
    for (let i = closestSegIdx + 1; i < coords.length - 1; i++) {
        totalMeters += calculateDistanceMeters(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    }

    return (totalMeters / 1000).toFixed(1);
}

// Rileva tutti gli ostacoli e le strade chiuse attive al momento
// NOTA IMPORTANTE: 'semaforo' corrisponde al Senso Unico Alternato e NON è un blocco/interruzione (non richiede deviazione)
function getActiveNavigationObstacles(destLat = null, destLng = null) {
    const pointObstacles = [];
    const polylineObstacles = [];
    // Tipi bloccanti da aggirare obbligatoriamente (interruzioni stradali, ponti crollati/interrotti, sagome basse, mercati, sagre)
    const BLOCKING_TYPES = ['chiusa', 'lavori', 'ponte', 'mercato', 'sagra', 'incidente'];

    // 1. Aggiungi restrizioni di sagoma/altezza provinciali (se l'altezza o larghezza utile è inferiore alle specifiche dell'ambulanza 118)
    if (typeof PROVINCIAL_CLEARANCE_RESTRICTIONS !== 'undefined' && Array.isArray(PROVINCIAL_CLEARANCE_RESTRICTIONS)) {
        PROVINCIAL_CLEARANCE_RESTRICTIONS.forEach(clr => {
            const heightIncompatible = clr.maxHeight && clr.maxHeight < AMBULANCE_SPECS.maxHeightMeters;
            const widthIncompatible = clr.maxWidth && clr.maxWidth < AMBULANCE_SPECS.maxWidthMeters;
            if (heightIncompatible || widthIncompatible) {
                pointObstacles.push({
                    lat: clr.lat,
                    lng: clr.lng,
                    type: 'sagoma',
                    street: clr.name,
                    note: `Limite sagoma/altezza: ${clr.maxHeight ? clr.maxHeight + 'm alt. ' : ''}${clr.maxWidth ? clr.maxWidth + 'm largh.' : ''} (Ambulanza richiede min ${AMBULANCE_SPECS.maxHeightMeters}m x ${AMBULANCE_SPECS.maxWidthMeters}m)`,
                    isDestinationTarget: false
                });
            }
        });
    }

    markersData.forEach(m => {
        if (!isMarkerVisible(m)) return;
        if (getMarkerScheduleStatus(m) !== 'active') return;

        if (BLOCKING_TYPES.includes(m.type)) {
            let isDestinationTarget = false;
            if (destLat !== null && destLng !== null) {
                const distToDest = calculateDistanceMeters(destLat, destLng, m.lat, m.lng);
                if (distToDest < 85) {
                    isDestinationTarget = true;
                }
            }

            pointObstacles.push({
                lat: m.lat,
                lng: m.lng,
                type: m.type,
                street: m.street || 'Tratto stradale',
                note: m.note || '',
                isDestinationTarget: isDestinationTarget
            });
        }
    });

    // Tratti rossi continui attivi
    Object.keys(activeSegments).forEach(key => {
        const polyline = activeSegments[key];
        if (polyline && polyline.getLatLngs) {
            const lls = polyline.getLatLngs();
            if (Array.isArray(lls) && lls.length > 0) {
                const coords = lls.map(ll => [ll.lat, ll.lng]);
                let isDestinationTarget = false;
                if (destLat !== null && destLng !== null) {
                    for (const c of coords) {
                        if (calculateDistanceMeters(destLat, destLng, c[0], c[1]) < 65) {
                            isDestinationTarget = true;
                            break;
                        }
                    }
                }
                polylineObstacles.push({
                    coords: coords,
                    name: key,
                    isDestinationTarget: isDestinationTarget
                });
            }
        }
    });

    return { pointObstacles, polylineObstacles };
}

// Verifica se la destinazione ricade all'interno di un'area chiusa/interrotta o evento
function checkDestinationObstacle(destLat, destLng, obstacles) {
    for (const po of obstacles.pointObstacles) {
        const d = calculateDistanceMeters(destLat, destLng, po.lat, po.lng);
        if (d < 85) {
            return {
                isBlocked: true,
                street: po.street,
                type: po.type,
                note: po.note
            };
        }
    }

    for (const seg of obstacles.polylineObstacles) {
        for (let i = 0; i < seg.coords.length; i++) {
            const [cLat, cLng] = seg.coords[i];
            const d = calculateDistanceMeters(destLat, destLng, cLat, cLng);
            if (d < 65) {
                return {
                    isBlocked: true,
                    street: seg.name || 'Strada chiusa',
                    type: 'chiusa',
                    note: 'Tratto interrotto'
                };
            }
        }
    }

    return { isBlocked: false };
}

// Verifica se un percorso interseca ostacoli attivi da evitare
function evaluateRouteObstacles(routeCoords, obstacles) {
    let intersects = false;
    let reasons = [];
    let collidedObstacles = [];

    const avoidablePoints = (obstacles.pointObstacles || []).filter(po => !po.isDestinationTarget);
    const avoidablePolys = (obstacles.polylineObstacles || []).filter(po => !po.isDestinationTarget);

    for (const po of avoidablePoints) {
        const threshold = (po.type === 'sagra' || po.type === 'mercato') ? 60 : 42;
        const d = distPointToPolylineMeters(po.lat, po.lng, routeCoords);

        if (d < threshold) {
            intersects = true;
            const typeLabel = po.type === 'ponte' ? 'Ponte interrotto' :
                              po.type === 'sagoma' ? 'Limite sagoma/altezza (Incompatibile con ambulanza)' :
                              po.type === 'lavori' ? 'Lavori in corso' :
                              po.type === 'chiusa' ? 'Strada chiusa' :
                              po.type === 'mercato' ? 'Mercato' :
                              po.type === 'sagra' ? 'Sagra/Fiera' : 'Ostacolo';
            const rText = `${typeLabel} (${po.street || 'strada'})`;
            if (!reasons.includes(rText)) reasons.push(rText);
            collidedObstacles.push(po);
        }
    }

    for (const poly of avoidablePolys) {
        for (const [pLat, pLng] of poly.coords) {
            const d = distPointToPolylineMeters(pLat, pLng, routeCoords);
            if (d < 40) {
                intersects = true;
                const rText = `Tratto chiuso (${poly.name || 'strada'})`;
                if (!reasons.includes(rText)) reasons.push(rText);
                collidedObstacles.push({ lat: pLat, lng: pLng, type: 'chiusa', street: poly.name });
                break;
            }
        }
    }

    return {
        intersects: intersects,
        reasons: reasons,
        collidedObstacles: collidedObstacles
    };
}

// Genera automaticamente DEVIAZIONI PIÙ BREVI E IMMEDIATE attorno ai blocchi
// Utilizza micro-raggi stretti (a partire da 35m) per imboccare subito la prima via limitrofa
async function calculateDetourRoutes(startLat, startLng, destLat, destLng, obstacles, collidedObstacles, directCoords = []) {
    const candidateDetours = [];
    const testedWaypoints = [];

    const uniqueObstacles = [];
    for (const obs of collidedObstacles) {
        const already = uniqueObstacles.some(u => calculateDistanceMeters(u.lat, u.lng, obs.lat, obs.lng) < 45);
        if (!already) uniqueObstacles.push(obs);
    }

    function calcEmergencyDuration(distanceMeters, osrmCarDuration = null) {
        const distKm = distanceMeters / 1000;
        if (osrmCarDuration && osrmCarDuration > 0) {
            const carMin = Math.round(osrmCarDuration / 60);
            return Math.max(1, Math.min(carMin, Math.round((distKm / 40) * 60)));
        }
        return Math.max(1, Math.round((distKm / 36) * 60));
    }

    for (const obs of uniqueObstacles) {
        const obsLat = obs.lat;
        const obsLng = obs.lng;

        let dLat = destLat - startLat;
        let dLng = destLng - startLng;

        if (directCoords && directCoords.length > 2) {
            let closestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < directCoords.length; i++) {
                const dist = calculateDistanceMeters(directCoords[i][0], directCoords[i][1], obsLat, obsLng);
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = i;
                }
            }
            const preIdx = Math.max(0, closestIdx - 3);
            const postIdx = Math.min(directCoords.length - 1, closestIdx + 3);
            if (preIdx !== postIdx) {
                dLat = directCoords[postIdx][0] - directCoords[preIdx][0];
                dLng = directCoords[postIdx][1] - directCoords[preIdx][1];
            }
        }

        const latMeters = dLat * 111000;
        const lngMeters = dLng * 111000 * Math.cos(obsLat * Math.PI / 180);
        const len = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters) || 1;

        const perp1Lat = -lngMeters / len;
        const perp1Lng = latMeters / len;
        const perp2Lat = lngMeters / len;
        const perp2Lng = -latMeters / len;

        // Raggi stretti e immediati per minimizzare l'allungamento del percorso
        const lateralOffsets = [35, 65, 110, 160, 240, 360, 520, 750, 1100];
        const radialOffsets = [45, 85, 140, 220, 340, 550, 850];

        const waypointsToTry = [];

        for (const off of lateralOffsets) {
            const w1Lat = obsLat + (perp1Lat * off) / 111000;
            const w1Lng = obsLng + (perp1Lng * off) / (111000 * Math.cos(obsLat * Math.PI / 180));
            waypointsToTry.push({ lat: w1Lat, lng: w1Lng, offset: off });

            const w2Lat = obsLat + (perp2Lat * off) / 111000;
            const w2Lng = obsLng + (perp2Lng * off) / (111000 * Math.cos(obsLat * Math.PI / 180));
            waypointsToTry.push({ lat: w2Lat, lng: w2Lng, offset: off });
        }

        for (const off of radialOffsets) {
            const dDegLat = off / 111000;
            const dDegLng = off / (111000 * Math.cos(obsLat * Math.PI / 180));
            waypointsToTry.push({ lat: obsLat + dDegLat, lng: obsLng, offset: off });
            waypointsToTry.push({ lat: obsLat - dDegLat, lng: obsLng, offset: off });
            waypointsToTry.push({ lat: obsLat, lng: obsLng + dDegLng, offset: off });
            waypointsToTry.push({ lat: obsLat, lng: obsLng - dDegLng, offset: off });
        }

        for (const wp of waypointsToTry) {
            let wpCollides = false;
            for (const po of (obstacles.pointObstacles || [])) {
                if (!po.isDestinationTarget && calculateDistanceMeters(wp.lat, wp.lng, po.lat, po.lng) < 50) {
                    wpCollides = true;
                    break;
                }
            }
            if (wpCollides) continue;

            const alreadyTested = testedWaypoints.some(tw => calculateDistanceMeters(tw.lat, tw.lng, wp.lat, wp.lng) < 35);
            if (alreadyTested) continue;
            testedWaypoints.push(wp);

            const routerEndpoints = [
                { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${startLng},${startLat};${wp.lng},${wp.lat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isZtl: true },
                { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${wp.lng},${wp.lat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isZtl: false }
            ];

            for (const ep of routerEndpoints) {
                try {
                    const resp = await fetch(ep.url);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                            const r = data.routes[0];
                            const rCoords = r.geometry.coordinates.map(c => [c[1], c[0]]);
                            const check = evaluateRouteObstacles(rCoords, obstacles);

                            if (!check.intersects) {
                                const rawSteps = [];
                                if (r.legs) {
                                    r.legs.forEach(leg => {
                                        if (leg.steps) rawSteps.push(...leg.steps);
                                    });
                                }

                                // Verifica compatibilità della strada con i mezzi di soccorso 118 (esclude vicoli angusti / percorsi ciclabili)
                                if (typeof isRouteSuitableForEmergency === 'function' && !isRouteSuitableForEmergency(rawSteps, destLat, destLng)) {
                                    continue;
                                }

                                const distKm = (r.distance / 1000).toFixed(1);
                                const durMin = ep.isZtl
                                    ? calcEmergencyDuration(r.distance, null)
                                    : calcEmergencyDuration(r.distance, r.duration);

                                candidateDetours.push({
                                    isDetour: true,
                                    coords: rCoords,
                                    distanceKm: distKm,
                                    durationMin: durMin,
                                    distanceRaw: r.distance,
                                    intersectsBlock: false,
                                    blockReasons: check.reasons,
                                    avoidedObstacles: obs.street ? [obs.street] : [],
                                    steps: formatManeuverSteps(rawSteps),
                                    rawSteps: rawSteps
                                });

                                if (candidateDetours.length >= 8) break;
                            }
                        }
                    }
                } catch (e) { }
            }

            if (candidateDetours.length >= 8) break;
        }
    }

    return candidateDetours;
}

// Formatta i passi di svolta turn-by-turn con istruzioni vocali (anticipate ed immediate)
function formatManeuverSteps(rawSteps) {
    return rawSteps.map(step => {
        const type = step.maneuver ? step.maneuver.type : '';
        const modifier = step.maneuver ? step.maneuver.modifier : '';
        const street = step.name ? step.name.trim() : '';
        const streetLabel = street || 'la strada';
        const streetVoice = street ? `in ${street}` : 'sulla strada';
        const dist = Math.round(step.distance);

        let icon = '⬆️';
        let text = street ? `Prosegui su ${street}` : 'Prosegui dritto';
        let actionAdvance = street ? `continua dritto su ${street}` : 'continua dritto';
        let actionImmediate = street ? `prosegui dritto su ${street}` : 'prosegui dritto';

        if (type === 'depart') {
            icon = '🏁';
            text = street ? `Parti su ${street}` : 'Parti lungo il percorso';
            actionAdvance = street ? `parti su ${street}` : 'parti lungo il percorso';
            actionImmediate = street ? `parti in direzione di ${street}` : 'parti';
        } else if (type === 'arrive') {
            icon = '📍';
            text = `Arrivo a destinazione ${street ? `(${street})` : ''}`;
            actionAdvance = `sei quasi arrivato a destinazione ${streetVoice}`;
            actionImmediate = `sei arrivato a destinazione!`;
        } else if (modifier && modifier.includes('sharp right')) {
            icon = '↪️';
            text = `Curva a destra su ${streetLabel}`;
            actionAdvance = `curva a destra ${streetVoice}`;
            actionImmediate = `curva a destra ${streetVoice}`;
        } else if (modifier && modifier.includes('sharp left')) {
            icon = '↩️';
            text = `Curva a sinistra su ${streetLabel}`;
            actionAdvance = `curva a sinistra ${streetVoice}`;
            actionImmediate = `curva a sinistra ${streetVoice}`;
        } else if (modifier && modifier.includes('slight right')) {
            icon = '↗️';
            text = `Tieni la destra verso ${streetLabel}`;
            actionAdvance = `tieni la destra verso ${streetLabel}`;
            actionImmediate = `tieni la destra ${streetVoice}`;
        } else if (modifier && modifier.includes('slight left')) {
            icon = '↖️';
            text = `Tieni la sinistra verso ${streetLabel}`;
            actionAdvance = `tieni la sinistra verso ${streetLabel}`;
            actionImmediate = `tieni la sinistra ${streetVoice}`;
        } else if (modifier && modifier.includes('right')) {
            icon = '↱';
            text = `Svolta a destra su ${streetLabel}`;
            actionAdvance = `svolta a destra ${streetVoice}`;
            actionImmediate = `svolta a destra ${streetVoice}`;
        } else if (modifier && modifier.includes('left')) {
            icon = '↰';
            text = `Svolta a sinistra su ${streetLabel}`;
            actionAdvance = `svolta a sinistra ${streetVoice}`;
            actionImmediate = `svolta a sinistra ${streetVoice}`;
        } else if (type && (type.includes('rotary') || type.includes('roundabout'))) {
            icon = '🔄';
            const exitNum = step.maneuver && step.maneuver.exit ? step.maneuver.exit : '';
            const exitText = exitNum ? `la ${exitNum}ª uscita` : "l'uscita";
            text = `Alla rotonda prendi ${exitText} verso ${streetLabel}`;
            actionAdvance = `alla rotonda prendi ${exitText} verso ${streetLabel}`;
            actionImmediate = `ora prendi ${exitText} verso ${streetLabel}`;
        }

        return {
            icon,
            text,
            actionAdvance,
            actionImmediate,
            distText: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`,
            distMeters: dist,
            street: street || 'Strada',
            location: step.maneuver && step.maneuver.location ? [step.maneuver.location[1], step.maneuver.location[0]] : null
        };
    });
}

// -------------------------------------------------------
// ASSI AUTORIZZATI DI SCORRIMENTO 118 IN ZTL & CENTRO STORICO
// (Sempre consentiti per il transito rapido del mezzo di soccorso)
// -------------------------------------------------------
const AUTHORIZED_EMERGENCY_CORRIDORS = [
    'corso martiri della liberta', 'martiri della liberta', 'corso martiri', 'martiri',
    'largo castello', 'piazza castello', 'piazza cattedrale', 'piazza repubblica', 'piazza savonarola',
    'corso porta reno', 'porta reno', 'piazza travaglio', 'via kennedy', 'kennedy',
    'corso giovecca', 'giovecca', 'viale cavour', 'cavour',
    'corso ercole i d\'este', 'ercole i d\'este',
    'corso porta mare', 'porta mare', 'corso biagio rossetti', 'biagio rossetti', 'corso porta po', 'porta po',
    'corso isonzo', 'isonzo', 'via darsena', 'darsena', 'via bologna', 'bologna'
];

// Strade e vicoli medievali angusti o percorsi ciclopedonali non carrabili
const NARROW_AND_UNSUITABLE_STREETS = [
    // Vicoli e strade medievali a sagoma ridotta / curve cieche
    'via delle volte', 'capo delle volte', 'delle volte',
    'via delle vecchie', 'via colomba', 'via della luna', 'via del granchio',
    'via zemola', 'via voltacasalo', 'via fassolo', 'via cammello', 'via brasavola',
    'via guglielmo degli adelardi', 'degli adelardi', 'via adelardi',
    'via vignatagliata', 'via vittoria', 'via gattamarcia',
    'vicolo dei duelli', 'vicolo del leoncorno', 'vicolo mozzo', 'vicolo del chiozzino',
    'vicolo colombara', 'vicolo boccacanale', 'vicolo del carbone', 'vicolo zenzalo',
    'vicolo san paolo', 'vicolo del follo', 'vicolo lupi', 'vicolo agnello', 'vicolo torto',
    'vicolo ',
    // Tratti pedonali angusti non carrabili
    'via san romano', 'via mazzini', 'via contrari', 'via fondobanchetto',
    'via coperta', 'via gusmaria', 'via del turco', 'via carlo mayr',
    'via delle scotte', 'via gorgadello', 'via canonica',
    // Piste ciclabili e percorsi sterrati/pedonali esclusivi
    'pista ciclabile', 'ciclopedonale', 'ciclabile', 'percorso ciclopedonale', 'pista ciclopedonale',
    'sottomura', 'sopramura', 'sottomura est', 'sottomura ovest', 'sottomura sud', 'sottomura nord',
    'parco urbano', 'scalinata', 'sentiero', 'passerella', 'tracciato ciclabile', 'footway', 'cycleway', 'steps'
];

// Verifica se un percorso contiene strade troppo strette o non confacenti ai mezzi di soccorso 118
function isRouteSuitableForEmergency(steps, destLat = null, destLng = null) {
    if (!steps || steps.length === 0) return true;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const rawName = (step.name || '').trim().toLowerCase();
        if (!rawName) continue;

        // Se è un asse primario autorizzato 118 (es. Corso Martiri della Libertà, Porta Reno, Giovecca, Cavour), è sempre valido
        const isAuthorizedCorridor = AUTHORIZED_EMERGENCY_CORRIDORS.some(auth => rawName.includes(auth));
        if (isAuthorizedCorridor) continue;

        // Se è l'ultimo passo o la destinazione finale, l'accesso di prossimità è consentito
        const isFinalStep = (i === steps.length - 1) || (step.maneuver && step.maneuver.type === 'arrive');
        if (isFinalStep) continue;

        const isUnsuitable = NARROW_AND_UNSUITABLE_STREETS.some(unfit => rawName.includes(unfit));
        if (isUnsuitable) {
            return false;
        }
    }
    return true;
}

// -------------------------------------------------------
// SPECIFICHE MEZZI DI SOCCORSO 118 & LIMITI DI SAGOMA / ALTEZZA
// (Standard Ambulanza Tipo A / MSA / MSB)
// -------------------------------------------------------
const AMBULANCE_SPECS = {
    maxHeightMeters: 2.80, // Altezza massima con barra lampeggianti e antenne (m)
    maxWidthMeters: 2.30,  // Larghezza minima utile con specchietti retrovisori (m)
    maxWeightTons: 3.8,    // Massa a pieno carico (t)
    canUseBusLanes: true,  // Autorizzazione corsie preferenziali Bus / Taxi TPER
    respectsOneWays: true, // Rispetto rigoroso dei sensi unici e direzioni di marcia ordinarie
    canUseFastTransit: true // Priorità di transito su tangenziali e arterie di scorrimento veloce
};

// Punti noti con limiti di sagoma/altezza o varchi angusti nel territorio provinciale
const PROVINCIAL_CLEARANCE_RESTRICTIONS = [
    {
        id: 'sottopasso_poletti',
        name: 'Sottopasso Ferroviario Via Poletti / Porta Catena',
        lat: 44.8465,
        lng: 11.6035,
        maxHeight: 2.50, // Inferiore a 2.80m -> Inaccessibile ad ambulanze rialzate
        maxWidth: 2.80,
        type: 'sagoma_bassa'
    },
    {
        id: 'arco_storico_angusto',
        name: 'Varco Storico Volto del Cavallo / Piazzetta Municipale',
        lat: 44.8362,
        lng: 11.6190,
        maxHeight: 2.60,
        maxWidth: 2.10, // Varco troppo stretto per ambulanza con specchietti
        type: 'varco_stretto'
    }
];

// Corsie preferenziali Bus & Taxi autorizzate per il 118 a Ferrara e provincia
const BUS_PREFERENTIAL_CORRIDORS = [
    { name: 'Corso Giovecca (Corsia Bus)', lat: 44.8365, lng: 11.6250, radius: 450 },
    { name: 'Viale Cavour (Corsia Riservata Bus/Taxi)', lat: 44.8385, lng: 11.6140, radius: 550 },
    { name: 'Corso Porta Reno (Corsia Bus)', lat: 44.8320, lng: 11.6190, radius: 350 },
    { name: 'Via Kennedy (Corsia Preferenziale)', lat: 44.8270, lng: 11.6190, radius: 250 },
    { name: 'Via Bologna (Corsia Bus Chiesuol del Fosso)', lat: 44.8080, lng: 11.6000, radius: 600 }
];

// Arterie e direttrici di scorrimento veloce (Tangenziali e Superstrade)
const FAST_TRANSIT_AXES = [
    { name: 'Tangenziale Ovest Ferrara (SS16 / Via Ferraresi)', lat: 44.8190, lng: 11.5900, radius: 2500 },
    { name: 'Tangenziale Est / Raccordo Sud (SS16 / Via Caldirolo)', lat: 44.8280, lng: 11.6450, radius: 2500 },
    { name: 'Raccordo Autostradale Ferrara-Porto Garibaldi (RA8)', lat: 44.7920, lng: 11.6700, radius: 6000 },
    { name: 'SS64 Porrettana (Direttrice Sud)', lat: 44.7650, lng: 11.5800, radius: 3500 },
    { name: 'Circonvallazione Isonzo / Po / Porta Mare', lat: 44.8410, lng: 11.6150, radius: 1800 }
];

// -------------------------------------------------------
// DEFINIZIONE GEOMETRICA ZTL PER TUTTA LA PROVINCIA DI FERRARA
// (Ferrara, Cento, Comacchio, Argenta, Bondeno, Portomaggiore, Copparo, Codigoro)
// -------------------------------------------------------

const PROVINCE_ZTL_REGIONS = [
    {
        id: 'ferrara_main',
        name: 'Ferrara - Centro Storico ZTL',
        polygon: [
            [44.8435, 11.6110], // Corso Porta Po / Barriere
            [44.8438, 11.6165], // Corso Biagio Rossetti ovest
            [44.8430, 11.6210], // Quadrivio degli Angeli (Corso Ercole I d'Este)
            [44.8420, 11.6260], // Corso Porta Mare ovest
            [44.8410, 11.6315], // Corso Porta Mare / Via Borgo dei Leoni
            [44.8395, 11.6360], // Corso Porta Mare / Mura est
            [44.8365, 11.6355], // Piazzale Medaglie d'Oro / Corso Giovecca est
            [44.8325, 11.6325], // Viale Alfonso I d'Este nord
            [44.8290, 11.6285], // Baluardo di San Rocco / Via Alfonso I d'Este sud
            [44.8268, 11.6235], // Porta San Pietro / Via Quartieri
            [44.8265, 11.6195], // Porta Paola / Piazza Travaglio / Via Kennedy
            [44.8272, 11.6150], // Via Darsena / Corso Porta Reno sud
            [44.8288, 11.6120], // Via Darsena / Corso Isonzo
            [44.8335, 11.6105], // Corso Isonzo centro
            [44.8375, 11.6108], // Corso Isonzo / Viale Cavour
            [44.8415, 11.6110]  // Corso Porta Po
        ],
        isCore: false
    },
    {
        id: 'ferrara_core',
        name: 'Ferrara - Nucleo Pedonale / ZTL A',
        polygon: [
            [44.8390, 11.6175], // Largo Castello nord-ovest
            [44.8390, 11.6225], // Corso Giovecca / Castello est
            [44.8365, 11.6245], // Via Terranuova / Savonarola
            [44.8320, 11.6235], // Via Saraceno / Via Carlo Mayr
            [44.8280, 11.6205], // Piazza Travaglio / Porta Reno sud
            [44.8285, 11.6165], // Via Piangipane / Baluardi ovest
            [44.8330, 11.6155], // Via Garibaldi ovest
            [44.8375, 11.6160]  // Viale Cavour / Largo Castello ovest
        ],
        isCore: true
    },
    {
        id: 'cento',
        name: 'Cento - Centro Storico ZTL',
        polygon: [
            [44.7310, 11.2860], // Via XXV Aprile nord
            [44.7315, 11.2925], // Circonvallazione est
            [44.7285, 11.2950], // Porta Bologna / Guercino
            [44.7250, 11.2940], // Via Cremonino sud
            [44.7240, 11.2880], // Via IV Novembre sud
            [44.7270, 11.2845]  // Viale Bonzagni ovest
        ],
        isCore: true
    },
    {
        id: 'comacchio',
        name: 'Comacchio - Centro Storico Trepponti / Canali',
        polygon: [
            [44.6970, 12.1780], // Via Cavour nord
            [44.6975, 12.1860], // Piazza Folegatti est
            [44.6925, 12.1870], // Via Sambertolo sud-est
            [44.6910, 12.1810], // Trepponti / Via Pescheria
            [44.6935, 12.1765]  // Via Fogli ovest
        ],
        isCore: true
    },
    {
        id: 'argenta',
        name: 'Argenta - Centro Storico ZTL',
        polygon: [
            [44.6175, 11.8320], // Piazza Garibaldi nord
            [44.6170, 11.8400], // Via Don Minzoni est
            [44.6120, 11.8390], // Via Mazzini sud
            [44.6125, 11.8310]  // Via Matteotti ovest
        ],
        isCore: true
    },
    {
        id: 'bondeno',
        name: 'Bondeno - Centro Storico ZTL',
        polygon: [
            [44.8920, 11.4120], // Piazza Garibaldi nord-ovest
            [44.8925, 11.4220], // Viale Repubblica est
            [44.8860, 11.4210], // Via Teodoro Bonati sud
            [44.8855, 11.4130]  // Borgo Fornasini ovest
        ],
        isCore: true
    },
    {
        id: 'portomaggiore',
        name: 'Portomaggiore - Centro Storico ZTL',
        polygon: [
            [44.7000, 11.8000], // Piazza Umberto I nord
            [44.7005, 11.8080], // Corso Vittorio Emanuele II est
            [44.6950, 11.8075], // Piazza Repubblica sud
            [44.6945, 11.7995]  // Via Bernagozzi ovest
        ],
        isCore: true
    },
    {
        id: 'copparo',
        name: 'Copparo - Centro Storico ZTL',
        polygon: [
            [44.8960, 11.7200], // Piazza del Popolo nord
            [44.8965, 11.7280], // Piazza Libertà / Via Roma est
            [44.8900, 11.7275], // Via Cavour sud
            [44.8895, 11.7195]  // Via Garibaldi ovest
        ],
        isCore: true
    },
    {
        id: 'codigoro',
        name: 'Codigoro - Centro Storico ZTL',
        polygon: [
            [44.8340, 12.1080], // Piazza Matteotti nord
            [44.8345, 12.1160], // Riviera Cavallotti est
            [44.8280, 12.1150], // Viale IV Novembre sud
            [44.8275, 12.1070]  // Viale Resistenza ovest
        ],
        isCore: true
    }
];

// Algoritmo Ray-Casting per verificare se un punto geografico ricade all'interno di un poligono
function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Rileva tutte le aree mercatali attualmente attive (trattate dinamicamente come ZTL / Aree Pedonali)
function getActiveMarketZones() {
    const marketZones = [];
    markersData.forEach(m => {
        if (!isMarkerVisible(m)) return;
        if (getMarkerScheduleStatus(m) !== 'active') return;
        if (m.type === 'mercato') {
            marketZones.push({
                lat: m.lat,
                lng: m.lng,
                name: m.street || 'Mercato settimanale',
                note: m.note || '',
                radius: 75 // Raggio di 75m attorno al punto di mercato
            });
        }
    });

    // Segmenti continui di mercato
    Object.keys(activeSegments).forEach(key => {
        const polyline = activeSegments[key];
        if (polyline && polyline.getLatLngs) {
            const isMarketSeg = markersData.some(m => m.type === 'mercato' && m.street && key.includes(normalizeStreetKey(m.street)));
            if (isMarketSeg) {
                const lls = polyline.getLatLngs();
                if (Array.isArray(lls)) {
                    lls.forEach(ll => {
                        marketZones.push({
                            lat: ll.lat,
                            lng: ll.lng,
                            name: key,
                            note: 'Tratto stradale mercatale',
                            radius: 60
                        });
                    });
                }
            }
        }
    });

    return marketZones;
}

// Valuta se una sequenza di coordinate attraversa ZTL provinciali o Aree Mercatali attive
function evaluateRouteZtl(coords, startLat = null, destLat = null, startLng = null, destLng = null) {
    if (!coords || coords.length === 0) {
        return { isZtl: false, traversesActiveMarket: false, ztlMeters: 0, marketNames: [], ztlNames: [] };
    }

    const activeMarkets = getActiveMarketZones();
    let ztlMeters = 0;
    let coreZtlMeters = 0;
    let marketMeters = 0;
    let totalMeters = 0;
    const traversedZtlNames = new Set();
    const traversedMarketNames = new Set();

    let startInCore = false;
    let destInCore = false;
    let startInZtl = false;
    let destInZtl = false;
    let startInMarket = false;
    let destInMarket = false;

    if (startLat !== null && startLng !== null) {
        for (const reg of PROVINCE_ZTL_REGIONS) {
            if (isPointInPolygon(startLat, startLng, reg.polygon)) {
                startInZtl = true;
                if (reg.isCore) startInCore = true;
            }
        }
        for (const mz of activeMarkets) {
            if (calculateDistanceMeters(startLat, startLng, mz.lat, mz.lng) < mz.radius) {
                startInMarket = true;
            }
        }
    }

    if (destLat !== null && destLng !== null) {
        for (const reg of PROVINCE_ZTL_REGIONS) {
            if (isPointInPolygon(destLat, destLng, reg.polygon)) {
                destInZtl = true;
                if (reg.isCore) destInCore = true;
            }
        }
        for (const mz of activeMarkets) {
            if (calculateDistanceMeters(destLat, destLng, mz.lat, mz.lng) < mz.radius) {
                destInMarket = true;
            }
        }
    }

    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const segLen = calculateDistanceMeters(p1[0], p1[1], p2[0], p2[1]);
        totalMeters += segLen;
        const midLat = (p1[0] + p2[0]) / 2;
        const midLng = (p1[1] + p2[1]) / 2;

        // Verifica poligoni ZTL provinciali
        for (const reg of PROVINCE_ZTL_REGIONS) {
            if (isPointInPolygon(midLat, midLng, reg.polygon)) {
                ztlMeters += segLen;
                if (reg.isCore) coreZtlMeters += segLen;
                traversedZtlNames.add(reg.name);
            }
        }

        // Verifica transito in aree mercatali attive (trattate dinamicamente come ZTL)
        for (const mz of activeMarkets) {
            const d = distPointToSegmentMeters(mz.lat, mz.lng, p1[0], p1[1], p2[0], p2[1]);
            if (d < mz.radius) {
                marketMeters += segLen;
                traversedMarketNames.add(mz.name);
            }
        }
    }

    const traversesActiveMarket = (startInMarket || destInMarket) ? marketMeters > 90 : marketMeters > 40;
    
    let isZtl = false;
    if (traversesActiveMarket) {
        isZtl = true;
    } else if (startInCore || destInCore) {
        isZtl = coreZtlMeters > 130;
    } else if (startInZtl || destInZtl) {
        isZtl = ztlMeters > 250 || coreZtlMeters > 80;
    } else {
        isZtl = ztlMeters > 100 || coreZtlMeters > 40;
    }

    return {
        isZtl,
        traversesActiveMarket,
        ztlMeters,
        coreZtlMeters,
        marketMeters,
        totalMeters,
        ztlNames: Array.from(traversedZtlNames),
        marketNames: Array.from(traversedMarketNames)
    };
}

// Valuta l'utilizzo di corsie preferenziali Bus/Taxi e direttrici di scorrimento veloce
function evaluateSpecialFeatures(coords) {
    if (!coords || coords.length === 0) {
        return { usesBusLane: false, usesFastTransit: false, busLaneNames: [], fastTransitNames: [] };
    }

    const busLaneNames = new Set();
    const fastTransitNames = new Set();

    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];

        // Verifica corsie preferenziali Bus & Taxi
        if (typeof BUS_PREFERENTIAL_CORRIDORS !== 'undefined') {
            for (const bl of BUS_PREFERENTIAL_CORRIDORS) {
                const d = distPointToSegmentMeters(bl.lat, bl.lng, p1[0], p1[1], p2[0], p2[1]);
                if (d < 45) {
                    busLaneNames.add(bl.name);
                }
            }
        }

        // Verifica arterie e raccordi di scorrimento veloce
        if (typeof FAST_TRANSIT_AXES !== 'undefined') {
            for (const ft of FAST_TRANSIT_AXES) {
                const d = distPointToSegmentMeters(ft.lat, ft.lng, p1[0], p1[1], p2[0], p2[1]);
                if (d < 95) {
                    fastTransitNames.add(ft.name);
                }
            }
        }
    }

    return {
        usesBusLane: busLaneNames.size > 0,
        usesFastTransit: fastTransitNames.size > 0,
        busLaneNames: Array.from(busLaneNames),
        fastTransitNames: Array.from(fastTransitNames)
    };
}

// Calcola fino a 3 differenti scelte di percorso garantendo:
// - Percorso più veloce prioritario (con transito ZTL / Mercati 118 consentito su grandi assi carrabili)
// - Alternativa 1 e 2 garantite su strade ampie confacenti al mezzo di soccorso (esclude vicoli angusti e piste ciclabili)
// - Rispetto rigoroso dei sensi unici e svolte corrette alle rotatorie (es. Rotatoria Corso Isonzo -> svolta diretta a sinistra su Darsena/Via Bologna)
// - Rispetto limiti di sagoma e altezza per mezzi di soccorso (Ambulanze Tipo A 118)
// - Utilizzo autorizzato di corsie preferenziali Bus/Taxi e scorrimento veloce
// - Deviazioni più corte e rapide attorno a ostacoli (strade chiuse / ponti interrotti)
async function calculateEmergencyRoutes(startLat, startLng, destLat, destLng) {
    const obstacles = getActiveNavigationObstacles(destLat, destLng);
    const activeMarkets = getActiveMarketZones();

    function calcEmergencyDuration(distanceMeters, osrmCarDuration = null) {
        const distKm = distanceMeters / 1000;
        if (osrmCarDuration && osrmCarDuration > 0) {
            const carMin = Math.round(osrmCarDuration / 60);
            return Math.max(1, Math.min(carMin, Math.round((distKm / 40) * 60)));
        }
        return Math.max(1, Math.round((distKm / 36) * 60));
    }

    // Endpoints di routing:
    // 1. Rotte auto dirette con alternative su viabilità ordinaria
    // 2. Grandi Assi Emergenza ZTL autorizzati (strade ad ampia carreggiata: Giovecca, Cavour, Porta Reno, Kennedy)
    // 3. Direttrice Corso Isonzo -> Rotatoria Darsena con svolta diretta su Darsena Est / Via Bologna
    // 4. Bypass Circonvallazione Ovest (Viale Po / Viale IV Novembre)
    // 5. Bypass Tangenziale Est / Baluardi Est (Via Caldirolo / Viale Alfonso I d'Este)
    // 6. Percorso ZTL 118 diretto (verificato per escludere vicoli angusti)
    const endpoints = [
        // Rotte auto dirette (rispetto rigoroso dei sensi unici ordinari)
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=true`, isBypass: false, isBike: false },
        { url: `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=true`, isBypass: false, isBike: false },
        // Grandi Assi Emergenza Centro 118 (strade larghe e corsie preferenziali bus/soccorso)
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6190,44.8345;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: false, isBike: false, bypassName: 'Asse Corso Martiri della Libertà / Porta Reno' },
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6250,44.8365;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: false, isBike: false, bypassName: 'Asse Corso Giovecca' },
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6140,44.8385;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: false, isBike: false, bypassName: 'Asse Viale Cavour' },
        // Direttrice Corso Isonzo -> Rotatoria Darsena -> Svolta diretta su Via Darsena Est / Via Bologna (senza deviazioni a destra per Mulinetto)
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6108,44.8335;11.6150,44.8275;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: true, isBike: false, bypassName: 'Corso Isonzo / Darsena / Via Bologna' },
        // Circonvallazione Ovest (Viale Po / Viale IV Novembre)
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6030,44.8410;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: true, isBike: false, bypassName: 'Circonvallazione Ovest' },
        // Tangenziale Est & Baluardi Est
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6410,44.8375;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: true, isBike: false, bypassName: 'Tangenziale Est' },
        { url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};11.6330,44.8315;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: true, isBike: false, bypassName: 'Baluardi Est' },
        // Scorciatoia ZTL 118 diretta (subordinata a verifica larghezza strada)
        { url: `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`, isBypass: false, isBike: true }
    ];

    // Se il tragitto o uno dei punti è nei pressi di un mercato, genera bypass dedicati
    const midLat = (startLat + destLat) / 2;
    const midLng = (startLng + destLng) / 2;
    activeMarkets.forEach((mz, mIdx) => {
        const d = calculateDistanceMeters(midLat, midLng, mz.lat, mz.lng);
        if (d < 5000 && endpoints.length < 14) {
            // Offset perimetrale di 300m per aggirare l'area mercatale
            const offLat = mz.lat + 0.003;
            const offLng = mz.lng + 0.003;
            endpoints.push({
                url: `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${offLng.toFixed(5)},${offLat.toFixed(5)};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`,
                isBypass: true,
                isBike: false,
                bypassName: `Aggiramento Mercato ${mz.name}`
            });
        }
    });

    let rawRoutes = [];
    for (const ep of endpoints) {
        try {
            const resp = await fetch(ep.url);
            if (resp.ok) {
                const data = await resp.json();
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    data.routes.forEach(r => {
                        r._isBypass = ep.isBypass;
                        r._isBike = ep.isBike;
                        r._bypassName = ep.bypassName;
                        rawRoutes.push(r);
                    });
                }
            }
        } catch (e) { }
    }

    let processedRoutes = rawRoutes.map((r, idx) => {
        const coords = r.geometry.coordinates.map(c => [c[1], c[0]]);
        const distanceKm = (r.distance / 1000).toFixed(1);

        // Valutazione geometrica reale del transito in ZTL e Aree Mercatali
        const ztlEval = evaluateRouteZtl(coords, startLat, destLat, startLng, destLng);
        const isZtlRoute = ztlEval.isZtl;

        // Valutazione preferenziali Bus/Taxi e Scorrimento Veloce
        const specEval = evaluateSpecialFeatures(coords);

        let durationMin;
        if (isZtlRoute && r._isBike) {
            // Velocità d'emergenza mezzo 118 in ZTL / Aree Pedonali
            durationMin = calcEmergencyDuration(r.distance, null);
        } else {
            // Tempo calcolato dal router per veicoli su viabilità ordinaria
            durationMin = calcEmergencyDuration(r.distance, r.duration);
        }

        const obsCheck = evaluateRouteObstacles(coords, obstacles);
        const steps = (r.legs && r.legs[0] && r.legs[0].steps) ? r.legs[0].steps : [];

        // Verifica compatibilità della strada con i mezzi di soccorso 118 (esclude vicoli angusti / percorsi ciclabili)
        const isSuitable = isRouteSuitableForEmergency(steps, destLat, destLng);

        return {
            index: idx,
            isDetour: false,
            isZtlRoute: isZtlRoute,
            traversesActiveMarket: ztlEval.traversesActiveMarket,
            ztlMetrics: ztlEval,
            usesBusLane: specEval.usesBusLane,
            busLaneNames: specEval.busLaneNames,
            usesFastTransit: specEval.usesFastTransit,
            fastTransitNames: specEval.fastTransitNames,
            isBypass: !!r._isBypass,
            bypassName: r._bypassName || null,
            coords: coords,
            distanceKm: distanceKm,
            distanceRaw: r.distance,
            durationMin: durationMin,
            intersectsBlock: obsCheck.intersects,
            blockReasons: obsCheck.reasons,
            collidedObstacles: obsCheck.collidedObstacles,
            unsuitableForEmergency: !isSuitable,
            steps: formatManeuverSteps(steps),
            rawSteps: steps
        };
    });

    // Se i percorsi diretti incontrano ostacoli, calcola le deviazioni più corte
    const blockedRoutes = processedRoutes.filter(r => r.intersectsBlock);
    if (blockedRoutes.length > 0) {
        const allCollided = [];
        blockedRoutes.forEach(br => {
            if (br.collidedObstacles) allCollided.push(...br.collidedObstacles);
        });

        const directRefCoords = blockedRoutes[0] ? blockedRoutes[0].coords : [];
        const detourRoutes = await calculateDetourRoutes(
            startLat, startLng,
            destLat, destLng,
            obstacles,
            allCollided,
            directRefCoords
        );

        if (detourRoutes && detourRoutes.length > 0) {
            detourRoutes.forEach(dr => {
                const ztlEval = evaluateRouteZtl(dr.coords, startLat, destLat, startLng, destLng);
                const specEval = evaluateSpecialFeatures(dr.coords);
                dr.isZtlRoute = ztlEval.isZtl;
                dr.traversesActiveMarket = ztlEval.traversesActiveMarket;
                dr.ztlMetrics = ztlEval;
                dr.usesBusLane = specEval.usesBusLane;
                dr.busLaneNames = specEval.busLaneNames;
                dr.usesFastTransit = specEval.usesFastTransit;
                dr.fastTransitNames = specEval.fastTransitNames;
                dr.unsuitableForEmergency = false;
            });
            processedRoutes.push(...detourRoutes);
        }
    }

    // Filtra ed elimina tassativamente i percorsi non adatti ai veicoli di soccorso (strade troppo strette / ciclabili)
    const emergencyCompliantRoutes = processedRoutes.filter(r => !r.unsuitableForEmergency);
    const validPool = emergencyCompliantRoutes.length > 0 ? emergencyCompliantRoutes : processedRoutes;

    // Ordina i percorsi:
    // 1. Liberi da blocchi
    // 2. Più veloci
    // 3. Minore distanza
    validPool.sort((a, b) => {
        if (a.intersectsBlock !== b.intersectsBlock) {
            return a.intersectsBlock ? 1 : -1;
        }
        if (a.durationMin !== b.durationMin) {
            return a.durationMin - b.durationMin;
        }
        return (a.distanceRaw || parseFloat(a.distanceKm)) - (b.distanceRaw || parseFloat(b.distanceKm));
    });

    // Filtra percorsi liberi da ostacoli
    const freeRoutes = validPool.filter(r => !r.intersectsBlock);
    const pool = freeRoutes.length > 0 ? freeRoutes : validPool;

    const ztlCandidates = pool.filter(r => r.isZtlRoute);
    const noZtlCandidates = pool.filter(r => !r.isZtlRoute);

    const hasMarket = activeMarkets.length > 0;

    ztlCandidates.sort((a, b) => a.durationMin - b.durationMin || (a.distanceRaw || 0) - (b.distanceRaw || 0));
    noZtlCandidates.sort((a, b) => a.durationMin - b.durationMin || (a.distanceRaw || 0) - (b.distanceRaw || 0));

    const selected3 = [];

    // 1. Slot 1: Il percorso più veloce in assoluto su strade adeguate all'ambulanza
    const fastest = pool[0];
    if (fastest) selected3.push(fastest);

    // 2. Slot 2: Se il più veloce usa la ZTL o attraversa un'area mercato attiva, proponi OBBLIGATORIAMENTE un'alternativa reale Fuori ZTL (su viabilità ordinaria / circonvallazione)
    if (fastest && fastest.isZtlRoute && noZtlCandidates.length > 0) {
        const bestNoZtl = noZtlCandidates[0];
        if (!selected3.includes(bestNoZtl)) {
            bestNoZtl.isNoZtlAlternative = true;
            selected3.push(bestNoZtl);
        }
    } else if (fastest && !fastest.isZtlRoute && ztlCandidates.length > 0) {
        // Se il più veloce è fuori ZTL, proponi anche la scorciatoia ZTL come alternativa rapida 118
        const bestZtl = ztlCandidates[0];
        if (!selected3.includes(bestZtl)) {
            selected3.push(bestZtl);
        }
    }

    // 3. Slot 3: Se c'è un mercato attivo, assicurati che un'opzione sia "Evita Mercato"
    if (hasMarket) {
        const marketAvoiding = pool.find(r => !selected3.includes(r) && !r.traversesActiveMarket);
        if (marketAvoiding) {
            marketAvoiding.avoidsMarket = true;
            selected3.push(marketAvoiding);
        }
    }

    // Se il percorso 1 è in ZTL e abbiamo aggiunto il percorso 2 Fuori ZTL, aggiungi come percorso 3 un'altra opzione Fuori ZTL distinta (es. Circonvallazione / Corso Isonzo / Baluardi)
    if (fastest && fastest.isZtlRoute && selected3.length < 3) {
        for (const r of noZtlCandidates) {
            if (selected3.length >= 3) break;
            const isDuplicate = selected3.some(s =>
                Math.abs(parseFloat(s.distanceKm) - parseFloat(r.distanceKm)) < 0.25 &&
                Math.abs(s.durationMin - r.durationMin) <= 1
            );
            if (!isDuplicate && !selected3.includes(r)) {
                r.isNoZtlAlternative = true;
                selected3.push(r);
            }
        }
    }

    // Riempi gli slot mancanti fino a 3 con percorsi geometricamente distinti e adatti ai mezzi di emergenza
    for (const r of pool) {
        if (selected3.length >= 3) break;
        const isDuplicate = selected3.some(s =>
            Math.abs(parseFloat(s.distanceKm) - parseFloat(r.distanceKm)) < 0.2 &&
            Math.abs(s.durationMin - r.durationMin) <= 1
        );
        if (!isDuplicate && !selected3.includes(r)) {
            selected3.push(r);
        }
    }

    for (const r of validPool) {
        if (selected3.length >= 3) break;
        if (!selected3.includes(r)) {
            selected3.push(r);
        }
    }

    // Assegna titoli e badge semantici chiari e fedeli ai 3 percorsi
    selected3.forEach((r, i) => {
        const cfg = ROUTE_CONFIGS[i] || ROUTE_CONFIGS[0];
        r.color = cfg.color;
        r.badgeClass = cfg.badgeClass;
        r.dotColor = cfg.dotColor;

        if (i === 0) {
            if (r.traversesActiveMarket) {
                r.title = "Percorso 1 (Più Veloce - Transito Area Mercato 118)";
                r.badgeText = "⚡ Più Veloce (Mercato)";
            } else if (r.isZtlRoute) {
                r.title = "Percorso 1 (Più Veloce - Transito Grandi Assi ZTL 118)";
                r.badgeText = "⚡ Più Veloce (ZTL)";
            } else if (r.isDetour) {
                r.title = "Percorso 1 (Più Veloce con Deviazione)";
                r.badgeText = "⚡ Più Veloce";
            } else {
                r.title = "Percorso 1 (Più Veloce / Viabilità Ordinaria)";
                r.badgeText = "⚡ Più Veloce";
            }
        } else if (r.isNoZtlAlternative || (!r.isZtlRoute && fastest && fastest.isZtlRoute)) {
            r.title = `Percorso ${i + 1} (Transito Fuori ZTL / Viabilità Ordinaria)`;
            r.badgeText = "🚫 Fuori ZTL";
        } else if (r.avoidsMarket || (hasMarket && !r.traversesActiveMarket)) {
            r.title = `Percorso ${i + 1} (Evita Area Mercato)`;
            r.badgeText = "🛒 Evita Mercato";
        } else if (r.traversesActiveMarket) {
            r.title = `Percorso ${i + 1} (Transito Area Mercato 118)`;
            r.badgeText = "🛒 Transito Mercato";
        } else if (r.isZtlRoute) {
            r.title = `Percorso ${i + 1} (Transito Grandi Assi ZTL 118)`;
            r.badgeText = "🛡️ Transito ZTL";
        } else if (r.isDetour) {
            r.title = `Percorso ${i + 1} (Alternativo con Deviazione)`;
            r.badgeText = `🔄 Alternativa ${i}`;
        } else {
            r.title = `Percorso ${i + 1} (Alternativa)`;
            r.badgeText = `🌿 Alternativa ${i}`;
        }
    });

    return {
        routes: selected3,
        obstacles: obstacles
    };
}

// Azione al click su "Calcola Percorsi"
async function handleCalculateNav() {
    const startInput = document.getElementById('nav-start-input');
    const destInput = document.getElementById('nav-dest-input');
    const calcBtn = document.getElementById('nav-calc-btn');

    const startText = startInput ? startInput.value.trim() : '';
    const destText = destInput ? destInput.value.trim() : '';

    if (!destText) {
        showToast("Inserisci o seleziona una destinazione.", "error");
        return;
    }

    if (calcBtn) {
        calcBtn.disabled = true;
        calcBtn.innerHTML = "<span>⏳ Calcolo percorsi e deviazioni...</span>";
    }

    try {
        if (!navStartPoint || (startText && !startText.includes("📍") && startText !== navStartPoint.label)) {
            const geo = await geocodeAddressQuery(startText);
            if (geo) {
                navStartPoint = geo;
            } else {
                const center = map.getCenter();
                navStartPoint = { lat: center.lat, lng: center.lng, label: "Partenza" };
            }
        }

        if (!navDestPoint || (destText && destText !== navDestPoint.label)) {
            const geoDest = await geocodeAddressQuery(destText);
            if (geoDest) {
                navDestPoint = geoDest;
            } else {
                showToast("Impossibile trovare l'indirizzo di destinazione specificato.", "error");
                if (calcBtn) {
                    calcBtn.disabled = false;
                    calcBtn.innerHTML = "<span>🔍 Calcola Percorsi</span>";
                }
                return;
            }
        }

        const res = await calculateEmergencyRoutes(
            navStartPoint.lat, navStartPoint.lng,
            navDestPoint.lat, navDestPoint.lng
        );

        if (!res.routes || res.routes.length === 0) {
            showToast("Nessun percorso stradale trovato per la destinazione richiesta.", "error");
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.innerHTML = "<span>🔍 Calcola Percorsi</span>";
            }
            return;
        }

        navRoutes = res.routes;
        activeNavRouteIdx = 0;

        const destCheck = checkDestinationObstacle(navDestPoint.lat, navDestPoint.lng, res.obstacles);
        const alertBox = document.getElementById('nav-dest-alert');
        const alertMsg = document.getElementById('nav-dest-alert-msg');
        if (destCheck.isBlocked) {
            const reasonName = destCheck.type === 'sagra' ? 'Sagra / Fiera' :
                               destCheck.type === 'mercato' ? 'Mercato settimanale' :
                               destCheck.type === 'ponte' ? 'Ponte interrotto' :
                               destCheck.type === 'lavori' ? 'Cantiere / Lavori' : 'Strada Chiusa';
            if (alertMsg) alertMsg.textContent = `Intervento diretto sul posto: la destinazione si trova all'interno di una chiusura attiva (${reasonName} su ${destCheck.street}). Il percorso conduce direttamente al luogo di soccorso.`;
            if (alertBox) alertBox.classList.remove('hidden');
        } else {
            if (alertBox) alertBox.classList.add('hidden');
        }

        renderNavRoutes(navRoutes);

    } catch (e) {
        console.error("Errore calcolo navigazione:", e);
        showToast("Errore durante il calcolo dei percorsi. Riprova.", "error");
    } finally {
        if (calcBtn) {
            calcBtn.disabled = false;
            calcBtn.innerHTML = "<span>🔍 Calcola Percorsi</span>";
        }
    }
}

// Disegna fino a 3 percorsi differenziati sulla mappa e compila le schede colorate
function renderNavRoutes(routes) {
    navRouteLayers.forEach(l => map.removeLayer(l));
    navRouteLayers = [];
    if (navMarkerStart) { map.removeLayer(navMarkerStart); navMarkerStart = null; }
    if (navMarkerDest) { map.removeLayer(navMarkerDest); navMarkerDest = null; }

    const routesContainer = document.getElementById('nav-routes-container');
    const cardsList = document.getElementById('nav-cards-list');
    if (routesContainer) routesContainer.classList.remove('hidden');
    if (cardsList) cardsList.innerHTML = '';

    const iconStart = L.divIcon({
        className: '',
        html: '<div style="background:#10b981; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4);">A</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
    navMarkerStart = L.marker([navStartPoint.lat, navStartPoint.lng], { icon: iconStart, zIndexOffset: 1200 }).addTo(map);

    const iconDest = L.divIcon({
        className: '',
        html: '<div style="background:#ef4444; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4);">B</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
    navMarkerDest = L.marker([navDestPoint.lat, navDestPoint.lng], { icon: iconDest, zIndexOffset: 1200 }).addTo(map);

    let allBounds = L.latLngBounds([[navStartPoint.lat, navStartPoint.lng], [navDestPoint.lat, navDestPoint.lng]]);

    routes.forEach((route, idx) => {
        const isActive = idx === activeNavRouteIdx;
        const cfg = ROUTE_CONFIGS[idx] || ROUTE_CONFIGS[0];

        const polyline = L.polyline(route.coords, {
            color: cfg.color,
            weight: isActive ? 8 : 5,
            opacity: isActive ? 0.95 : 0.65,
            dashArray: isActive ? null : '6, 8',
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(map);

        if (isActive) polyline.bringToFront();

        polyline.on('click', () => selectNavRoute(idx));
        navRouteLayers.push(polyline);

        route.coords.forEach(c => allBounds.extend(c));

        const card = document.createElement('div');
        card.className = `nav-route-card ${isActive ? 'active' : ''}`;
        
        let badgesHtml = '';
        badgesHtml += `<span class="nav-badge-pill ${cfg.badgeClass}">${cfg.badgeText}</span>`;
        if (route.traversesActiveMarket) {
            badgesHtml += '<span class="nav-badge-pill avoid-market">🛒 Transito Area Mercato</span>';
        } else if (route.isZtlRoute) {
            badgesHtml += '<span class="nav-badge-pill ztl">⚡ Transito ZTL 118</span>';
        } else {
            badgesHtml += '<span class="nav-badge-pill no-ztl">🚗 Fuori ZTL / Fuori Mercato</span>';
        }
        if (route.usesBusLane) {
            badgesHtml += '<span class="nav-badge-pill" style="background:rgba(234,179,8,0.25); color:#facc15; border:1px solid rgba(234,179,8,0.4);">🚌 Corsia Bus/Taxi</span>';
        }
        if (route.usesFastTransit) {
            badgesHtml += '<span class="nav-badge-pill" style="background:rgba(99,102,241,0.25); color:#818cf8; border:1px solid rgba(99,102,241,0.4);">⚡ Scorrimento Veloce</span>';
        }
        if (route.avoidsMarket) {
            badgesHtml += '<span class="nav-badge-pill avoid-market">🛒 Evita Mercato</span>';
        }
        if (route.isDetour) {
            badgesHtml += '<span class="nav-badge-pill detour">🔄 Deviazione Attiva</span>';
            badgesHtml += '<span class="nav-badge-pill avoided">🟢 Ostacoli Evitati</span>';
        } else if (!route.intersectsBlock) {
            badgesHtml += '<span class="nav-badge-pill clear">🟢 Viabilità Libera</span>';
        }

        let detourNoteHtml = '';
        if (route.traversesActiveMarket) {
            detourNoteHtml = `<div class="nav-card-detour-note" style="color:#fb923c;">🛒 Transito in area mercato attiva (bancarelle/pedoni: passaggio consentito 118 con cautela).</div>`;
        } else if (route.isZtlRoute) {
            const ztlNameStr = (route.ztlMetrics && route.ztlMetrics.ztlNames && route.ztlMetrics.ztlNames.length > 0)
                ? ` (${route.ztlMetrics.ztlNames[0]})`
                : '';
            detourNoteHtml = `<div class="nav-card-detour-note" style="color:#c084fc;">⚡ Transito ZTL 118 autorizzato${ztlNameStr} (passaggio rapido attraverso il centro storico).</div>`;
        } else if (route.isNoZtlAlternative || !route.isZtlRoute) {
            detourNoteHtml = `<div class="nav-card-detour-note" style="color:#38bdf8;">🚗 Percorso su viabilità ordinaria: aggira completamente la ZTL, il centro storico e le aree mercatali.</div>`;
        } else if (route.avoidsMarket) {
            detourNoteHtml = `<div class="nav-card-detour-note" style="color:#fb923c;">🛒 Area mercato evitata: tragitto alternativo attorno all'evento mercatale.</div>`;
        } else if (route.isDetour) {
            detourNoteHtml = `<div class="nav-card-detour-note">🔄 Deviazione applicata: aggiramento interruzioni per arrivo rapido.</div>`;
        }

        card.innerHTML = `
            <div class="nav-card-left">
                <span class="nav-card-title">
                    <span class="nav-card-color-dot" style="background:${cfg.dotColor};"></span>
                    ${escapeHtml(route.title)}
                </span>
                <span class="nav-card-dist">📏 ${route.distanceKm} km &bull; ⏱️ ${route.durationMin} min</span>
                <div class="nav-card-badges">
                    ${badgesHtml}
                </div>
                ${detourNoteHtml}
            </div>
            <div class="nav-card-time" style="color:${cfg.color};">${route.durationMin} min</div>
        `;
        card.addEventListener('click', () => selectNavRoute(idx));
        if (cardsList) cardsList.appendChild(card);
    });

    renderNavSteps(routes[activeNavRouteIdx]);

    map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 16 });
}

// Seleziona una delle 3 opzioni di percorso
function selectNavRoute(idx) {
    if (idx < 0 || idx >= navRoutes.length) return;
    activeNavRouteIdx = idx;

    navRouteLayers.forEach((l, i) => {
        const isActive = i === activeNavRouteIdx;
        const cfg = ROUTE_CONFIGS[i] || ROUTE_CONFIGS[0];
        l.setStyle({
            color: cfg.color,
            weight: isActive ? 8 : 5,
            opacity: isActive ? 0.95 : 0.65,
            dashArray: isActive ? null : '6, 8'
        });
        if (isActive) l.bringToFront();
    });

    const cards = document.querySelectorAll('.nav-route-card');
    cards.forEach((c, i) => {
        if (i === activeNavRouteIdx) c.classList.add('active');
        else c.classList.remove('active');
    });

    renderNavSteps(navRoutes[activeNavRouteIdx]);
}

// Popola la lista delle indicazioni di svolta
function renderNavSteps(route) {
    const stepsList = document.getElementById('nav-steps-list');
    const stepsCount = document.getElementById('nav-steps-count');
    if (!stepsList || !route) return;

    stepsList.innerHTML = '';
    const steps = route.steps || [];
    if (stepsCount) stepsCount.textContent = steps.length.toString();

    if (route.isDetour) {
        const detourBanner = document.createElement('div');
        detourBanner.className = 'nav-step-item';
        detourBanner.style.background = 'rgba(245, 158, 11, 0.15)';
        detourBanner.style.border = '1px solid rgba(245, 158, 11, 0.35)';
        detourBanner.style.borderRadius = '8px';
        detourBanner.style.padding = '6px 8px';
        detourBanner.style.marginBottom = '6px';
        detourBanner.innerHTML = `
            <div class="nav-step-icon">🔄</div>
            <div class="nav-step-info">
                <div style="color:#fbbf24; font-weight:700;">Deviazione attiva</div>
                <div class="nav-step-dist" style="color:#cbd5e1;">Percorso ricalcolato per aggirare interruzioni, cantieri, ponti o mercati/fiere.</div>
            </div>
        `;
        stepsList.appendChild(detourBanner);
    }

    steps.forEach((s) => {
        const item = document.createElement('div');
        item.className = 'nav-step-item';
        item.innerHTML = `
            <div class="nav-step-icon">${s.icon}</div>
            <div class="nav-step-info">
                <div>${escapeHtml(s.text)}</div>
                <div class="nav-step-dist">${s.distText}</div>
            </div>
        `;
        stepsList.appendChild(item);
    });
}

function toggleNavSteps() {
    const stepsList = document.getElementById('nav-steps-list');
    const chevron = document.getElementById('nav-steps-chevron');
    if (!stepsList) return;
    const isHidden = stepsList.classList.contains('hidden');
    if (isHidden) {
        stepsList.classList.remove('hidden');
        if (chevron) chevron.textContent = '▲';
    } else {
        stepsList.classList.add('hidden');
        if (chevron) chevron.textContent = '▼';
    }
}

// Azzera i percorsi calcolati
function clearNavRoutes() {
    navRouteLayers.forEach(l => map.removeLayer(l));
    navRouteLayers = [];
    if (navMarkerStart) { map.removeLayer(navMarkerStart); navMarkerStart = null; }
    if (navMarkerDest) { map.removeLayer(navMarkerDest); navMarkerDest = null; }
    navRoutes = [];

    const routesContainer = document.getElementById('nav-routes-container');
    const alertBox = document.getElementById('nav-dest-alert');
    if (routesContainer) routesContainer.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    const destInput = document.getElementById('nav-dest-input');
    if (destInput) destInput.value = '';
    navDestPoint = null;
}


// Avvia la guida Turn-by-Turn a tutto schermo con tracking GPS e guida vocale
function startTurnByTurnGuidance() {
    if (!navRoutes || navRoutes.length === 0) return;
    const activeRoute = navRoutes[activeNavRouteIdx];
    if (!activeRoute) return;

    guidanceActive = true;
    guidanceState = {
        active: true,
        route: activeRoute,
        currentStepIdx: 0,
        announced100m: new Set(),
        announcedImmediate: new Set(),
        lastPosition: null,
        isRerouting: false,
        lastRerouteTime: 0,
        offRouteStreak: 0,
        arrivedAnnounced: false
    };

    const navPanel = document.getElementById('nav-panel');
    const navHud = document.getElementById('nav-hud');
    if (navPanel) navPanel.classList.add('hidden');
    if (navHud) navHud.classList.remove('hidden');

    VoiceNavigator.updateButtonState();

    const startCoord = activeRoute.coords[0];

    if (!vehicleMarker) {
        const vehicleIcon = L.divIcon({
            className: '',
            html: '<div style="background:#0284c7; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.15rem; border:3px solid #fff; box-shadow:0 0 16px rgba(2,132,199,0.9);">🚑</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
        vehicleMarker = L.marker(startCoord, { icon: vehicleIcon, zIndexOffset: 3000 }).addTo(map);
    } else {
        vehicleMarker.setLatLng(startCoord);
    }

    map.setView(startCoord, 17, { animate: true });

    // Annuncio vocale iniziale di partenza
    if (activeRoute.steps && activeRoute.steps.length > 0) {
        const s0 = activeRoute.steps[0];
        VoiceNavigator.speak(`Guida avviata. ${s0.actionAdvance || s0.text}`);
    }

    // Aggiornamento iniziale display
    if (activeRoute.steps && activeRoute.steps.length > 0) {
        updateHudDynamic(activeRoute.steps[0], activeRoute.steps[0].distMeters || 0, startCoord[0], startCoord[1], activeRoute);
    }

    if (navigator.geolocation) {
        guidanceWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (!guidanceActive) return;
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                handleGuidanceGpsUpdate(lat, lng, pos.coords.heading, pos.coords.speed);
            },
            (err) => console.warn("GPS watch error:", err.message),
            { enableHighAccuracy: true, maximumAge: 1500, timeout: 8000 }
        );
    }

    showToast("🧭 Guida Turn-by-Turn avviata con voce!", "success", 3000);
}

// Elaborazione di ogni singolo impulso GPS durante la guida
function handleGuidanceGpsUpdate(lat, lng, heading = null, speed = null) {
    if (!guidanceActive || !guidanceState.route) return;

    if (vehicleMarker) {
        vehicleMarker.setLatLng([lat, lng]);
    }
    map.panTo([lat, lng], { animate: true, duration: 0.5 });

    const route = guidanceState.route;
    const distToPolyline = distPointToPolylineMeters(lat, lng, route.coords);

    // Rilevamento errore di strada e ricalcolo immediato
    if (distToPolyline > 35) {
        guidanceState.offRouteStreak++;
        if ((guidanceState.offRouteStreak >= 2 || distToPolyline > 50) && !guidanceState.isRerouting) {
            const now = Date.now();
            if (now - guidanceState.lastRerouteTime > 4000) {
                guidanceState.isRerouting = true;
                guidanceState.lastRerouteTime = now;
                VoiceNavigator.speak("Ricalcolo del percorso in corso...", true);
                triggerOffRouteReroute(lat, lng);
                return;
            }
        }
    } else {
        guidanceState.offRouteStreak = 0;
    }

    const steps = route.steps || [];
    let currentIdx = guidanceState.currentStepIdx;

    // Se siamo arrivati all'ultimo passo
    if (currentIdx >= steps.length - 1 || steps.length === 0) {
        const distToDest = navDestPoint ? calculateDistanceMeters(lat, lng, navDestPoint.lat, navDestPoint.lng) : 0;
        if (distToDest < 30 && !guidanceState.arrivedAnnounced) {
            guidanceState.arrivedAnnounced = true;
            VoiceNavigator.speak("Sei arrivato a destinazione!", true);
        }
        updateHudForArrival(distToDest);
        return;
    }

    const curStep = steps[currentIdx];
    let distToManeuver = 0;
    if (curStep.location) {
        distToManeuver = calculateDistanceMeters(lat, lng, curStep.location[0], curStep.location[1]);
    } else {
        distToManeuver = curStep.distMeters || 100;
    }

    // Avanzamento allo step successivo
    if (distToManeuver < 15 && currentIdx < steps.length - 1) {
        guidanceState.currentStepIdx++;
        currentIdx = guidanceState.currentStepIdx;
    } else if (currentIdx + 1 < steps.length && steps[currentIdx + 1].location) {
        const nextLoc = steps[currentIdx + 1].location;
        const distNext = calculateDistanceMeters(lat, lng, nextLoc[0], nextLoc[1]);
        if (distNext < distToManeuver && distToManeuver > 30) {
            guidanceState.currentStepIdx++;
            currentIdx = guidanceState.currentStepIdx;
        }
    }

    const activeStep = steps[currentIdx];
    if (activeStep.location) {
        distToManeuver = calculateDistanceMeters(lat, lng, activeStep.location[0], activeStep.location[1]);
    }

    guidanceState.lastPosition = { lat, lng };

    // 1) Avviso vocale in anticipo (~100 metri prima)
    if (distToManeuver <= 115 && distToManeuver >= 45) {
        if (!guidanceState.announced100m.has(currentIdx)) {
            guidanceState.announced100m.add(currentIdx);
            const msg = `Tra 100 metri ${activeStep.actionAdvance || activeStep.text}`;
            VoiceNavigator.speak(msg);
        }
    }

    // 2) Avviso vocale nell'immediatezza (~15-20 metri prima)
    if (distToManeuver <= 25 && distToManeuver > 0) {
        if (!guidanceState.announcedImmediate.has(currentIdx)) {
            guidanceState.announcedImmediate.add(currentIdx);
            const msg = `Ora ${activeStep.actionImmediate || activeStep.text}`;
            VoiceNavigator.speak(msg);
        }
    }

    // Aggiornamento display HUD
    updateHudDynamic(activeStep, distToManeuver, lat, lng, route);
}

// Ricalcolo automatico e istantaneo in caso di fuori rotta
async function triggerOffRouteReroute(currentLat, currentLng) {
    if (!navDestPoint) {
        guidanceState.isRerouting = false;
        return;
    }
    try {
        const res = await calculateEmergencyRoutes(currentLat, currentLng, navDestPoint.lat, navDestPoint.lng);
        if (res && res.routes && res.routes.length > 0) {
            navRoutes = res.routes;
            activeNavRouteIdx = 0;
            const newActiveRoute = navRoutes[0];

            renderNavRoutes(navRoutes);

            guidanceState.route = newActiveRoute;
            guidanceState.currentStepIdx = 0;
            guidanceState.announced100m = new Set();
            guidanceState.announcedImmediate = new Set();
            guidanceState.offRouteStreak = 0;

            if (newActiveRoute.steps && newActiveRoute.steps.length > 0) {
                const firstStep = newActiveRoute.steps[0];
                updateHudDynamic(firstStep, firstStep.distMeters || 0, currentLat, currentLng, newActiveRoute);
                VoiceNavigator.speak(`Percorso ricalcolato. ${firstStep.actionAdvance || firstStep.text}`);
            }
        }
    } catch (e) {
        console.warn("Reroute error:", e);
    } finally {
        guidanceState.isRerouting = false;
    }
}

// Aggiorna l'HUD in tempo reale con avanzamento dei metri, tempo e km
function updateHudDynamic(step, distToManeuver, lat, lng, route) {
    const timeEl = document.getElementById('hud-time-remain');
    const distEl = document.getElementById('hud-dist-remain');
    const nextDistEl = document.getElementById('hud-next-dist');
    const nextStreetEl = document.getElementById('hud-next-street');
    const iconEl = document.getElementById('hud-maneuver-icon');

    const remainingKm = calcRemainingDistanceKm(lat, lng, route.coords);
    const remainingMin = Math.max(1, Math.round((parseFloat(remainingKm) / 36) * 60));

    if (timeEl) timeEl.textContent = `${remainingMin} min`;
    if (distEl) distEl.textContent = `${remainingKm} km`;

    if (nextDistEl) {
        if (distToManeuver < 15) {
            nextDistEl.textContent = 'Ora';
        } else if (distToManeuver >= 1000) {
            nextDistEl.textContent = `Tra ${(distToManeuver / 1000).toFixed(1)} km`;
        } else {
            nextDistEl.textContent = `Tra ${Math.round(distToManeuver)} m`;
        }
    }

    if (nextStreetEl) nextStreetEl.textContent = step.text || step.street;
    if (iconEl) iconEl.textContent = step.icon || '⬆️';

    const ztlBadge = document.getElementById('hud-badge-ztl');
    if (ztlBadge) {
        if (route.traversesActiveMarket) {
            ztlBadge.textContent = '🛒 Area Mercato (118)';
            ztlBadge.style.color = '#fb923c';
            ztlBadge.style.background = 'rgba(249, 115, 22, 0.25)';
            ztlBadge.style.borderColor = 'rgba(249, 115, 22, 0.4)';
        } else if (route.isZtlRoute) {
            ztlBadge.textContent = '🛡️ ZTL 118 Ammessa';
            ztlBadge.style.color = '#c084fc';
            ztlBadge.style.background = 'rgba(139, 92, 246, 0.25)';
            ztlBadge.style.borderColor = 'rgba(139, 92, 246, 0.4)';
        } else {
            ztlBadge.textContent = '🚗 Fuori ZTL';
            ztlBadge.style.color = '#38bdf8';
            ztlBadge.style.background = 'rgba(14, 165, 233, 0.25)';
            ztlBadge.style.borderColor = 'rgba(14, 165, 233, 0.4)';
        }
    }
}

function updateHudForArrival(distToDest) {
    const timeEl = document.getElementById('hud-time-remain');
    const distEl = document.getElementById('hud-dist-remain');
    const nextDistEl = document.getElementById('hud-next-dist');
    const nextStreetEl = document.getElementById('hud-next-street');
    const iconEl = document.getElementById('hud-maneuver-icon');

    if (timeEl) timeEl.textContent = `0 min`;
    if (distEl) distEl.textContent = `0 km`;
    if (nextDistEl) nextDistEl.textContent = distToDest < 10 ? 'Arrivato' : `${Math.round(distToDest)} m`;
    if (nextStreetEl) nextStreetEl.textContent = 'Destinazione raggiunta';
    if (iconEl) iconEl.textContent = '🏁';
}

function stopTurnByTurnGuidance() {
    guidanceActive = false;
    VoiceNavigator.stop();
    if (guidanceWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(guidanceWatchId);
        guidanceWatchId = null;
    }
    const navHud = document.getElementById('nav-hud');
    const navPanel = document.getElementById('nav-panel');
    if (navHud) navHud.classList.add('hidden');
    if (navPanel) navPanel.classList.remove('hidden');
    if (vehicleMarker) {
        map.removeLayer(vehicleMarker);
        vehicleMarker = null;
    }
    showToast("Guida terminata.", "normal", 2000);
}

// Controllo temporale periodico (ogni 30 secondi): aggiorna automaticamente comparsa e scomparsa delle icone
setInterval(() => {
    refreshMarkers();
}, 30000);

// Avvia tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initNavigationModule();
});


