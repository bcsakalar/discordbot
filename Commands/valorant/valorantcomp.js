const { SlashCommandBuilder } = require('discord.js');
const ServerSettings = require('../../Models/ServerSettings');

const specialUserAgents = ['Brimstone', 'Clove', 'Cypher', 'Fade', 'Jett', 'KAY/O', 'Neon', 'Omen', 'Phoenix', 'Raze', 'Reyna', 'Skye', 'Sova', 'Yoru'];

const agentsByRole = {
    Duelist: ['Jett', 'Phoenix', 'Raze', 'Reyna', 'Yoru', 'Neon', 'Iso'],
    Controller: ['Omen', 'Brimstone', 'Viper', 'Astra', 'Clove'],
    Initiator: ['Sova', 'Skye', 'Breach', 'KAY/O', 'Fade', 'Gekko'],
    Sentinel: ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock'],
};

const mapCompositions = {
    Ascent: { Duelist: ['Jett'], Controller: ['Omen'], Initiator: ['Sova', 'Breach'], Sentinel: ['Cypher', 'Killjoy'] },
    Bind: { Duelist: ['Raze'], Controller: ['Viper'], Initiator: ['Skye', 'Sova'], Sentinel: ['Cypher', 'Killjoy', 'Vysse'] },
    Haven: { Duelist: ['Jett'], Controller: ['Omen'], Initiator: ['Sova', 'Skye'], Sentinel: ['Cypher'] },
    Icebox: { Duelist: ['Reyna', 'Jett'], Controller: ['Viper'], Initiator: ['Sova'], Sentinel: ['Killjoy', 'Chamber'] },
    Breeze: { Duelist: ['Jett'], Controller: ['Viper'], Initiator: ['Sova', 'Skye'], Sentinel: ['Chamber', 'Cypher'] },
    Fracture: { Duelist: ['Neon', 'Raze'], Controller: ['Brimstone'], Initiator: ['Fade', 'KAY/O'], Sentinel: ['Cypher'] },
    Pearl: { Duelist: ['Jett'], Controller: ['Viper'], Initiator: ['Skye', 'Fade'], Sentinel: ['Killjoy', 'Cypher'] },
    Lotus: { Duelist: ['Raze'], Controller: ['Omen'], Initiator: ['Breach', 'KAY/O'], Sentinel: ['Chamber', 'Vysse'] },
    Split: { Duelist: ['Raze', 'Jett'], Controller: ['Omen'], Initiator: ['KAY/O', 'Sova'], Sentinel: ['Cypher', 'Killjoy'] },
    Sunset: { Duelist: ['Iso', 'Raze'], Controller: ['Clove'], Initiator: ['Gekko', 'Fade'], Sentinel: ['Cypher', 'Vysse'] },
    Abyss: { Duelist: ['Jett', 'Iso'], Controller: ['Omen'], Initiator: ['Breach', 'Sova'], Sentinel: ['Cypher', 'Killjoy'] }
};

// Function to randomly select an agent with a bias towards recommended agents
function selectAgent(agentsForRole, compositionAgents) {
    const weightedAgents = [...compositionAgents, ...agentsForRole];
    return weightedAgents[Math.floor(Math.random() * weightedAgents.length)];
}

