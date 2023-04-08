const asyncHandler = require('express-async-handler')

const Account = require('../models/accountModel')
const User = require('../models/userModel')

const createAccount = asyncHandler(async (req, res) => {
    try {
        const { name, accountNumber, balance, bankName, bankPhone, bankAddress } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const newAccount = new Account({
            user: req.user.id,
            name,
            accountNumber,
            balance,
            bankName,
            bankPhone,
            bankAddress,
        });
        await newAccount.save();

        res.status(201).json({ account: newAccount });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const getTransactionsDetail = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
      const accounts = await Account.find({ user: req.user.id }).populate('transactions');
      const transactions = accounts.reduce((acc, account) => acc.concat(account.transactions), []);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };


module.exports = {
    createAccount,
    getTransactionsDetail
    
}