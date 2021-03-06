const mongoose = require('mongoose')

const appClientSchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['client', 'robot', 'operator'],
        required: true
    },
    createdAt: { 
        type: Date, 
        expires: 43200, 
        default: Date.now 
    },
    updatedAt:{
        type: Date, 
        expires: 43200, 
        default: Date.now
    },
    online: {
        type: Boolean,
        default: false
    }
})

const AppClient = mongoose.model('AppClient', appClientSchema)

module.exports = AppClient