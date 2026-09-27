// Service Worker per Notifiche Push in Background - Viabilità 118 Ferrara
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDRUq7PoqE2GxlZhui3Gm_305t5V-7ibpI",
    authDomain: "viabilita-ferrarese-a7b75.firebaseapp.com",
    databaseURL: "https://viabilita-ferrarese-a7b75-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "viabilita-ferrarese-a7b75",
    storageBucket: "viabilita-ferrarese-a7b75.firebasestorage.app",
    messagingSenderId: "470647422268",
    appId: "1:470647422268:web:0d9286b851d14473007239"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gestione messaggi Push ricevuti in background (ad app chiusa o in background)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Messaggio Push ricevuto in background:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || '🚨 COMUNICAZIONE URGENTE 118 - Ferrara';
    const notificationText = payload.notification?.body || payload.data?.body || 'Nuova allerta di viabilità provinciale registrata.';
    
    const notificationOptions = {
        body: notificationText,
        icon: 'icon-512.jpg',
        badge: 'logo_118.png',
        tag: 'urgent-news-118',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300, 100, 400],
        data: {
            url: payload.data?.url || './index.html?urgentNews=1',
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: '🚨 Visualizza News' },
            { action: 'close', title: 'Ignora' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click sulla notifica ricevuta sullo schermo del dispositivo
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;

    const targetUrl = event.notification.data?.url || './index.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
