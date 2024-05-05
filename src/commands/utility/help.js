const { SlashCommandBuilder } = require("discord.js");
const listCommands = require("../../constants/listCommands")

const mappedString = listCommands
  .map((command) => "w!`" + `${command.name}` + "` - " + `${command.description}`)
  .join("\n");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List of available commands"),
  async execute(interaction) {
    await interaction.reply("Available commands: \n" + mappedString);
  },
};
