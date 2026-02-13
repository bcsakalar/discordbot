const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const axios = require('axios');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
   .setName('emojizoom')
   .setDescription('Emojilere bakmak için kullanılır')
   .addStringOption(option => option
   .setName('emoji')
   .setDescription('Emojileri görmek istediğiniz emojinin ismini giriniz')
   .setRequired(true)),

   async execute(interaction)
   {
    try {
        // Fetch server settings to get the allowed game channel ID
        const serverSettings = await ServerSettings.findOne({ guildId: interaction.guild.id });
        const allowedChannelId = serverSettings?.tools_channel;

        if (!allowedChannelId) {
            return interaction.reply({ content: "Araçlar kanalı ayarlanmamış. Lütfen bir kanal ayarlayın.", ephemeral: true });
        }

        if (allowedChannelId !== "all_channels" && interaction.channelId !== allowedChannelId) {
            const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
            return interaction.reply({ 
                content: `**Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Araçlar"}** kanalı olarak ayarlanan kanalda kullanınız.**`, 
                ephemeral: true 
            });
        }

    const {options} = interaction;
    let emoji = options.getString('emoji')?.trim();

    if(emoji.startsWith('<') && emoji.endsWith('>'))
        {
            const id = emoji.match(/\d{15,}/g)[0];

            const type = await axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`).then(image => {
                if(image) return 'gif';
                else return 'png';
            }).catch(err => {
                return 'png';
            })
            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`;
        }

        if(!emoji.startsWith('http'))
            return await interaction.reply({content: 'Standart discord emojilerini büyütemezssin', ephemeral: true});
        if(!emoji.startsWith('https'))
            return await interaction.reply({content: 'Standart discord emojilerini büyütemezssin', ephemeral: true});

        await interaction.reply({content: emoji});
    } catch (error) {
        console.error('emojizoom komutu sırasında bir hata oluştu:', error);
        await interaction.reply({
            content: 'emojizoom komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            ephemeral: true
        });
    }
   }
}