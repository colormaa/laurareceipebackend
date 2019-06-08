const mongoose = require('mongoose');
var maincatSchema = new mongoose.Schema({
   name: {
        type: String, 
        required: true
    }, 
    categories: [
        {
            type: mongoose.Schema.ObjectId, 
            ref: 'categories'
        }
    ], 
    date: {
        type: Date, 
        default: Date.now()
    },
    user: {
        type: mongoose.Schema.ObjectId, 
        ref: 'users'
    }
    
    
});
module.exports = mongoose.model('maincats', maincatSchema);