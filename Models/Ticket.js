const {model, Schema} = require('mongoose');

let ticketSchema = new Schema({
    GuildID: String,
    MembersID: [String],
    ChannelID: String,
    TicketID: String,
    Closed: Boolean,
    Locked: Boolean,
    Type: String,
    Claimed: Boolean,
    ClaimedBy: String
});

module.exports = model('Ticket', ticketSchema);