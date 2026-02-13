let {model, Schema} = require('mongoose');

let userTaskSchema = new Schema({
    UserId: String,
    Task: Array,
}, {versionKey: false});

module.exports = model('userTaskSchema', userTaskSchema, 'userTaskSchema');