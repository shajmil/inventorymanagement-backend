const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true, unique: true },
    SKU: { type: String, required: true, unique: true },
    description: { type: String },
    salePrice: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    categoryName: {
        type:String,
        required: true,
    },

    
},
{
    timestamps: true,
})


module.exports = mongoose.model('Product', productSchema)