const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

function buildModificaModal(ordine) {
  const modal = new ModalBuilder()
    .setCustomId(`order_edit_modal_${ordine.id}`)
    .setTitle(`Modifica ordine ${ordine.id}`);

  const prodottiInput = new TextInputBuilder()
    .setCustomId('prodotti')
    .setLabel('Prodotti')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(ordine.prodotti)
    .setRequired(true);

  const totaleInput = new TextInputBuilder()
    .setCustomId('totale')
    .setLabel('Totale (es. 15€)')
    .setStyle(TextInputStyle.Short)
    .setValue(ordine.totale)
    .setRequired(true);

  const statoInput = new TextInputBuilder()
    .setCustomId('stato')
    .setLabel('Stato (In lavorazione / Completato / Annullato)')
    .setStyle(TextInputStyle.Short)
    .setValue(ordine.stato)
    .setRequired(true);

  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel('Note')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(ordine.note || '')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(prodottiInput),
    new ActionRowBuilder().addComponents(totaleInput),
    new ActionRowBuilder().addComponents(statoInput),
    new ActionRowBuilder().addComponents(noteInput)
  );

  return modal;
}

module.exports = { buildModificaModal };
