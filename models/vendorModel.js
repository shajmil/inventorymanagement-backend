const mongoose = require('mongoose')

const vendorSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    taxNumber: {
        type: String,
        trim: true
    },
    phone: {
        type: Number,
    },
    website: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    bills: [
        {
            billDate: { type: Date },
            billNumber: { type: String },
            dueDate: { type: Date },
            status: {
                type: String,
            },
            billId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Bill'
            },

            amount: { type: Number },
            remainingAmount: { type: Number },
        },
    ],
    paidAmount: { type: Number, default: 0 },
    notPaidAmount: { type: Number, default: 0 },
    overDueAmount: { type: Number, default: 0 },
}, {
    timestamps: true,
})

module.exports = mongoose.model('Vendor', vendorSchema)