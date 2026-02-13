const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require('discord.js');
const Levels = require('discord.js-leveling');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = {
    data: new SlashCommandBuilder()
   .setName('xp')
   .setDescription("Bir üyenin XP'sini ayarla")
   .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
   .addSubcommand(subcommand => 
    subcommand.setName('add')
    .setDescription('Bir üyeye XP ekle')
    .addUserOption(option => 
        option.setName('hedef')
       .setDescription('XP eklenecek üyeyi seç')
       .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
       .setDescription('XP miktarını seç')
       .setMinValue(0)
       .setRequired(true)
    )
   )
   .addSubcommand(subcommand =>
    subcommand.setName('remove')
    .setDescription("Bir üyenin XP'sini düşür")
    .addUserOption(option => 
        option.setName('hedef')
       .setDescription('XP düşürülecek üyeyi seç')
       .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
       .setDescription('XP miktarını seç')
       .setMinValue(0)
       .setRequired(true)
    )
   )
   .addSubcommand(subcommand =>
    subcommand.setName('set')
    .setDescription("Bir üyenin XP'sini ayarla")
    .addUserOption(option => 
        option.setName('hedef')
       .setDescription('XP düşürülecek üyeyi seç')
       .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
       .setDescription('XP miktarını seç')
       .setMinValue(0)
       .setRequired(true)
    )
   ),

   async execute(interaction)
   {
    try {
        // Fetch server settings to get the allowed game channel ID
        const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
        const allowedChannelId = serverSettings?.levels_channel;

        if (!allowedChannelId) {
            return interaction.reply({ content: "Levels kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
        }

        if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            return interaction.reply({ 
                content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Level"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                ephemeral: true 
            });
        }

    const {options,guildId} = interaction;

    const sub = options.getSubcommand();
    const target = options.getUser('hedef');
    const amount = options.getInteger('amount');
    const embed = new EmbedBuilder();

    try{
        switch(sub)
        {
            case 'add':
                await Levels.appendXp(target.id, guildId, amount);
                embed.setDescription(`${target} adlı üyeye ${amount} XP eklendi!`).setColor('Green').setTimestamp();
                break;
            case'remove':
                await Levels.subtractXp(target.id, guildId, amount);
                embed.setDescription(`${target} adlı üyeden ${amount} XP düşürüldü!`).setColor('Red').setTimestamp();;
                break;
            case'set':
                await Levels.setXp(target.id, guildId, amount);
                embed.setDescription(`${target} adlı üyenin XP'si ${amount} olarak ayarlandı!`).setColor('Yellow').setTimestamp();
                break;
        }
    }
    catch(err)
    {
        console.log(err);
    }

    interaction.reply({embeds: [embed], ephemeral: true});
} catch (error) {
    console.error('xp komutu sırasında bir hata oluştu:', error);
    await interaction.reply({
        content: 'xp komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        ephemeral: true
    });
}
   }
}