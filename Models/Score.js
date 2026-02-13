// models/Score.js
const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    userId: String,
    username: String,
    score: Number,
});

module.exports = mongoose.model('Score', scoreSchema);
