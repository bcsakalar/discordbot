const { Schema, model } = require('mongoose');

const welcomeSchema = new Schema({
    Guild: String,
    Channel: String,
    Role: String,
    Msg: String,
});

module.exports = model('Welcome', welcomeSchema);