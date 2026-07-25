const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const db = require('./db');
const { isStaff } = require('./permessi');
const { buildOrdineEmbed, buildOrdineRow } = require('./ordineEmbed');
const { buildModificaModal } = require('./modificaModal');

// Teniamo in memoria le stelle scelte tra il momento del select e l'apertura del modal
// (piccola mappa temporanea, si autopulisce dopo l'uso)
const stelleScelte = new Map();

async function gestisciBottone(interaction) {
  const { customId } = interaction;

  // ---------- Modifica ordine ----------
  if (customId.startsWith('order_edit_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: '❌ Solo lo staff può modificare ordini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const ordineId = customId.replace('order_edit_', '');
    const ordine = db.getOrdinePerId(ordineId);

    if (!ordine) {
      return interaction.reply({
        content: '⚠️ Ordine non trovato (potrebbe essere stato rimosso).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = buildModificaModal(ordine);
    return interaction.showModal(modal);
  }

  // ---------- Avvio recensione ----------
  if (customId === 'review_start') {
    const pendente = db.getRecensionePendente(interaction.user.id);

    if (!pendente) {
      return interaction.reply({
        content:
          '❌ Non hai nessuna recensione da lasciare al momento. Deve essere lo staff a sbloccartela dopo un ordine.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('review_stars_select')
      .setPlaceholder('Scegli quante stelle dare')
      .addOptions(
        { label: '⭐ 1 stella', value: '1' },
        { label: '⭐⭐ 2 stelle', value: '2' },
        { label: '⭐⭐⭐ 3 stelle', value: '3' },
        { label: '⭐⭐⭐⭐ 4 stelle', value: '4' },
        { label: '⭐⭐⭐⭐⭐ 5 stelle', value: '5' }
      );

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
      content: 'Quante stelle vuoi dare?',
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function gestisciSelectMenu(interaction) {
  if (interaction.customId !== 'review_stars_select') return;

  const pendente = db.getRecensionePendente(interaction.user.id);
  if (!pendente) {
    return interaction.update({
      content: '❌ Il tempo per lasciare questa recensione è scaduto o è già stata usata.',
      components: [],
    });
  }

  const stelle = interaction.values[0];
  stelleScelte.set(interaction.user.id, stelle);

  const modal = new ModalBuilder()
    .setCustomId('review_comment_modal')
    .setTitle(`Recensione - ${stelle} stelle`);

  const commentoInput = new TextInputBuilder()
    .setCustomId('commento')
    .setLabel('Scrivi la tua recensione')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder().addComponents(commentoInput));

  return interaction.showModal(modal);
}

async function gestisciModal(interaction) {
  const { customId } = interaction;

  // ---------- Salva modifiche ordine ----------
  if (customId.startsWith('order_edit_modal_')) {
    const ordineId = customId.replace('order_edit_modal_', '');
    const ordineEsistente = db.getOrdinePerId(ordineId);

    if (!ordineEsistente) {
      return interaction.reply({
        content: '⚠️ Ordine non trovato.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const prodotti = interaction.fields.getTextInputValue('prodotti');
    const totale = interaction.fields.getTextInputValue('totale');
    const stato = interaction.fields.getTextInputValue('stato');
    const note = interaction.fields.getTextInputValue('note');

    const ordineAggiornato = db.aggiornaOrdine(ordineId, {
      prodotti,
      totale,
      stato,
      note,
      ultimaModificaDa: interaction.user.id,
      ultimaModificaDaTag: interaction.user.username,
      dataUltimaModifica: new Date().toISOString(),
    });

    // Aggiorniamo il messaggio originale nel canale dell'ordine (es. il ticket), se lo troviamo
    try {
      if (ordineAggiornato.channelId && ordineAggiornato.messageId) {
        const canale = await interaction.client.channels.fetch(ordineAggiornato.channelId);
        const messaggio = await canale.messages.fetch(ordineAggiornato.messageId);
        await messaggio.edit({
          embeds: [buildOrdineEmbed(ordineAggiornato)],
          components: [buildOrdineRow(ordineAggiornato.id)],
        });
      }
    } catch (err) {
      console.error('Impossibile aggiornare il messaggio originale dell\'ordine:', err.message);
    }

    // Aggiorniamo anche la copia nel canale log ordini, se esiste
    try {
      if (ordineAggiornato.logChannelId && ordineAggiornato.logMessageId) {
        const canaleLog = await interaction.client.channels.fetch(ordineAggiornato.logChannelId);
        const messaggioLog = await canaleLog.messages.fetch(ordineAggiornato.logMessageId);
        await messaggioLog.edit({
          embeds: [buildOrdineEmbed(ordineAggiornato)],
          components: [buildOrdineRow(ordineAggiornato.id)],
        });
      }
    } catch (err) {
      console.error('Impossibile aggiornare la copia nel canale log ordini:', err.message);
    }

    return interaction.reply({
      content: `✅ Ordine \`${ordineId}\` aggiornato.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // ---------- Salva recensione ----------
  if (customId === 'review_comment_modal') {
    const pendente = db.getRecensionePendente(interaction.user.id);
    const stelle = stelleScelte.get(interaction.user.id);

    if (!pendente || !stelle) {
      return interaction.reply({
        content: '❌ Il tempo per lasciare questa recensione è scaduto o è già stata usata.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const commento = interaction.fields.getTextInputValue('commento');
    const canaleId = process.env.CANALE_RECENSIONI_ID;

    if (!canaleId) {
      return interaction.reply({
        content: '⚠️ Canale recensioni non configurato, contatta lo staff.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const canale = await interaction.client.channels.fetch(canaleId);

      // Cerchiamo un webhook già creato dal bot, altrimenti ne creiamo uno
      const webhooks = await canale.fetchWebhooks();
      let webhook = webhooks.find((w) => w.owner?.id === interaction.client.user.id);
      if (!webhook) {
        webhook = await canale.createWebhook({
          name: 'Recensioni',
        });
      }

      const stelleTesto = '⭐'.repeat(parseInt(stelle, 10));

      await webhook.send({
        content: `${stelleTesto}\n${commento}`,
        username: interaction.member?.displayName || interaction.user.username,
        avatarURL: interaction.user.displayAvatarURL(),
      });

      db.rimuoviRecensionePendente(interaction.user.id);
      stelleScelte.delete(interaction.user.id);

      return interaction.reply({
        content: '✅ Recensione pubblicata, grazie!',
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Errore pubblicazione recensione:', err.message);
      return interaction.reply({
        content: '⚠️ Errore durante la pubblicazione, riprova o contatta lo staff.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

module.exports = { gestisciBottone, gestisciSelectMenu, gestisciModal };
