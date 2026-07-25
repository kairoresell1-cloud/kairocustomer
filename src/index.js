require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, MessageFlags, REST, Routes } = require('discord.js');
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

const commandsJson = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  commandsJson.push(command.data.toJSON());
}

// Registra i comandi slash su Discord automaticamente, ad ogni avvio del bot
async function registraComandi() {
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsJson }
    );
    console.log(`✅ ${commandsJson.length} comandi slash registrati.`);
  } catch (err) {
    console.error('⚠️ Errore registrando i comandi slash:', err.message);
  }
}

client.once('clientReady', async () => {
  console.log(`Bot online come ${client.user.tag}`);
  await registraComandi();
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
