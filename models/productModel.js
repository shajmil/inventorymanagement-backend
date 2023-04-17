const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true,trim: true},
    SKU: { type: String, required: true,trim: true },
    description: { type: String,trim: true },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    enableBill: { type: Boolean, default: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    categoryName: {
        type:String,
    },

    
},
{
    timestamps: true,
})


module.exports = mongoose.model('Product', productSchema)