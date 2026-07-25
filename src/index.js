require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const {
  gestisciBottone,
  gestisciSelectMenu,
  gestisciModal,
} = require('./interactionHandlers');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Carichiamo tutti i comandi dalla cartella commands/
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('clientReady', () => {
  console.log(`Bot online come ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      return gestisciBottone(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return gestisciSelectMenu(interaction);
    }

    if (interaction.isModalSubmit()) {
      return gestisciModal(interaction);
    }
  } catch (err) {
    console.error('Errore gestendo interazione:', err);
    const messaggioErrore = { content: '⚠️ Si è verificato un errore imprevisto.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(messaggioErrore).catch(() => {});
    } else {
      await interaction.reply(messaggioErrore).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
