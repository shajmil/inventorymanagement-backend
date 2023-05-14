const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const InvoiceCategory = require('../models/invoiceCategoryModel')

// access contact
const getInvoiceCategory = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const invoiceCategories = await InvoiceCategory.find({ user: req.user.id });

        res.status(200).json(invoiceCategories);
    } catch (error) {
        res.status(400);
        throw new Error(error);
    }
});

const createInvoiceCategory = asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const existingInvoiceCategory = await InvoiceCategory.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            user: req.user.id
        });

        if (existingInvoiceCategory) {
            res.status(400).json({ message: 'A category with this name already exists for this user' });
            return;
        }

        const newInvoiceCategory = new InvoiceCategory({
            name,
            user: req.user.id
        });
        await newInvoiceCategory.save();

        res.status(201).json({ invoiceCategory: newInvoiceCategory });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



module.exports = {
    getInvoiceCategory,
    createInvoiceCategory
}