const fs = require("node:fs");
const path = require("node:path");

const Discord = require("discord.js");
const CharacterAI = require("node_characterai");
const {
  handleListCommand,
  handleSelectCommand,
  handleChatCommand,
  handleGenImageCommand,
} = require("./controllers/relatedCharacterAI");

const { GatewayIntentBits } = Discord;

require("dotenv").config();

const sessionTokenFromCharacterId = process.env.sessionTokenFromCharacterId;
const discordToken = process.env.discordToken;
const guildId = process.env.guildId;
const clientId = process.env.clientId;

const characterAI = new CharacterAI();
const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Discord.Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Authenticating as a guest (use `.authenticateWithToken()` to use an account)
// await characterAI.authenticateAsGuest();
characterAI.authenticateWithToken(sessionTokenFromCharacterId);

async function handleHelpCommand(message, commands) {
  const mappedString = commands
    .map((command) => `w!$\`{command.command}\` - ${command.description}`)
    .join("\n");
  message.channel.send(
    // "Available commands:\n`w!list` - List of characters\n`w!select <number>` - Select a character\n`w!chat <message>` - Chat with the selected character\n`w!genImage <message>` - Generate an image based on the message\n`w!help` - List of available commands"
    "Available commands: \n" + mappedString
  );
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("w!list")) {
    await handleListCommand(message);
  } else if (message.content.startsWith("w!select")) {
    await handleSelectCommand(message, characterAI);
  } else if (message.content.startsWith("w!chat")) {
    await handleChatCommand(message, characterAI);
  } else if (message.content.startsWith("w!genImage")) {
    await handleGenImageCommand(message, characterAI);
  } else if (message.content.startsWith("w!help")) {
    handleHelpCommand(message, commands);
  }
});

client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  console.log(interaction);
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(discordToken);
