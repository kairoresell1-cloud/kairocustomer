const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../db');
const { isStaff } = require('../permessi');
const { buildOrdineEmbed, buildOrdineRow } = require('../ordineEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ordine-cerca')
    .setDescription('Cerca ordini per acquirente, testo o ID ordine (solo staff)')
    .addUserOption((opt) =>
      opt.setName('acquirente').setDescription('Filtra per utente').setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('testo')
        .setDescription('Cerca per nome, prodotto o ID ordine')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: '❌ Solo lo staff può cercare ordini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const acquirente = interaction.options.getUser('acquirente');
    const testo = interaction.options.getString('testo');

    if (!acquirente && !testo) {
      return interaction.reply({
        content: '⚠️ Specifica almeno un acquirente o un testo da cercare.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const risultati = db.cercaOrdini({
      buyerId: acquirente?.id,
      testo: testo || undefined,
    });

    if (risultati.length === 0) {
      return interaction.reply({
        content: '🔍 Nessun ordine trovato.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const daMostrare = risultati.slice(0, 5);
    const embeds = daMostrare.map(buildOrdineEmbed);
    const components = daMostrare.map((o) => buildOrdineRow(o.id));

    let content = `🔍 Trovati **${risultati.length}** ordini`;
    if (risultati.length > 5) content += ` (mostro i primi 5, affina la ricerca per vedere gli altri)`;

    await interaction.reply({
      content,
      embeds,
      components,
      flags: MessageFlags.Ephemeral,
    });
  },
};
