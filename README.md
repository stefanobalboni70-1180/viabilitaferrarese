# Viabilità Ferrara 118 - Versione 3.7.9

Applicazione web progressiva (PWA) e dashboard interattiva per la gestione e consultazione della viabilità e criticità stradali per il servizio 118 della provincia di Ferrara.

### Funzionalità Principali (v3.7.9):
- **Layout Mobile Strutturato a 2 Righe sotto il Titolo:**
  - **Riga 1:** Icona verde segnalazione `📢`, barra di ricerca espandibile e icona blu cerca `🔍`.
  - **Riga 2:** Esclusivamente icone compatte per le altre azioni (News `🚨`, Gestione News `📢`, Notifiche `🔔`, Ingranaggio Admin `⚙️`, Logout rapido `🚪`).
- **Tracciato Reale della Carreggiata (Zero Linee Rette & Anti-Detour):** ogni tratto stradale segue rigorosamente la sagoma fisica e le curve reali della carreggiata (tramite stitching topologico dei way OpenStreetMap e routing bidirezionale anti-detour), eliminando tassativamente qualsiasi linea retta e prevenendo giri strani o deviazioni anomale.
- **Finestra Notizie Urgenti (Flash News 20s):** popup informativo visualizzato per 20 secondi all'avvio con barra di avanzamento per avvisi straordinari e criticità viabilistiche immediate.
- **Pulsante di Consultazione Rapida `🚨 News`:** permette agli operatori di riaprire e consultare in qualsiasi momento tutte le comunicazioni urgenti attive.
- **Pannello Gestione Notizie per Amministratore:** creazione, modifica e disattivazione di comunicazioni prioritarie (fino a 3 attive) con sincronizzazione istantanea su Firebase.
- **Modulo Segnalazioni Utenti:** invio rapido di segnalazioni di viabilità da parte dei cittadini e degli equipaggi sul territorio, con moderazione e validazione da pannello Admin.
- **Gestione Chiusure, Mercati e Sagre:** visualizzazione dinamica sulla mappa Leaflet con filtri temporali e sincronizzazione automatica.
- **UI Moderna e Responsiva:** layout ottimizzato con interfaccia fluida per smartphone, tablet e postazioni desktop di centrale.