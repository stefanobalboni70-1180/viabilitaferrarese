# Viabilità Ferrara 118 - Versione 3.9.15

Applicazione web progressiva (PWA) e dashboard interattiva per la gestione e consultazione della viabilità e criticità stradali per il servizio 118 della provincia di Ferrara.

### Funzionalità Principali (v3.9.15):
- **Tracciamento Manuale Percorsi ed Eventi Speciali (Admin):**
  - Tracciamento a mano punto per punto sulla mappa direttamente da PC o Smartphone con toolbar dedicata (`↩️ Annulla punto`, `🗑️ Pulisci`, `💾 Salva`).
  - **Colori Personalizzati (non rossi):** scelta rapida da palette di colori brillanti (Viola, Blu, Arancione, Giallo, Verde, Fucsia, Ciano o selettore personalizzato) per distinguere immediatamente gare, cortei e manifestazioni dalle normali chiusure stradali rosse.
  - **Controllo Totale della Visibilità:** interruttore istantaneo ON/OFF (*«Mostra subito al pubblico»* / *«Nascosto»*) e programmazione temporale automatica per far apparire e scomparire il tracciato all'orario stabilito.
  - **Archivio Percorsi:** gestione completa dei percorsi salvati con centratura rapida sulla mappa (`🔍 Mappa`), modifica e cancellazione.
  - **Popup Informativo & Calcolo Distanza:** visualizzazione automatica della lunghezza del percorso in km, tipologia di evento e note di viabilità al tocco o click sul tracciato.
- **Nuove Icone Vettoriali Ufficiali:**
  - **Elisoccorso / Eliporto:** nuova icona vettoriale con elicottero rosso 118 in fase di atterraggio su elisuperficie con cerchio ed H bianca.
  - **Mercato Settimanale:** icona vettoriale con carrello della spesa nero su cerchio bianco con contorno verde.
- **Layout Mobile Strutturato:**
  - Pulsanti compatti e barra strumenti ottimizzata per schermi touch di qualsiasi dimensione.
- **Tracciato Reale della Carreggiata (Zero Linee Rette & Anti-Detour):** ogni tratto stradale segue rigorosamente la sagoma fisica e le curve reali della carreggiata (tramite stitching topologico dei way OpenStreetMap e routing bidirezionale anti-detour), eliminando tassativamente qualsiasi linea retta e prevenendo giri strani o deviazioni anomale.
- **Finestra Notizie Urgenti (Flash News 20s):** popup informativo visualizzato per 20 secondi all'avvio con barra di avanzamento per avvisi straordinari e criticità viabilistiche immediate.
- **Pulsante di Consultazione Rapida `🚨 News`:** permette agli operatori di riaprire e consultare in qualsiasi momento tutte le comunicazioni urgenti attive.
- **Pannello Gestione Notizie per Amministratore:** creazione, modifica e disattivazione di comunicazioni prioritarie (fino a 3 attive) con sincronizzazione istantanea su Firebase.
- **Modulo Segnalazioni Utenti:** invio rapido di segnalazioni di viabilità da parte dei cittadini e degli equipaggi sul territorio, con moderazione e validazione da pannello Admin.
- **Gestione Chiusure, Mercati e Sagre:** visualizzazione dinamica sulla mappa Leaflet con filtri temporali e sincronizzazione automatica.
- **UI Moderna e Responsiva:** layout ottimizzato con interfaccia fluida per smartphone, tablet e postazioni desktop di centrale.