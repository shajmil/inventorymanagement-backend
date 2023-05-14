const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Account'
    },
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BillCategory'
    },
    invoiceCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvoiceCategory'
    },
    amount: {
        type: Number,
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill'
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }
});

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    bankName: {
        type: String,
    },
    credit: { type: Number, default: 0 },
    debit: { type: Number, default: 0 },
    bankPhone: {
        type: String,
    },
    bankAddress: {
        type: String,
    },
    isEnable: {
        type: Boolean,
        default: true
    },
    transactions: {
        type: [transactionSchema],
        default: [],
        index: {
            unique: false,
            sparse: true,
            partialFilterExpression: {
                'transactions.user': { $exists: true }
            }
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);