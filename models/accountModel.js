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
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
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