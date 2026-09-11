# Viabilità Ferrara 118 - Versione 3.6.17

Applicazione per la gestione della viabilità, segnalazioni stradali e navigazione per i mezzi di soccorso 118 di Ferrara e Provincia.

### Regole di Circolazione Mezzi di Soccorso 118 (v3.6.17):
- **Blocco Assoluto Ponti Bassi e Sottopassi Ferroviari:** esclusione totale di ponti bassi e sottopassi a sagoma ridotta, incluso il **Ponte di Via Golena sul Po di Volano (limite 2.50m)**, Sottopasso Via Mulinetto / Argine Ducale (2.20m), Via Poletti (2.40m), Via Felisatti (2.30m), sottopassi ciclopedonali Stazione FS e varchi storici, con deviazione automatica garantita su assi a luce libera per ambulanze (h >= 2.80m).
- **Esclusione Tracciati Biciclette / Ciclopedonali:** tutti i percorsi di soccorso 118 sono calcolati esclusivamente su viabilità veicolare idonea ad ambulanze Tipo A (3.8t, h 2.80m, l 2.30m).
- **Calcolo Navigazione 118 Ultra-Rapido e Parallelo:** calcolo simultaneo concorrente di tutte le rotte e deviazioni in meno di un secondo, con timeout protetti e fallback garantito.
- **Geocodifica Istantanea Locale POI:** risoluzione a 0ms di tutti i principali presidi sanitari, ospedali provinciali (Cona, Sant'Anna, Cento, Delta, Argenta, Comacchio, Bondeno, Copparo, Codigoro), stazioni e piazze.
- **Tracciato Reale Strade Chiuse (OSM Way Geometry):** ogni tratto stradale interrotto (es. Via Ruffetta) segue fedelmente e al 100% la sagoma della carreggiata OpenStreetMap con tutte le sue curve, con divieto assoluto di deviare su strade con nome diverso (es. SP4) e divieto di formare linee rette.
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