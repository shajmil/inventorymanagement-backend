const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Customer = require('../models/customersModel')



const createCustomer = asyncHandler(async (req, res) => {
    try {
        const { name, email, taxNumber, phone, website, address,enabled } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const existingCustomer = await Customer.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            user: req.user.id
        });

        if (existingCustomer) {
            res.status(400).json({ message: 'A customer with this name already exists for this user' });
            return;
        }

        const newCustomer = new Customer({
            user: req.user.id,
            name,
            email,
            taxNumber,
            phone,
            website,
            address,
            enabled
        });
        await newCustomer.save();

        res.status(201).json({ customer: newCustomer });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const getCustomers = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const customers = await Customer.find({ user: req.user.id });

        res.status(200).json(customers);
    } catch (error) {
        res.status(400);
        throw new Error(error);
    }
});


module.exports = {
    createCustomer,
    getCustomers
    
}