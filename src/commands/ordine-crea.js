const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../db');
const { isStaff } = require('../permessi');
const { buildOrdineEmbed, buildOrdineRow } = require('../ordineEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ordine-crea')
    .setDescription('Crea un nuovo ordine in questo canale (solo staff)')
    .addUserOption((opt) =>
      opt.setName('acquirente').setDescription('Chi ha comprato').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('prodotti').setDescription('Cosa ha comprato').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('totale').setDescription('Totale, es. 15€').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('note').setDescription('Note aggiuntive (opzionale)').setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: '❌ Solo lo staff può creare ordini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const acquirente = interaction.options.getUser('acquirente');
    const prodotti = interaction.options.getString('prodotti');
    const totale = interaction.options.getString('totale');
    const note = interaction.options.getString('note') || '';

    const ordine = db.creaOrdine({
      buyerId: acquirente.id,
      buyerTag: acquirente.username,
      prodotti,
      totale,
      note,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      creatoDa: interaction.user.id,
      creatoDaTag: interaction.user.username,
    });

    const embed = buildOrdineEmbed(ordine);
    const row = buildOrdineRow(ordine.id);

    const messaggio = await interaction.reply({
      content: `${acquirente}`,
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // Salviamo l'ID del messaggio per poterlo aggiornare in futuro dalle modifiche
    db.aggiornaOrdine(ordine.id, { messageId: messaggio.id });

    // Pubblichiamo anche una copia nel canale log ordini, se configurato
    const canaleLogId = process.env.CANALE_ORDINI_LOG_ID;
    if (canaleLogId) {
      try {
        const canaleLog = await interaction.client.channels.fetch(canaleLogId);
        const messaggioLog = await canaleLog.send({ embeds: [embed], components: [row] });
        db.aggiornaOrdine(ordine.id, {
          logChannelId: canaleLogId,
          logMessageId: messaggioLog.id,
        });
      } catch (err) {
        console.error('Impossibile pubblicare nel canale log ordini:', err.message);
      }
    }
  },
};
