# Viabilità Ferrara 118 - Versione 3.7.3

Applicazione per la consultazione e gestione in tempo reale della viabilità, interruzioni stradali, mercati, sagre, segnalazioni e comunicazioni urgenti per i mezzi di soccorso 118 e i cittadini di Ferrara e Provincia.

### Funzionalità Principali (v3.7.3):
- **Pannello Mobile Rimodulato su 3 Righe:** layout mobile specificamente rimodulato con priorità alla barra di ricerca strada a larghezza intera (100%), garantendo massima comodità di digitazione e consultazione rapida da smartphone.
- **Tracciato Reale della Carreggiata (Zero Linee Rette & Anti-Detour):** ogni tratto stradale segue rigorosamente la sagoma fisica e le curve reali della carreggiata (tramite stitching topologico dei way OpenStreetMap e routing bidirezionale anti-detour), eliminando tassativamente qualsiasi linea retta e prevenendo giri strani o deviazioni anomale.
- **Finestra Notizie Urgenti (Flash News 20s):** popup informativo visualizzato per 20 secondi all'avvio con barra di avanzamento per avvisi straordinari e criticità viabilistiche immediate.
- **Pulsante di Consultazione Rapida `🚨 News`:** permette agli operatori di riaprire e consultare in qualsiasi momento tutte le comunicazioni urgenti attive.
- **Pannello Gestione Notizie per Amministratore:** creazione, modifica e disattivazione di comunicazioni prioritarie (fino a 3 attive) con sincronizzazione istantanea su Firebase.
- **Modulo Segnalazioni Utenti:** invio rapido di segnalazioni di viabilità da parte dei cittadini e degli equipaggi sul territorio, con moderazione e validazione da pannello Admin.
- **Gestione Chiusure, Mercati e Sagre:** visualizzazione dinamica sulla mappa Leaflet con filtri temporali e sincronizzazione automatica.
- **UI Moderna e Responsiva:** layout ottimizzato con interfaccia fluida per smartphone, tablet e postazioni desktop di centrale.