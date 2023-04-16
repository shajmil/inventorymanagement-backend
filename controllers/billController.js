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
    const totalAmountTax = totalAmount + totalTaxAmount
    const bill = new Bill({
      vendor,
      billDate,
      billNumber,
      items,
      totalAmount : totalAmountTax,
      totalTaxAmount,
      category,
      remainingAmount: totalAmountTax,
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

    const findBill = await Bill.findById(billId);
    if (!findBill) {
      return res.status(400).json({ message: 'Bill not found' });
    }
    const vendor = await Vendor.findById(findBill.vendor);

    if (findBill.dueDate < new Date()) {
      vendor.overDueAmount += findBill.totalAmount;
    }
    await vendor.save();

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
        amount: bill.totalAmount,
        remainingAmount:bill.remainingAmount
      });
      vendor.notPaidAmount += bill.totalAmount;
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
    const { amount, method, date, description } = payment;

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

    vendor.bills[billIndex].remainingAmount -= amount

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




const getAllBills = asyncHandler(async (req, res) => {
  const {
    vendor,
    categoryName,
    status,
    sortBy,
    sortOrder,
    page,
    limit
  } = req.query;

  const query = { user: req.user.id };
  if (vendor) query.vendor = vendor;
  if (categoryName) query.category = categoryName;
  if (status) query.status = status;

  const sort = {};
  if (sortBy && sortOrder) sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort
  };

  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      res.status(401)
      throw new Error('User not found')
    }

    const bills = await Bill.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(sort)
      .populate('vendor')
      .populate('category');

    const count = await Bill.countDocuments(query);
    const maxPage = Math.ceil(count / options.limit);
    res.status(200).json({ bills, count, maxPage, isLastPage: options.page * options.limit >= count });

  } catch (error) {
    res.status(400)
    throw new Error(error)
  }
});

const editBill = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(400).json({ message: 'Bill not found' });
    }

    const {
      vendorId,
      billDate,
      billNumber,
      items,
      categoryId,
    } = req.body;

    // Update vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(400).json({ message: "Vendor not found" });
    }
    const oldVendorId = bill.vendor._id
    if (vendorId !== oldVendorId) {
      console.log(`Vendor changed from ${oldVendorId} to ${vendorId}`);

      const oldVendor = await Vendor.findById(oldVendorId);
      if (oldVendor) {
        const oldBillIndex = oldVendor.bills.findIndex((b) => b.billId == billId);
        console.log('oldBillIndex: ', oldBillIndex);
        if (oldBillIndex !== -1) {
          oldVendor.bills.splice(oldBillIndex, 1);
          // await oldVendor.save();
          console.log(`Removed bill ${billId} from old vendor ${oldVendorId}`);
        }
      }
    }
    bill.vendor = vendor;

    // Store the original product quantities in a map

    const oldItemList = bill.items



    // Update the bill with the new data
    bill.billDate = billDate;
    bill.billNumber = billNumber;
    bill.items = items;

    bill.category = categoryId;

    const totalAmount = items.reduce((total, item) => total + item.total, 0);
    const totalTaxAmount = items.reduce((taxAmount, item) => taxAmount + item.taxAmount, 0);
    bill.totalAmount = totalAmount;
    bill.totalTaxAmount = totalTaxAmount;
    bill.remainingAmount = totalAmount - bill.paidAmount;

    if (bill.status !== 'Draft') {
      const oldItemsMap = new Map(oldItemList.map(item => [item.product.toString(), item.quantity]));
      const updatedItemsMap = new Map(items.map(item => [item.product.toString(), item.quantity]));

      const diff = [];

      // Find the difference in quantity for each product
      for (const [productId, updatedQty] of updatedItemsMap) {
        const oldQty = oldItemsMap.get(productId);
        if (oldQty && oldQty !== updatedQty) {
          diff.push({ product: productId, oldQty, newQty: updatedQty });
        }
      }



      for (const { product, oldQty, newQty } of diff) {
        const productToUpdate = await Product.findById(product);
        if (!productToUpdate) {

          continue;
        }

        const diffQty = newQty - oldQty;
        if (diffQty > 0) {
          productToUpdate.quantity += diffQty;
          await productToUpdate.save();

        } else if (diffQty < 0) {
          const newProductQty = productToUpdate.quantity + diffQty;
          if (newProductQty < 0) {

            continue;
          }

          productToUpdate.quantity = newProductQty;
          // await productToUpdate.save();

        }
      }
    }


    // const billIndex = vendor.bills.findIndex((bill) => bill.billId === billId);
    // if (billIndex !== -1) {
    //   vendor.bills[billIndex] = {
    //     billDate,
    //     billNumber,
    //     dueDate: bill.dueDate,
    //     status: bill.status,
    //     billId,
    //     amount: totalAmount,
    //   };
    // }
    // await vendor.save();

    // if (bill.status !== 'Draft') {
    //   // If the bill status is not Draft, adjust the product quantities accordingly
    //   for (const item of bill.items) {
    //     const product = await Product.findById(item.product);
    //     if (!product) {
    //       return res.status(400).json({ message: `Product not found for item with product ID ${item.product}` });
    //     }
    //     const originalQuantity = originalQuantities.get(item.product.toString());
    //     const newQuantity = originalQuantity + item.quantity;
    //     const quantityDifference = newQuantity - product.quantity;
    //     product.quantity = newQuantity >= 0 ? newQuantity : 0;
    //     await product.save();
    //     if (quantityDifference !== 0) {
    //       await Product.findByIdAndUpdate(item.product, { $inc: { quantity: quantityDifference } });
    //     }
    //   }
    // }

    // await bill.save();

    res.status(200).json({ message: "Bill updated successfully", bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating bill" });
  }
};





module.exports = {
  createBill,
  updateBill,
  markBillAsReceived,
  addPayment,
  getBillById,
  getAllBills,
  editBill
}