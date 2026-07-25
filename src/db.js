const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDINI_PATH = path.join(DATA_DIR, 'ordini.json');
const PENDING_PATH = path.join(DATA_DIR, 'recensioni-pendenti.json');

function assicuraFile(filePath, valoreIniziale) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(valoreIniziale, null, 2));
  }
}

function leggi(filePath, valoreIniziale) {
  assicuraFile(filePath, valoreIniziale);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return valoreIniziale;
  }
}

function scrivi(filePath, dati) {
  assicuraFile(filePath, Array.isArray(dati) ? [] : {});
  fs.writeFileSync(filePath, JSON.stringify(dati, null, 2));
}

// ---------- ORDINI ----------

function generaId() {
  // ID breve leggibile, es. "K7X2A9"
  const caratteri = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente 0/O/1/I per evitare ambiguità
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += caratteri[Math.floor(Math.random() * caratteri.length)];
  }
  return id;
}

function getOrdini() {
  return leggi(ORDINI_PATH, []);
}

function salvaOrdini(ordini) {
  scrivi(ORDINI_PATH, ordini);
}

function creaOrdine(datiOrdine) {
  const ordini = getOrdini();
  const nuovoOrdine = {
    id: generaId(),
    ...datiOrdine,
    stato: datiOrdine.stato || 'In lavorazione',
    dataCreazione: new Date().toISOString(),
    ultimaModificaDa: null,
    ultimaModificaDaTag: null,
    dataUltimaModifica: null,
  };
  ordini.push(nuovoOrdine);
  salvaOrdini(ordini);
  return nuovoOrdine;
}

function getOrdinePerId(id) {
  const ordini = getOrdini();
  return ordini.find((o) => o.id.toUpperCase() === id.toUpperCase());
}

function aggiornaOrdine(id, modifiche) {
  const ordini = getOrdini();
  const idx = ordini.findIndex((o) => o.id.toUpperCase() === id.toUpperCase());
  if (idx === -1) return null;

  ordini[idx] = { ...ordini[idx], ...modifiche };
  salvaOrdini(ordini);
  return ordini[idx];
}

// Cerca per ID Discord dell'acquirente o per nome/tag (contiene, case-insensitive)
function cercaOrdini({ buyerId, testo }) {
  const ordini = getOrdini();
  return ordini.filter((o) => {
    let match = true;
    if (buyerId) match = match && o.buyerId === buyerId;
    if (testo) {
      const t = testo.toLowerCase();
      match =
        match &&
        (o.buyerTag?.toLowerCase().includes(t) ||
          o.prodotti?.toLowerCase().includes(t) ||
          o.id.toLowerCase() === t);
    }
    return match;
  });
}

// ---------- RECENSIONI PENDENTI ----------

function getPendenti() {
  return leggi(PENDING_PATH, {});
}

function salvaPendenti(dati) {
  scrivi(PENDING_PATH, dati);
}

function setRecensionePendente(buyerId, dati) {
  const pendenti = getPendenti();
  pendenti[buyerId] = { ...dati, concessaIl: new Date().toISOString() };
  salvaPendenti(pendenti);
}

function getRecensionePendente(buyerId) {
  const pendenti = getPendenti();
  return pendenti[buyerId] || null;
}

function rimuoviRecensionePendente(buyerId) {
  const pendenti = getPendenti();
  delete pendenti[buyerId];
  salvaPendenti(pendenti);
}

module.exports = {
  creaOrdine,
  getOrdinePerId,
  aggiornaOrdine,
  cercaOrdini,
  getOrdini,
  setRecensionePendente,
  getRecensionePendente,
  rimuoviRecensionePendente,
};
