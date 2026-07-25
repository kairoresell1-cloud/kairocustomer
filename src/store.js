const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'data', 'notificate.json');

function assicuraCartella() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

function getIdGiaNotificati() {
  assicuraCartella();
  const raw = fs.readFileSync(FILE_PATH, 'utf-8');
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function salvaIdNotificati(setDiId) {
  assicuraCartella();
  // Teniamo solo gli ultimi 500 id per non far crescere il file all'infinito
  const arr = Array.from(setDiId).slice(-500);
  fs.writeFileSync(FILE_PATH, JSON.stringify(arr, null, 2));
}

module.exports = { getIdGiaNotificati, salvaIdNotificati };
