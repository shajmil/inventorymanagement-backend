const mongoose = require('mongoose')

const invoiceCategorySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        
    }
    
},
{
    timestamps: true,
})


module.exports = mongoose.model('InvoiceCategory', invoiceCategorySchema)