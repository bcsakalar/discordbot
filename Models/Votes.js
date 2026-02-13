const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    Msg: String,
    Upvote: Number,
    Downvote: Number,
    UpMembers: [String],
    DownMembers: [String],
    Guild: String,
    Owner: String,
    EndTime: Number  // Bitiş zamanı
});

module.exports = mongoose.model('Votes', pollSchema);
