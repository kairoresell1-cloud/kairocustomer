# Shop Manager Bot

Bot Discord per gestire ordini (dal ticket alla vendita) e recensioni,
riusando lo stesso bot/token già configurato in precedenza (tolta la parte
PayPal).

## Comandi

### `/ordine-crea` (solo staff)
Da lanciare dentro il canale ticket del cliente.
Opzioni: `acquirente` (tag utente), `prodotti`, `totale`, `note` (opzionale).
Crea un embed con i dettagli e un bottone **✏️ Modifica ordine**, e salva
tutto nel database (`data/ordini.json`). Se hai configurato
`CANALE_ORDINI_LOG_ID`, pubblica automaticamente una **copia identica**
anche in quel canale — così hai un colpo d'occhio su tutti gli ordini senza
dover cercare tra i ticket.

### Bottone "Modifica ordine"
Qualsiasi membro dello staff con accesso al canale può cliccarlo — funziona
sia dal messaggio nel ticket sia dalla copia nel canale log. Si apre un
modulo pre-compilato (prodotti, totale, stato, note), al salvataggio
aggiorna il database **e tutte le copie del messaggio** (ticket + canale
log), tracciando chi ha modificato e quando.

### `/ordine-cerca` (solo staff)
Cerca per `acquirente` (tag utente) e/o `testo` (nome, ID ordine, o parola
nei prodotti). Restituisce fino a 5 ordini con dettagli completi e bottone
di modifica diretto — funziona da qualsiasi canale in cui il comando sia
disponibile.

### `/recensione-dai` (solo staff)
Sblocca **una singola possibilità** di lasciare una recensione per
l'utente indicato. Opzionalmente puoi collegarla a un ID ordine specifico.

### `/recensioni-setup` (solo staff, da lanciare una volta)
Pubblica nel canale corrente il messaggio fisso con il bottone
**⭐ Lascia una recensione**. Lancialo una sola volta nel canale recensioni.

## Come funziona il flusso recensioni

1. Staff completa un ordine → lancia `/recensione-dai @utente`
2. L'utente va nel canale recensioni, clicca il bottone (visibile a tutti,
   ma utilizzabile solo da chi ha lo sblocco attivo)
3. Sceglie le stelle da un menu, poi scrive il commento in un modulo
4. Il messaggio viene pubblicato **tramite webhook**, con nome e avatar
   dell'utente — quindi appare come se l'avesse scritto lui direttamente,
   anche se il canale ha i permessi di scrittura bloccati per tutti tranne
   lo staff
5. Lo sblocco si consuma: per una nuova recensione serve un nuovo
   `/recensione-dai`

## Setup

### 1. Permessi del canale recensioni
Imposta il canale in modo che **@everyone non possa scrivere messaggi**
(Send Messages: ❌) ma possa **vedere il canale** (View Channel: ✅). Il bot
scrive comunque tramite webhook, che non dipende dai permessi dell'utente.
Assicurati che il bot abbia il permesso **Manage Webhooks** in quel canale.

### 1bis. Canale log ordini (opzionale ma consigliato)
Crea un canale tipo `#ordini` visibile solo allo staff. Copiane l'ID e
mettilo in `CANALE_ORDINI_LOG_ID`. Se lo lasci vuoto, il bot funziona lo
stesso ma gli ordini restano visibili solo dentro i rispettivi ticket.

### 2. Ruolo Staff
Crea (o usa uno esistente) un ruolo Staff su Discord, copiane l'ID (tasto
destro sul ruolo in Impostazioni server → Ruoli, serve la modalità
sviluppatore attiva).

### 3. Variabili d'ambiente
Copia `.env.example` in `.env` (o inseriscile su Railway):

```
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=...
STAFF_ROLE_ID=...
CANALE_RECENSIONI_ID=...
```

- `CLIENT_ID`: lo trovi in Discord Developer Portal → General Information → Application ID
- `GUILD_ID`: ID del tuo server (tasto destro sull'icona del server → Copia ID)

### 4. Installa e avvia

```
npm install
npm start
```

I comandi slash vengono registrati **automaticamente** ogni volta che il
bot si avvia — non devi lanciare nient'altro a mano.

### 5. Setup recensioni
Una volta online il bot, vai nel canale recensioni e lancia una volta sola
`/recensioni-setup`.

## ⚠️ Persistenza dati su Railway

Come per il bot precedente: il database (`data/ordini.json` e
`data/recensioni-pendenti.json`) va perso ad ogni redeploy se non usi un
**Volume**. Railway → tuo servizio → Settings → Volumes → crea un volume e
montalo sul path della cartella `data/` del progetto.

## Estensioni future possibili
- Comando `/ordine-elimina` per rimuovere ordini errati
- Statistiche automatiche (`/stats`) su vendite totali/settimanali
- Notifica automatica in un canale log ogni volta che un ordine cambia stato
