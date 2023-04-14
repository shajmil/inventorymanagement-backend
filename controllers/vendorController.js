const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Vendor = require('../models/vendorModel')



const createVendor = asyncHandler(async (req, res) => {
    try {
        const { name, email, taxNumber, phone, website, address,enabled } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const existingVendor = await Vendor.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            user: req.user.id
        });

        if (existingVendor) {
            res.status(400).json({ message: 'A vendor with this name already exists for this user' });
            return;
        }

        const newVendor = new Vendor({
            user: req.user.id,
            name,
            email,
            taxNumber,
            phone,
            website,
            address,
            enabled
        });
        await newVendor.save();

        res.status(201).json({ vendor: newVendor });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const getVendors = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const vendors = await Vendor.find({ user: req.user.id });

        res.status(200).json(vendors);
    } catch (error) {
        res.status(400);
        throw new Error(error);
    }
});


module.exports = {
    createVendor,
    getVendors
    
}