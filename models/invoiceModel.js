const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    invoiceDate: {
        type: Date,
        required: true
    },
    invoiceNumber: {
        type: Number,
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            taxPercentage: {
                type: Number,
                required: true
            },
            total: {
                type: Number,
                required: true
            },
            taxAmount: {
                type: Number,
                required: true
            },
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    totalTaxAmount : {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'InvoiceCategory'
    },
    status: {
        type: String,
        enum: ['Draft', 'Received', 'Partial', 'Paid'],
        required: true,
        default: 'Draft'
    },
    dueDate: {
        type: Date
    },
    receivedDate:{
        type: Date
    },
    payments: [
        {
            date: {
                type: Date,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            method: {
                type: String,
                enum: ['Cash', 'Bank Transfer'],
                required: true
            },
            description: {
                type: String
            }
        }
    ],
    remainingAmount: {
        type: Number
    },
    paidAmount: {
        type: Number
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Invoice', invoiceSchema);
