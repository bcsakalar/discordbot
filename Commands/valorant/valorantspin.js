const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

const agents = [
    'Jett', 'Phoenix', 'Sage', 'Omen', 'Raze', 
    'Breach', 'Brimstone', 'Viper', 'Sova', 'Cypher',
    'Reyna', 'Killjoy', 'Skye', 'Yoru', 'Astra',
    'KAY/O', 'Chamber', 'Neon', 'Fade', 'Harbor', 
    'Gekko', 'Deadlock', 'Clove', 'Iso', 'Vysse'
];

const specialUserAgents = [
    'Brimstone', 'Clove', 'Cypher', 'Fade', 'Jett', 
    'KAY/O', 'Neon', 'Omen', 'Phoenix', 'Raze', 
    'Reyna', 'Sage', 'Skye', 'Sova', 'Yoru'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valospin')
        .setDescription('Ses kanalındaki kullanıcılar arasında bir ajan seçmek için çark çevirir'),
    async execute(interaction) {
        try {
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

            const channel = interaction.member.voice.channel;
            if (!channel) {
                return interaction.reply({ content: 'Bu komutu kullanmak için bir ses kanalında olmalısınız.', ephemeral: true });
            }

            let members = channel.members.filter(member => !member.user.bot).map(member => member.user);

            if (members.length === 0) {
                return interaction.reply({ content: 'Ses kanalında hiç kullanıcı yok.', ephemeral: true });
            }

            const availableAgents = [...agents];
            const chosenMembers = [];

            const specialUserId = '937314470856917022';
            const specialUser = members.find(member => member.id === specialUserId);
            if (specialUser) {
                const specialAgentIndex = Math.floor(Math.random() * specialUserAgents.length);
                const specialAgent = specialUserAgents[specialAgentIndex];
                
                chosenMembers.push({ user: specialUser.username, agent: specialAgent });
                
                members = members.filter(member => member.id !== specialUserId);
                availableAgents.splice(availableAgents.indexOf(specialAgent), 1);
            }

            while (members.length > 0 && availableAgents.length > 0) {
                const randomMemberIndex = Math.floor(Math.random() * members.length);
                const selectedUser = members[randomMemberIndex];

                const randomAgentIndex = Math.floor(Math.random() * availableAgents.length);
                const selectedAgent = availableAgents[randomAgentIndex];

                chosenMembers.push({ user: selectedUser.username, agent: selectedAgent });

                members.splice(randomMemberIndex, 1);
                availableAgents.splice(randomAgentIndex, 1);
            }

            if (chosenMembers.length > 0) {
                let resultMessage = "Çark çevrildi! Seçimler:\n";
                chosenMembers.forEach(({ user, agent }) => {
                    resultMessage += `**${user}** - **${agent}**\n`;
                });
                return interaction.reply(resultMessage);
            } else {
                return interaction.reply('Yeterli kullanıcı veya ajan kalmadı.');
            }
        } catch (error) {
            console.error('valospin komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'valospin komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    },
};