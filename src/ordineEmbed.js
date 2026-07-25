const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const COLORE = 0x9b59b6; // viola, in tema con lo shop

const COLORI_STATO = {
  'In lavorazione': 0xf1c40f,
  Completato: 0x2ecc71,
  Annullato: 0xe74c3c,
};

function buildOrdineEmbed(ordine) {
  const embed = new EmbedBuilder()
    .setTitle(`📦 Ordine ${ordine.id}`)
    .setColor(COLORI_STATO[ordine.stato] || COLORE)
    .addFields(
      { name: 'Acquirente', value: `<@${ordine.buyerId}> (${ordine.buyerTag})`, inline: true },
      { name: 'Totale', value: ordine.totale, inline: true },
      { name: 'Stato', value: ordine.stato, inline: true },
      { name: 'Prodotti', value: ordine.prodotti },
      { name: 'Note', value: ordine.note?.trim() ? ordine.note : '_Nessuna nota_' },
      {
        name: 'Creato',
        value: `da <@${ordine.creatoDa}> il ${new Date(ordine.dataCreazione).toLocaleString('it-IT')}`,
      }
    )
    .setFooter({ text: `ID ordine: ${ordine.id}` });

  if (ordine.ultimaModificaDa) {
    embed.addFields({
      name: 'Ultima modifica',
      value: `da <@${ordine.ultimaModificaDa}> il ${new Date(ordine.dataUltimaModifica).toLocaleString('it-IT')}`,
    });
  }

  return embed;
}

function buildOrdineRow(ordineId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`order_edit_${ordineId}`)
      .setLabel('✏️ Modifica ordine')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = { buildOrdineEmbed, buildOrdineRow };
