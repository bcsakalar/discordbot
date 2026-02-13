const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    coins: { type: Number, default: 1000 },
    lastDaily: { type: Date, default: null } // Default points for each user
});

module.exports = mongoose.models.Coin || mongoose.model('Coin', userSchema);
