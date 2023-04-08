const asyncHandler = require('express-async-handler')

const BillCategory = require('../models/billCategoryModel')
const Vendor = require('../models/vendorModel')
const Product = require('../models/productModel')
const User = require('../models/userModel')
const Bill = require('../models/billModel')
const Account = require('../models/accountModel')

const createBill = async (req, res) => {
  try {
    const {
      vendorId,
      billDate,
      billNumber,
      items,
      categoryId,
    } = req.body;
    const user = await User.findById(req.user.id)
    if (!user) {
      res.status(401)
      throw new Error('User not found')
    }
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(400).json({ message: "Vendor not found" });
    }

    const category = await BillCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    const totalAmount = items.reduce((total, item) => total + item.total, 0);
    const totalTaxAmount = items.reduce((taxAmount, item) => taxAmount + item.taxAmount, 0);
    const bill = new Bill({
      vendor,
      billDate,
      billNumber,
      items,
      totalAmount,
      totalTaxAmount,
      category,
      remainingAmount: totalAmount,
      paidAmount: 0,
      user: req.user.id,
    });

    await bill.save();

    res.status(201).json({ message: "Bill created successfully", bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating bill" });
  }
};


// Update an existing bill and add due date
const updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { dueDate } = req.body;

    const bill = await Bill.findByIdAndUpdate(billId, { dueDate }, { new: true });
    if (!bill) {
      return res.status(400).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill updated successfully', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating bill' });
  }
};

// Mark bill as received and update product quantity
// Mark bill as received and update product quantity
const markBillAsReceived = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(400).json({ message: 'Bill not found' });
    }

    if (bill.status !== 'Received') {
      bill.status = 'Received';
      bill.receivedDate = new Date();
      await bill.save();

      // Update vendor bills array
      const vendor = await Vendor.findById(bill.vendor);;
      vendor.bills.push({
        billDate: bill.billDate,
        billNumber: bill.billNumber,
        dueDate: bill.dueDate,
        status: 'Received',
        billId: bill._id,
        amount: bill.totalAmount
      });
      vendor.notPaidAmount += bill.totalAmount;
      if (bill.dueDate < new Date()) {
        vendor.overDueAmount += bill.totalAmount;
      }
      await vendor.save();

      for (const item of bill.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: `Product not found for item with product ID ${item.product}` });
        }

        product.quantity += item.quantity;
        await product.save();
      }
    }

    res.json({ message: 'Bill marked as received successfully', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking bill as received' });
  }
};




// Add payment for a bill
const addPayment = async (req, res) => {
  try {
    const { billId, payment, account } = req.body;
    const { amount, method = 'Cash', date, description } = payment;

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(400).json({ message: 'Bill not found' });
    }

    if (amount > bill.remainingAmount) {
      return res.status(400).json({ message: 'Payment amount cannot be greater than remaining amount' });
    }

    const accountDoc = await Account.findById(account);
    if (!accountDoc) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const transaction = {
      account: account,
      date: date,
      type: 'Expense',
      category: bill.category,
      amount: amount,
      user: req.user.id,
    };
    accountDoc.transactions.push(transaction);
    accountDoc.balance -= amount;
    await accountDoc.save();

    bill.payments.push({ amount, method, date, description });
    bill.remainingAmount -= amount;
    bill.paidAmount += amount;

    if (bill.remainingAmount === 0) {
      bill.status = 'Paid';
    } else {
      bill.status = 'Partial';
    }

    await bill.save();

    const vendor = await Vendor.findOne({ 'bills.billId': billId });
    if (!vendor) {
      return res.status(400).json({ message: 'Vendor not found' });
    }

    const billIndex = vendor.bills.findIndex(b => b.billId.toString() === billId);
    if (billIndex < 0) {
      return res.status(400).json({ message: 'Bill not found in vendor' });
    }

    if (bill.remainingAmount === 0) {
      vendor.bills[billIndex].status = 'Paid';
    } else {
      vendor.bills[billIndex].status = 'Partial';
    }

    vendor.paidAmount += amount;
    vendor.notPaidAmount -= amount;
    vendor.overDueAmount -= amount;

    await vendor.save();

    res.json({ message: 'Payment added successfully', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding payment' });
  }
};


const getBillById = async (req, res) => {
  try {
    const billId = req.params.id;
    const userId = req.user.id;
    const bill = await Bill.findOne({ _id: billId, user: userId })
      .populate("vendor", "name email taxNumber phone website address")
      .populate("category", "name")
      .populate("items.product", "name");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting bill" });
  }
};

const updateBillByID = async (req, res) => {
  try {
    const { billId } = req.params;
    const { vendorId, billDate, billNumber, items, categoryId, dueDate } = req.body;
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(400).json({ message: 'Bill not found' });
    }

    // If the vendor ID is changing, update vendor bills arrays
    if (vendorId !== bill.vendor) {
      // Remove bill details from current vendor
      const currentVendor = await Vendor.findById(bill.vendor);
      currentVendor.bills = currentVendor.bills.filter(b => b.billId !== billId);
      currentVendor.notPaidAmount -= bill.totalAmount;
      if (bill.dueDate < new Date()) {
        currentVendor.overDueAmount -= bill.totalAmount;
      }
      await currentVendor.save();

      // Add bill details to new vendor
      const newVendor = await Vendor.findById(vendorId);
      newVendor.bills.push({
        billDate: billDate,
        billNumber: billNumber,
        dueDate: dueDate,
        status: bill.status,
        billId: billId,
        amount: bill.totalAmount
      });
      newVendor.notPaidAmount += bill.totalAmount;
      if (dueDate < new Date()) {
        newVendor.overDueAmount += bill.totalAmount;
      }
      await newVendor.save();
    }

    // Update bill details
    bill.vendor = vendorId;
    bill.billDate = billDate;
    bill.billNumber = billNumber;
    bill.items = items;
    bill.category = categoryId;
    bill.dueDate = dueDate;

    // Update product quantity
    for (const item of bill.items) {
      const existingItem = items.find(i => i.product === item.product);
      if (existingItem) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: `Product not found for item with product ID ${item.product}` });
        }
        product.quantity += existingItem.quantity - item.quantity;
        await product.save();
      }
    }

    await bill.save();


    res.json({ message: 'Bill updated successfully', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating bill' });
  }
};









module.exports = {
  createBill,
  updateBill,
  markBillAsReceived,
  addPayment,
  getBillById,
  updateBillByID
}