const { EmbedBuilder } = require('discord.js');

async function inviaNotificaPagamento(client, transazione) {
  const canale = await client.channels.fetch(process.env.CANALE_PAGAMENTI_ID);
  if (!canale) {
    console.error('Canale pagamenti non trovato, controlla CANALE_PAGAMENTI_ID');
    return;
  }

  const stato = transazione.statoPayPal === 'S' ? '✅ Completato' : `⏳ ${transazione.statoPayPal}`;

  const embed = new EmbedBuilder()
    .setTitle('💰 Nuovo pagamento ricevuto')
    .setColor(0x9b59b6) // purple, per restare in tema con lo shop
    .addFields(
      { name: 'Da', value: transazione.nome, inline: true },
      { name: 'Importo', value: `${transazione.importo} ${transazione.valuta}`, inline: true },
      { name: 'Stato', value: stato, inline: true },
      { name: 'Descrizione', value: transazione.descrizione || 'Nessuna descrizione' },
      { name: 'Data', value: new Date(transazione.data).toLocaleString('it-IT') }
    )
    .setFooter({ text: `ID transazione: ${transazione.id}` });

  await canale.send({ embeds: [embed] });
}

module.exports = { inviaNotificaPagamento };
