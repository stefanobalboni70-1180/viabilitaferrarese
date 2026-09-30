# Viabilità Ferrara 118 - Versione 3.9.16

Applicazione web progressiva (PWA) e dashboard interattiva per la gestione e consultazione della viabilità e criticità stradali per il servizio 118 della provincia di Ferrara.

### Funzionalità Principali (v3.9.16):
- **Accesso Riservato & Controllo Utenti (Gatekeeper):**
  - **Blocco Iniziale di Sicurezza:** la mappa, le vie e le comunicazioni sono protette e visibili esclusivamente agli utenti e alle postazioni 118 autorizzate.
  - **Gestione Account da parte dell'Admin (`👥 Utenti`):** creazione account per operatori/postazioni (nome, email/username, password provvisoria con generatore casuale), assegnazione ruoli (`🚑 Operatore` vs `👑 Amministratore`), visualizzazione lista account e revoca istantanea dell'accesso (`🚫 Disabilita` / `🟢 Riabilita` / `🗑️ Elimina`).
  - **Copia Credenziali Rapida:** riepilogo credenziali generato automaticamente con pulsante `📋 Copia` per l'invio immediato tramite WhatsApp o messaggio all'operatore.
  - **Cambio Password Autonomo:** ogni utente può modificare la propria password in qualsiasi momento dal pulsante `👤 Profilo` e recuperarla tramite `🔑 Password Dimenticata`.
  - **Cambio Password Obbligatorio al Primo Accesso:** opzione configurabile dall'Admin per forzare l'operatore a impostare una password privata e sicura al suo primo login.
- **Tracciamento Manuale Percorsi ed Eventi Speciali (Admin):**
  - Tracciamento a mano punto per punto sulla mappa direttamente da PC o Smartphone con toolbar dedicata (`↩️ Annulla punto`, `🗑️ Pulisci`, `💾 Salva`).
  - **Colori Personalizzati (non rossi):** scelta rapida da palette di colori brillanti (Viola, Blu, Arancione, Giallo, Verde, Fucsia, Ciano o selettore personalizzato) per distinguere immediatamente gare, cortei e manifestazioni dalle normali chiusure stradali rosse.
  - **Controllo Totale della Visibilità:** interruttore istantaneo ON/OFF (*«Mostra subito al pubblico»* / *«Nascosto»*) e programmazione temporale automatica per far apparire e scomparire il tracciato all'orario stabilito.
  - **Archivio Percorsi:** gestione completa dei percorsi salvati con centratura rapida sulla mappa (`🔍 Mappa`), modifica e cancellazione.
  - **Popup Informativo & Calcolo Distanza:** visualizzazione automatica della lunghezza del percorso in km, tipologia di evento e note di viabilità al tocco o click sul tracciato.
- **Icone Vettoriali Ufficiali:**
  - **Elisoccorso / Eliporto:** icona vettoriale con elicottero rosso 118 in fase di atterraggio su elisuperficie con cerchio ed H bianca.
  - **Mercato Settimanale:** icona vettoriale con carrello della spesa nero su cerchio bianco con contorno verde.
- **Finestra Notizie Urgenti (Flash News 20s):** popup informativo visualizzato per 20 secondi all'avvio con barra di avanzamento per avvisi straordinari e criticità viabilistiche immediate.
- **Pulsante di Consultazione Rapida `🚨 News`:** permette agli operatori di riaprire e consultare in qualsiasi momento tutte le comunicazioni urgenti attive.
- **Modulo Segnalazioni Utenti:** invio rapido di segnalazioni di viabilità da parte degli equipaggi sul territorio, con moderazione e validazione da pannello Admin.
- **Gestione Chiusure, Mercati e Sagre:** visualizzazione dinamica sulla mappa Leaflet con filtri temporali e sincronizzazione automatica.
- **UI Moderna e Responsiva:** layout ottimizzato con interfaccia fluida per smartphone, tablet e postazioni desktop di centrale.