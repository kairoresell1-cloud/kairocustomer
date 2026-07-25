const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { isStaff } = require('../permessi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recensioni-setup')
    .setDescription('Pubblica il messaggio fisso per lasciare recensioni in questo canale (solo staff)'),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: '❌ Solo lo staff può farlo.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('⭐ Lascia una recensione')
      .setColor(0x9b59b6)
      .setDescription(
        'Se hai appena completato un ordine e lo staff ti ha sbloccato la recensione, clicca qui sotto per lasciarne una.\n\nPuoi farlo **una sola volta** per ogni sblocco.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('review_start')
        .setLabel('Lascia una recensione')
        .setEmoji('⭐')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: '✅ Messaggio pubblicato.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
