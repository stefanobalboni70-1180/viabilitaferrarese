# Viabilità Ferrara 118 - Versione 3.6.3

Applicazione per la gestione della viabilità, segnalazioni stradali e navigazione per i mezzi di soccorso 118 di Ferrara.

### Funzionalità Navigazione Soccorso 118:
- **Guida Vocale con Voce Femminile:** indicazioni vocali chiare in anticipo (~100 metri prima della manovra) e ripetute nell'immediatezza (~15-20 metri prima della svolta), con pulsante mute/unmute nell'HUD.
- **Avanzamento Dinamico Istruzioni Turn-by-Turn:** l'HUD superiore visualizza in tempo reale la distanza scalare alla manovra (es. "Tra 90 m" -> "Tra 40 m" -> "Ora"), il nome della via e i km/minuti residui che avanzano man mano che il veicolo procede.
- **Ricalcolo Istantaneo Fuori Rotta:** in caso di svolta mancata o deviazione imprevista dal tracciato (>35m), il sistema ricalcola istantaneamente il percorso ottimale con avviso vocale "Ricalcolo del percorso in corso...".
- **3 Differenti Scelte di Percorso a Colori Distinti:** proposta di 3 itinerari distinti (Blu `#2563eb`, Verde `#059669`, Viola `#7c3aed`) visualizzati simultaneamente su mappa e selezionabili da schede dedicate.
- **Alternativa Evita ZTL Garantita:** se il tragitto più rapido attraversa la ZTL del centro storico, il navigatore propone sin dalla partenza tra le 3 opzioni un itinerario alternativo che **aggira completamente la ZTL** su viabilità ordinaria (`🚫 Fuori ZTL`).
- **Alternativa Evita Mercati Garantita:** in caso di mercati rionali o settimanali attivi lungo il tragitto, il navigatore propone obbligatoriamente un'opzione alternativa che **esclude totalmente l'area del mercato** (`🛒 Evita Mercato`).
- **Micro-Deviazioni Ultra-Brevi su Strade Chiuse:** aggiramento stretto di strade interrotte, cantieri, ponti e sagre attraverso le vie adiacenti più vicine, preservando il transito sul senso unico alternato (non bloccante).
- **Transito ZTL Ammesso (Soccorso 118):** passaggio autorizzato nelle Zone a Traffico Limitato per calcolare la traiettoria più rapida verso il target.
- **Geometria Stradale ad Alta Fedeltà:** tracciamento fedele di ogni curva della carreggiata (incluse vie locali e rampe di svincolo RA8/SS16).