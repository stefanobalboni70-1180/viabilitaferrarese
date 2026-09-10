# Viabilità Ferrara 118 - Versione 3.6.5

Applicazione per la gestione della viabilità, segnalazioni stradali e navigazione per i mezzi di soccorso 118 di Ferrara e Provincia.

### Regole di Circolazione Mezzi di Soccorso 118 (v3.6.5):
- **Sensi Unici Ordinari Rispettati:** tutti i percorsi di navigazione rispettano scrupolosamente i sensi unici di marcia e la direzione ordinaria consentita per i veicoli, evitando manovre contromano su strade a senso unico.
- **Corsie Preferenziali Bus e Taxi:** autorizzazione e sfruttamento delle corsie riservate a bus e taxi (es. Corso Giovecca, Viale Cavour, Corso Porta Reno, Via Kennedy, Via Bologna corsia bus) con badge dedicato `🚌 Corsia Bus/Taxi`.
- **Chiusure Stradali e Ponti Interrotti come Interruzioni Totali:** ogni strada chiusa (`chiusa`), cantiere bloccante (`lavori`) o ponte interrotto (`ponte`) è trattato come una barriera fisica non oltrepassabile. Se un ponte su fiumi/canali provinciali (Po, Po di Volano, Canale Boicelli, Reno, ecc.) è interrotto, il sistema forza l'itinerario sul ponte alternativo aperto più vicino.
- **Limiti di Sagoma e Altezza per Ambulanze (Tipo A / MSA / MSB):**
  - Altezza massima considerata: **2.80 m** (con barra lampeggianti e antenne).
  - Larghezza minima di passaggio: **2.30 m** (inclusi specchietti retrovisori).
  - Punti con franchigia inferiore (sottopassi ferroviari bassi, varchi stretti storici) vengono automaticamente rilevati e bypassati.
- **Corsie e Direttrici di Scorrimento Veloce:** priorità di utilizzo e valorizzazione di Tangenziale Ovest, Tangenziale Est, Raccordo Autostradale Ferrara-Porto Garibaldi (RA8), SS16 Adriatica e SS64 con badge `⚡ Scorrimento Veloce`.
- **Riconoscimento Geometrico ZTL Provinciali:** delimitazione poligonale ZTL per Ferrara (Principale e Nucleo Pedonale), Cento, Comacchio, Argenta, Bondeno, Portomaggiore, Copparo e Codigoro.
- **Aree Mercatali Attive come ZTL Dinamiche:** i mercati settimanali e rionali attivi vengono rilevati e gestiti come ZTL/aree pedonali a tempo con bypass dedicati.
- **Transito Fuori ZTL Garantito:** se il percorso 1 transita per la ZTL/Mercato, il Percorso 2 è sempre garantito sulla viabilità ordinaria esterna (`🚗 Fuori ZTL`).
- **Guida Vocale Turn-by-Turn con HUD Dinamico:** istruzioni vocali anticipate e immediate, calcolo scalare dei metri e ricalcolo istantaneo in caso di fuori rotta.