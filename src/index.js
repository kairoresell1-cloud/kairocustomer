require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getTransazioniRecenti } = require('./paypalTransactions');
const { getIdGiaNotificati, salvaIdNotificati } = require('./store');
const { inviaNotificaPagamento } = require('./discordNotify');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function controllaPagamenti() {
  try {
    const transazioni = await getTransazioniRecenti(6); // ultime 6 ore
    const giaNotificati = getIdGiaNotificati();

    const nuove = transazioni.filter((t) => !giaNotificati.has(t.id));

    if (nuove.length === 0) {
      console.log(`[${new Date().toLocaleTimeString('it-IT')}] Nessun nuovo pagamento.`);
      return;
    }

    for (const transazione of nuove) {
      await inviaNotificaPagamento(client, transazione);
      giaNotificati.add(transazione.id);
      console.log(`Notificato pagamento ${transazione.id} da ${transazione.nome}`);
    }

    salvaIdNotificati(giaNotificati);
  } catch (err) {
    console.error('Errore durante il controllo pagamenti:', err.message);
  }
}

client.once('ready', () => {
  console.log(`Bot online come ${client.user.tag}`);

  const intervalloMinuti = parseInt(process.env.CHECK_INTERVAL_MINUTI || '3', 10);
  console.log(`Controllo pagamenti ogni ${intervalloMinuti} minuti.`);

  // Primo controllo subito all'avvio, poi a intervalli regolari
  controllaPagamenti();
  setInterval(controllaPagamenti, intervalloMinuti * 60 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
