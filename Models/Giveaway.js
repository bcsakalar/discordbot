const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    channelId: String,
    messageId: String,
    prize: String,
    endTime: Date,
    participants: [String],
    winnerCount: String,
    ended: { type: Boolean, default: false }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
