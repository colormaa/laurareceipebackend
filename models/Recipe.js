const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let recipe = new Schema({
    title: {
        type: String, 
        required: true
    },
    preinstruction: [], 
    ingredients: [
        {for : String, 
        description: [{
            type: String
        }]
        }
    ]
    ,
    cooktime: {
        type: String, 
        default : ''
    },
    preparation: {
        type: String, 
        default: ''
    },
    image:{
        type: String, 
        default: ''
    }, 
    serves:{
        type: String, 
        default: ''
    }, 
    seen:{
        type: Number,
        default: 0 
    },
    link: {
        type: String, 
        required: true
    },
    category: [{
        type: Schema.ObjectId,
        ref: 'categories'
    }], 
    youtube: {
        type: String, 
        default: ''
    },
    episode: {
        type: String, 
        default: ''
    }, 
    status: {
        type: Boolean, 
        default: true
    }, 
    comments: [
        {
            user:{
                    type: Schema.ObjectId, 
                    ref: 'users'
                }, 
            text: String
        }
    ]
});
recipe.index({'$**': 'text'});
module.exports = mongoose.model('recipes', recipe)