// Function to shuffle array elements
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to select the last agent based on weighted role preference
function selectLastAgent(usedRoles) {
    const roleWeights = {
        Initiator: 4, // Highest priority
        Controller: 3,
        Duelist: 2,
        Sentinel: 1 // Lowest priority
    };

    // Filter roles to those that have been assigned fewer times
    const remainingRoles = Object.keys(agentsByRole).filter(role => !usedRoles.includes(role));
    const weightedRoles = remainingRoles.flatMap(role => Array(roleWeights[role]).fill(role));

    // Randomly select a role based on the weights
    return weightedRoles[Math.floor(Math.random() * weightedRoles.length)];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valocompspin')
        .setDescription('Ses kanalındaki kullanıcılar arasında bir ajan seçmek için haritaya göre düzenlenmiş bir comp verir')
        .addStringOption(option => 
            option.setName('map')
                .setDescription('Harita adı (Ascent, Bind, Haven, Icebox, Breeze, Fracture, Pearl, Lotus, Split, Sunset, Abyss)')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Ses kanalı')
                .setRequired(false)),
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
                    content: `Bu komut bu kanalda kullanılamaz! Bu komutu **${allowedChannel ? allowedChannel.name : "Araçlar"}** kanalı olarak ayarlanan kanalda kullanınız.`, 
                    ephemeral: true 
                });
            }

            let channel = interaction.options.getChannel('channel');
            if (!channel) {
                channel = interaction.member.voice.channel;
                if (!channel) {
                    return interaction.reply({ content: 'Bu komutu kullanmak için bir ses kanalında olmalısınız.', ephemeral: true });
                }
            }

            const map = interaction.options.getString('map');
            
            if (!mapCompositions[map]) {
                return interaction.reply({ content: 'Lütfen geçerli bir harita adı girin.', ephemeral: true });
            }

            if (channel.type !== 2) { 
                return interaction.reply({ content: 'Lütfen geçerli bir ses kanalı seçin.', ephemeral: true });
            }

            let members = channel.members.filter(member => !member.user.bot);

            if (members.size === 0) {
                return interaction.reply({ content: 'Ses kanalında hiç kullanıcı yok.', ephemeral: true });
            }

            const chosenMembers = [];
            const usedAgents = new Set();
            const usedRoles = [];
            const composition = mapCompositions[map];

            // Handle the special user first
            const specialUserId = '937314470856917022';
            const specialUser = members.get(specialUserId);
            if (specialUser) {
                const availableAgents = specialUserAgents.filter(agent => !usedAgents.has(agent));

                if (availableAgents.length > 0) {
                    const agent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
                    const role = Object.keys(composition).find(role => agentsByRole[role].includes(agent));
                    
                    chosenMembers.push({ user: specialUser.user.username, agent, role });
                    usedAgents.add(agent);
                    usedRoles.push(role);
                    members.delete(specialUserId);
                }
            }

            // Shuffle roles to randomize their order
            const roles = shuffleArray(['Duelist', 'Controller', 'Initiator', 'Sentinel']);
            roles.forEach(role => {
                if (members.size > 0 && composition[role]) {
                    const agentsForRole = Array.isArray(composition[role]) ? composition[role].filter(agent => !usedAgents.has(agent)) : [];

                    if (agentsForRole.length > 0) {
                        const randomAgent = selectAgent(agentsForRole, composition[role]);
                        const randomMember = members.random();

                        chosenMembers.push({ user: randomMember.user.username, agent: randomAgent, role });
                        usedAgents.add(randomAgent);
                        usedRoles.push(role);
                        members.delete(randomMember.id);
                    }
                }
            });

            // If there are still members left, assign them based on weighted roles and available agents
            while (members.size > 0) {
                const randomMember = members.random();
                let availableRoles = roles.filter(role => !chosenMembers.some(chosen => chosen.role === role));
                
                if (members.size === 1) {
                    // Weighted selection for the last member
                    const lastRole = selectLastAgent(usedRoles);
                    let randomAgent = selectAgent(agentsByRole[lastRole], composition[lastRole] || []);
                    
                    while (usedAgents.has(randomAgent)) {
                        randomAgent = selectAgent(agentsByRole[lastRole], composition[lastRole] || []);
                    }

                    chosenMembers.push({ user: randomMember.user.username, agent: randomAgent, role: lastRole });
                    usedAgents.add(randomAgent);
                    usedRoles.push(lastRole);
                    members.delete(randomMember.id);
                    break; // Exit after assigning the last member
                }

                if (availableRoles.length === 0) {
                    availableRoles = roles;
                }

                const randomRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];
                let randomAgent = selectAgent(agentsByRole[randomRole], composition[randomRole] || []);

                while (usedAgents.has(randomAgent)) {
                    randomAgent = selectAgent(agentsByRole[randomRole], composition[randomRole] || []);
                }

                chosenMembers.push({ user: randomMember.user.username, agent: randomAgent, role: randomRole });
                usedAgents.add(randomAgent);
                usedRoles.push(randomRole);
                members.delete(randomMember.id);
            }

            if (chosenMembers.length > 0) {
                let resultMessage = `Harita: **${map}**\nÇark çevrildi! Seçimler:\n`;
                chosenMembers.forEach(({ user, agent, role }) => {
                    resultMessage += `**${user}** - **${agent}** (${role})\n`;
                });
                return interaction.reply(resultMessage);
            } else {
                return interaction.reply('Yeterli kullanıcı kalmadı.');
            }
        } catch (error) {
            console.error('valocomp komutu sırasında bir hata oluştu:', error);
            await interaction.reply({
                content: 'valocomp komutu sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                ephemeral: true
            });
        }
    },
};
