const asyncHandler = require('express-async-handler')

const BillCategory = require('../models/billCategoryModel')
const Vendor = require('../models/vendorModel')
const Product = require('../models/productModel')
const User = require('../models/userModel')
const Bill = require('../models/billModel')

const createBill = async (req, res) => {
  try {
    const {
      vendorId,
      billDate,
      billNumber,
      items,
      categoryId,
    } = req.body;

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
      const { billId, paymentAmount } = req.body;

      const bill = await Bill.findById(billId);
      if (!bill) {
          return res.status(400).json({ message: 'Bill not found' });
      }
      console.log(bill.remainingAmount);
      if (paymentAmount > bill.remainingAmount) {
          return res.status(400).json({ message: 'Payment amount cannot be greater than remaining amount' });
      }

      bill.remainingAmount -= paymentAmount;
      bill.paidAmount += paymentAmount;
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

      vendor.paidAmount += paymentAmount;
      vendor.notPaidAmount -= paymentAmount;
      vendor.overDueAmount -= paymentAmount;

      await vendor.save();

      res.json({ message: 'Payment added successfully', bill });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding payment' });
  }
};




module.exports = {
  createBill,
  updateBill,
  markBillAsReceived,
  addPayment
}