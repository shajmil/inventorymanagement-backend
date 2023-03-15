const mongoose = require('mongoose');

const billSchema = mongoose.Schema({
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
            }
        }
    ],
    totalAmount: {
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
    remainingAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);
