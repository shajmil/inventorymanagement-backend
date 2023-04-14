const mongoose = require('mongoose');

const billSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vendor'
    },
    billDate: {
        type: Date,
        required: true
    },
    billNumber: {
        type: String,
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
        ref: 'BillCategory'
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


module.exports = mongoose.model('Bill', billSchema);
