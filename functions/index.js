const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Trigger automatico Cloud Function: quando l'admin inserisce una nuova notizia urgente in /urgent_news/{newsId}
 * invia immediatamente una notifica Push nativa a tutti i dispositivi registrati in /fcm_tokens
 */
exports.sendUrgentNewsPush = functions.database.ref('/urgent_news/{newsId}')
  .onCreate(async (snapshot, context) => {
    const newsData = snapshot.val();
    if (!newsData) return null;

    const title = '🚨 COMUNICAZIONE URGENTE 118 - Ferrara';
    const body = newsData.text || 'Nuova allerta di viabilità provinciale registrata.';

    // 1. Recupera tutti i token dei dispositivi registrati
    const tokensSnapshot = await admin.database().ref('fcm_tokens').once('value');
    const tokensData = tokensSnapshot.val();

    if (!tokensData) {
      console.log('Nessun token dispositivo trovato in /fcm_tokens');
      return null;
    }

    const tokens = Object.values(tokensData)
      .map(item => (typeof item === 'string' ? item : item.token))
      .filter(t => typeof t === 'string' && t.length > 10);

    if (tokens.length === 0) {
      console.log('Nessun token valido per l\'invio');
      return null;
    }

    console.log(`Invio notifica push a ${tokens.length} dispositivi registrati...`);

    // 2. Costruisci il payload della notifica
    const payload = {
      notification: {
        title: title,
        body: body
      },
      data: {
        title: title,
        body: body,
        url: './index.html?urgentNews=1',
        newsId: context.params.newsId,
        timestamp: Date.now().toString()
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`Esito invio: ${response.successCount} riuscite, ${response.failureCount} fallite.`);

      // Pulizia automatica dei token non più validi o disinstallati
      if (response.failureCount > 0) {
        const cleanupPromises = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              const badToken = tokens[idx];
              const tokenKey = badToken.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
              cleanupPromises.push(admin.database().ref(`fcm_tokens/${tokenKey}`).remove());
            }
          }
        });
        await Promise.all(cleanupPromises);
      }
      return null;
    } catch (error) {
      console.error('Errore durante l\'invio multicast FCM:', error);
      return null;
    }
  });
