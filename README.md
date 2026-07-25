# PayPal Notify Bot

Bot Discord che controlla periodicamente il tuo PayPal e avvisa un canale
(#pagamenti) quando arriva un nuovo pagamento, mostrando nome del mittente,
importo e **descrizione/nota del pagamento**.

## Come funziona

Ogni `CHECK_INTERVAL_MINUTI` minuti il bot chiede a PayPal le transazioni
recenti, confronta gli ID con quelli già notificati (salvati in
`data/notificate.json`) e posta un embed su Discord per ognuna di quelle nuove.

Non serve nessun comando: è tutto automatico.

## Setup

### 1. Crea l'app PayPal
1. Vai su https://developer.paypal.com/dashboard/applications
2. Login con il tuo account PayPal (Personal va bene)
3. "Create App" → dagli un nome → copia **Client ID** e **Secret**

### 2. Crea il bot Discord (se non l'hai già)
1. https://discord.com/developers/applications → New Application
2. Bot → copia il **Token**
3. Invita il bot nel server con permesso di leggere/scrivere nel canale #pagamenti
4. Copia l'**ID del canale** #pagamenti (tasto destro sul canale → Copia ID,
   serve la modalità sviluppatore attiva su Discord)

### 3. Configura le variabili
Copia `.env.example` in `.env` (in locale) oppure inseriscile direttamente
come variabili d'ambiente su Railway:

```
DISCORD_TOKEN=...
CANALE_PAGAMENTI_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_ENV=live
CHECK_INTERVAL_MINUTI=3
```

### 4. Installa ed avvia
```
npm install
npm start
```

## ⚠️ Nota importante su Railway: persistenza dati

Il file `data/notificate.json` serve a non notificare due volte lo stesso
pagamento. Su Railway, il filesystem di default **si resetta ad ogni nuovo
deploy** — se questo succede, il bot perde la memoria di cosa ha già
notificato e alla ripartenza potrebbe rinotificare le transazioni delle
ultime 6 ore.

Per evitarlo, su Railway aggiungi un **Volume** e montalo sulla cartella
`data/` del progetto (Railway → tuo servizio → Settings → Volumes). Così i
dati sopravvivono ai riavvii/deploy.

## Personalizzazione

- **Intervallo di controllo**: cambia `CHECK_INTERVAL_MINUTI` (occhio: PayPal
  ha dei rate limit sulle API, non scendere sotto 1 minuto)
- **Colore embed**: in `src/discordNotify.js`, `setColor(0x9b59b6)` — al
  momento impostato viola, in tema con lo shop
- **Quante ore indietro guardare ad ogni check**: in `src/index.js`,
  `getTransazioniRecenti(6)` — 6 ore è un buffer di sicurezza in caso il bot
  fosse stato offline

## Possibili estensioni future
- Comando `/verifica` per cercare manualmente un pagamento specifico
- Distinzione visiva tra pagamenti "Amici e Familiari" vs altri tipi
- Notifica anche di rimborsi/chargeback (stesso principio, transazione con
  importo negativo)
