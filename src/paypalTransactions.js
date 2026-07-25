const fetch = require('node-fetch');
const { getPayPalToken, getBaseUrl } = require('./paypalAuth');

// Prende tutte le transazioni in entrata delle ultime `oreIndietro` ore
async function getTransazioniRecenti(oreIndietro = 6) {
  const token = await getPayPalToken();

  const now = new Date();
  const start = new Date(now.getTime() - oreIndietro * 60 * 60 * 1000);

  // PayPal vuole le date in formato ISO con offset, max 31 giorni di range
  const params = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: now.toISOString(),
    fields: 'all',
    page_size: '100',
    page: '1',
  });

  const res = await fetch(
    `${getBaseUrl()}/v1/reporting/transactions?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore lettura transazioni PayPal: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const dettagli = data.transaction_details || [];

  // Teniamo solo i pagamenti in entrata (importo positivo)
  return dettagli
    .filter((t) => {
      const importo = parseFloat(t.transaction_info?.transaction_amount?.value || '0');
      return importo > 0;
    })
    .map((t) => normalizzaTransazione(t));
}

// Estrae solo i campi che ci interessano, inclusa la descrizione/nota del pagamento
function normalizzaTransazione(t) {
  const info = t.transaction_info || {};
  const payer = t.payer_info || {};

  const nome = [payer.payer_name?.given_name, payer.payer_name?.surname]
    .filter(Boolean)
    .join(' ') || payer.email_address || 'Sconosciuto';

  // La descrizione può stare in transaction_subject (oggetto) o transaction_note (nota)
  const descrizione =
    info.transaction_subject || info.transaction_note || 'Nessuna descrizione';

  return {
    id: info.transaction_id,
    data: info.transaction_initiation_date,
    importo: info.transaction_amount?.value,
    valuta: info.transaction_amount?.currency_code,
    nome,
    descrizione,
    statoPayPal: info.transaction_status, // es: S = completato, P = in sospeso
  };
}

module.exports = { getTransazioniRecenti };
