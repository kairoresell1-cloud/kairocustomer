const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../db');
const { isStaff } = require('../permessi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recensione-dai')
    .setDescription('Sblocca la possibilità di lasciare una recensione a un utente (solo staff)')
    .addUserOption((opt) =>
      opt.setName('utente').setDescription('Chi può lasciare la recensione').setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('ordine')
        .setDescription('ID ordine collegato (opzionale, per riferimento)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: '❌ Solo lo staff può sbloccare le recensioni.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const utente = interaction.options.getUser('utente');
    const ordineId = interaction.options.getString('ordine');

    if (ordineId && !db.getOrdinePerId(ordineId)) {
      return interaction.reply({
        content: `⚠️ Non trovo nessun ordine con ID \`${ordineId}\`. Controlla e riprova (oppure lascia il campo vuoto).`,
        flags: MessageFlags.Ephemeral,
      });
    }

    db.setRecensionePendente(utente.id, {
      ordineId: ordineId || null,
      concessaDa: interaction.user.id,
    });

    const canaleId = process.env.CANALE_RECENSIONI_ID;

    await interaction.reply({
      content: `✅ ${utente} può ora lasciare una recensione${
        canaleId ? ` in <#${canaleId}>` : ''
      }. Potrà farlo una sola volta.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
