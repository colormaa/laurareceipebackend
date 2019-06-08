var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true
    }, 
    password: {
        type: String, 
        required: true
    }, 
    role: {
        type: String, 
        default: 'user'
    }, 
    createdDate: {
        type: Date, 
        default: Date.now
    }, 
    email: {
        type: String, 
        required: true
    }
});
module.exports = mongoose.model('users', UserSchema);