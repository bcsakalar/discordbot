const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LevelRole = require('../../Models/LevelRoles'); // Model dosyasını içe aktarın

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removelevelrole')
        .setDescription('Belirli bir seviyeye atanmış olan rolü kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Rolü kaldırılacak seviye.')
                .setRequired(true)),
    
    async execute(interaction) {
        const level = interaction.options.getInteger('level').toString(); // Seviyeyi stringe dönüştürün
        
        const levelRole = await LevelRole.findOne({ guildId: interaction.guild.id });

        if (!levelRole || !levelRole.levelRoles.has(level)) {
            return interaction.reply(`Seviye ${level} için atanmış bir rol bulunamadı.`);
        }

        levelRole.levelRoles.delete(level); // Seviyeyi sil
        await levelRole.save();

        await interaction.reply(`Seviye ${level} için atanmış rol kaldırıldı.`);
    }
};
