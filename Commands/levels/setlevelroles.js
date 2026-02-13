const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LevelRole = require('../../Models/LevelRoles'); // Model dosyasını içe aktarın

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlevelrole')
        .setDescription('Belirli bir seviyeye ulaşan kullanıcıya atanacak rolü ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Rol atanacak seviye.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Belirli seviyeye ulaşınca atanacak rol.')
                .setRequired(true)),
    
    async execute(interaction) {
        const level = interaction.options.getInteger('level').toString(); // Seviyeyi stringe dönüştürün
        const role = interaction.options.getRole('role');

        let levelRole = await LevelRole.findOne({ guildId: interaction.guild.id });

        if (!levelRole) {
            levelRole = new LevelRole({
                guildId: interaction.guild.id,
                levelRoles: {}
            });
        }

        levelRole.levelRoles.set(level, role.id); // Seviyeyi string olarak ayarla
        await levelRole.save();

        await interaction.reply(`Seviye ${level} için rol ayarlandı: ${role.name}`);
    }
};
