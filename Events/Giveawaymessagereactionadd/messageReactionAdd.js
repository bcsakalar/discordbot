const Giveaway = require('../../Models/Giveaway'); // Ensure this path points correctly to your giveaway model

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (reaction.emoji.name !== '🎉') return;

        const giveaway = await Giveaway.findOne({ messageId: reaction.message.id });

        if (!giveaway) return;

        if (giveaway.participants.includes(user.id)) {
            return;
        }

        giveaway.participants.push(user.id);
        await giveaway.save();

        try {
            await user.send('Çekilişe katıldınız! 🎉');
        } catch (err) {
            console.error(`Couldn't send DM to ${user.tag}.`);
        }
    }
};
