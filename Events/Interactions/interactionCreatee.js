const { PermissionsBitField } = require('discord.js');
const ServerSettings = require("../../Models/ServerSettings");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      if (!interaction.isStringSelectMenu()) return;

      const { customId, values, guildId } = interaction;
      const selectedChannelId = values[0];

      if (customId.startsWith("select_")) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "Bu işlemi gerçekleştirmek için yeterli yetkiniz yok.", ephemeral: true });
        }

        let settingType;

        switch (customId) {
          case "select_game_channel":
            settingType = "game_channel";
            break;
          case "select_fun_channel":
            settingType = "fun_channel";
            break;
          case "select_cekilis_channel":
            settingType = "cekilis_channel";
            break;
          case "select_info_channel":
            settingType = "info_channel";
            break;
          case "select_levels_channel":
            settingType = "levels_channel";
            break;
          case "select_moderation_channel":
            settingType = "moderation_channel";
            break;
          case "select_tools_channel":
            settingType = "tools_channel";
            break;
          case "select_poll_channel":
            settingType = "poll_channel";
            break;
          case "select_reactor_channel":
            settingType = "reactor_channel";
            break;
          case "select_ticket_channel":
            settingType = "ticket_channel";
            break;
          default:
            return interaction.reply({
              content: "Geçersiz kanal seçimi.",
              ephemeral: true,
            });
        }

        if (selectedChannelId !== "all_channels") {
          await ServerSettings.findOneAndUpdate(
            { guildId: guildId },
            { [settingType]: selectedChannelId },
            { upsert: true, new: true }
          );

          await interaction.reply({
            content: `**${
              settingType === "game_channel"
                ? "Oyun Kanalı"
                : settingType === "fun_channel"
                ? "Eğlence Kanalı"
                : settingType === "cekilis_channel"
                ? "Çekiliş Kanalı"
                : settingType === "info_channel"
                ? "Bilgi Kanalı"
                : settingType === "levels_channel"
                ? "Level Kanalı"
                : settingType === "moderasyon_channel"
                ? "Moderasyon Kanalı"
                : settingType === "poll_channel"
                ? "Anket Kanalı"
                : settingType === "reactor_channel"
                ? "Tepki Kanalı"
                : settingType === "ticket_channel"
                ? "Ticket Kanalı"
                : "Araçlar Kanalı"
            }** başarıyla ayarlandı!`,
            ephemeral: true,
          });
        } else {
          await ServerSettings.findOneAndUpdate(
            { guildId: guildId },
            { [settingType]: "all_channels" },
            { upsert: true, new: true }
          );
          await interaction.reply({
            content: `**${
              settingType === "game_channel"
                ? "Oyun Kanalı"
                : settingType === "fun_channel"
                ? "Eğlence Kanalı"
                : settingType === "cekilis_channel"
                ? "Çekiliş Kanalı"
                : settingType === "info_channel"
                ? "Bilgi Kanalı"
                : settingType === "levels_channel"
                ? "Level Kanalı"
                : settingType === "moderasyon_channel"
                ? "Moderasyon Kanalı"
                : settingType === "poll_channel"
                ? "Anket Kanalı"
                : settingType === "reactor_channel"
                ? "Tepki Kanalı"
                : settingType === "ticket_channel"
                ? "Ticket Kanalı"
                : "Araçlar Kanalı"
            }** tüm kanallarda kullanılacak şekilde ayarlandı!`,
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      console.error("Interaction error:", error);
      await interaction.reply({
        content:
          "Bir hata oluştu veya bu seçenekleri kullanmak için belirli izinlere sahip değilsiniz!",
        ephemeral: true,
      });
    }
  },
};
