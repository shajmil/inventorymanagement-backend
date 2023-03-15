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
    }
}, {
    timestamps: true,
})

module.exports = mongoose.model('Vendor', vendorSchema)