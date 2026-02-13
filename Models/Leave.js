const { Schema, model } = require('mongoose');

const leaveSchema = new Schema({
    Guild: String,
    Channel: String,
    Message: String
});

module.exports = model('Leave', leaveSchema);