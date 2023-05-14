const mongoose = require('mongoose')

const customerSchema = mongoose.Schema({
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
    invoices: [
        {
            invoiceDate: { type: Date },
            invoiceNumber: { type: String },
            dueDate: { type: Date },
            status: {
                type: String,
            },
            invoiceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Invoice'
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

module.exports = mongoose.model('Customer', customerSchema)