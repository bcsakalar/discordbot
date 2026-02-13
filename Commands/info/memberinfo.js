const {SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ChatInputCommandInteraction} = require('discord.js');
const {profileImage} = require('discord-arts');
const ServerSettings = require('../../Models/ServerSettings');

module.exports = 
{
    data: new SlashCommandBuilder()
   .setName('üyebilgisi')
   .setDescription('Üyenin sunucundaki bilgilerini göster')
   .setDMPermission(false)
   .addUserOption(option => 
        option.setName('üye')
       .setDescription('Bilgileri Getirilecek Üye')
       .setRequired(true)
    ),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction)
    {
        try {

        await interaction.deferReply();
        const {options} = interaction;
        const memberOption = options.getMember('üye');
        const member = memberOption || interaction.member;
        
            try{
                const fetchedMembers = await interaction.guild.members.fetch();

                const profileBuffer = await profileImage(member.id);
                const imageAttachment = new AttachmentBuilder(profileBuffer, {name: 'profile.png'});

                const joinPosition = Array.from(fetchedMembers
                    .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
                    .keys())
                    .indexOf(member.id) + 1;

                    const topRoles = member.roles.cache
                    .sort((a, b) => b.position - a.position)
                    .map(role => role)
                    .slice(0, 3);

                    const userBadges = member.user.flags.toArray();

                    const joinTime = parseInt(member.joinedTimestamp / 1000);
                    const createdTime = parseInt(member.user.createdTimestamp / 1000);

                    const avatarButton = new ButtonBuilder()
                    .setLabel('Avatar')
                    .setStyle(5)
                    .setURL(member.displayAvatarURL());

                    const bannerButton = new ButtonBuilder()
                    .setLabel('Banner')
                    .setStyle(5)
                    .setURL((await member.user.fetch()).bannerURL() || 'https://example.com/default-banner.jpg');

                    const row = new ActionRowBuilder()
                    .addComponents(avatarButton, bannerButton);

                    const embed = new EmbedBuilder()
                    .setAuthor({name: `${member.user.tag} | Genel Bilgiler`, iconURL: member.displayAvatarURL()})
                    .setColor('Aqua')
                    .setDescription(`<t:${joinTime}:D> tarihinde, ${member.user.tag} **${addSuffix(joinPosition)}** üye olarak bu sunucuya katılmıştır`)
                    .setImage('attachment://profile.png')
                    .addFields([
                        {name: "Roller", value: `${topRoles.join("").replace(`<@${interaction.guildId}>`)}`, inline: false},
                        {name: "Hesap Kurulum Tarihi", value: `<t:${createdTime}:R>`, inline: true},
                        {name: "Sunucuya Katılma Tarihi", value: `<t:${joinTime}:R>`, inline: true},
                    ]);

                    interaction.editReply({embeds: [embed], components: [row], files: [imageAttachment]});
            }
            catch(err)
            {
                interaction.editReply(err);
            }
        } catch (error) {
            console.error('memberinfo komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'memberinfo komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    }
};

function addSuffix(number)
{
    if(number % 100 >= 11 && number % 100 <= 13)
        return number + "th";

    switch(number % 10)
    {
        case 1: return number + "st";
        case 2: return number + "nd";
        case 3: return number + "rd";
    }
    return number + "th";
}