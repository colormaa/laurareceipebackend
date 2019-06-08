const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    }, 
    special: {
        type: Boolean, 
        default: false
    }, 
    date: {
        type: Date, 
        default: Date.now()
    }, 
    user: {
        type: mongoose.Schema.ObjectId, 
        ref: 'users'
    }
});
module.exports = mongoose.model('categories', categorySchema);