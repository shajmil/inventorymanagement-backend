const asyncHandler = require('express-async-handler')

const InvoiceCategory = require('../models/invoiceCategoryModel')
const Customer = require('../models/customersModel')
const Product = require('../models/productModel')
const User = require('../models/userModel')
const Invoice = require('../models/invoiceModel')
const Account = require('../models/accountModel')

const createInvoice = async (req, res) => {
    try {
        const {
            customerId,
            invoiceDate,
            invoiceNumber,
            items,
            categoryId,
        } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(400).json({ message: "Customer not found" });
        }

        const category = await InvoiceCategory.findById(categoryId);
        if (!category) {
            return res.status(400).json({ message: "Category not found" });
        }

        const totalAmount = items.reduce((total, item) => total + item.total, 0);
        const totalTaxAmount = items.reduce((taxAmount, item) => taxAmount + item.taxAmount, 0);
        const totalAmountTax = totalAmount + totalTaxAmount
        const invoice = new Invoice({
            customer,
            invoiceDate,
            invoiceNumber,
            items,
            totalAmount: totalAmountTax,
            totalTaxAmount,
            category,
            remainingAmount: totalAmountTax,
            paidAmount: 0,
            user: req.user.id,
        });

        await invoice.save();

        res.status(201).json({ message: "Invoice created successfully", invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating Invoice" });
    }
};

// Update an existing invoice and add due date
const updateInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { dueDate } = req.body;





        const invoice = await Invoice.findByIdAndUpdate(invoiceId, { dueDate }, { new: true });
        if (!invoice) {
            return res.status(400).json({ message: 'Invoice not found' });
        }

        const findInvoice = await Invoice.findById(invoiceId);
        if (!findInvoice) {
            return res.status(400).json({ message: 'Invoice not found' });
        }
        const customer = await Customer.findById(findInvoice.customer);

        if (findInvoice.dueDate < new Date()) {
            customer.overDueAmount += findInvoice.totalAmount;
        }
        await customer.save();

        res.json({ message: 'Invoice updated successfully', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating invoice' });
    }
};


// Mark invoice as received and update product quantity
const markInvoiceAsReceived = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(400).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'Received') {
            invoice.status = 'Received';
            invoice.receivedDate = new Date();
            await invoice.save();

            // Update customer invoices array
            const customer = await Customer.findById(invoice.customer);;
            customer.invoices.push({
                invoiceDate: invoice.invoiceDate,
                invoiceNumber: invoice.invoiceNumber,
                dueDate: invoice.dueDate,
                status: 'Received',
                invoiceId: invoice._id,
                amount: invoice.totalAmount,
                remainingAmount: invoice.remainingAmount
            });
            customer.notPaidAmount += invoice.totalAmount;
            await customer.save();

            for (const item of invoice.items) {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.status(400).json({ message: `Product not found for item with product ID ${item.product}` });
                }

                product.quantity -= item.quantity;
                await product.save();
            }
        }

        res.json({ message: 'Invoice marked as received successfully', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error marking Invoice as received' });
    }
};

// Add payment for a invoice
const addPayment = async (req, res) => {
    try {
        const { invoiceId, payment, account } = req.body;
        const { amount, method, date, description } = payment;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(400).json({ message: 'Invoice not found' });
        }

        if (amount > invoice.remainingAmount) {
            return res.status(400).json({ message: 'Payment amount cannot be greater than remaining amount' });
        }

        const accountDoc = await Account.findById(account);
        if (!accountDoc) {
            return res.status(400).json({ message: 'Account not found' });
        }

        const transaction = {
            account: account,
            date: date,
            type: 'Income',
            invoiceCategory: invoice.category,
            amount: amount,
            customer: invoice.customer,
            invoice: invoice._id,
            user: req.user.id,
        };
        accountDoc.transactions.push(transaction);
        accountDoc.balance += amount;
        accountDoc.credit += amount;
        await accountDoc.save();

        invoice.payments.push({ amount, method, date, description });
        invoice.remainingAmount -= amount;
        invoice.paidAmount += amount;

        if (invoice.remainingAmount === 0) {
            invoice.status = 'Paid';
        } else {
            invoice.status = 'Partial';
        }

        await invoice.save();

        const customer = await Customer.findOne({ 'invoices.invoiceId': invoiceId });
        if (!customer) {
            return res.status(400).json({ message: 'Customer not found' });
        }

        const invoiceIndex = customer.invoices.findIndex(b => b.invoiceId.toString() === invoiceId);
        console.log('invoiceIndex: ', invoiceIndex);
        if (invoiceIndex < 0) {
            return res.status(400).json({ message: 'Invoice not found in Customer' });
        }

        customer.invoices[invoiceIndex].remainingAmount -= amount

        if (invoice.remainingAmount === 0) {
            customer.invoices[invoiceIndex].status = 'Paid';
        } else {
            customer.invoices[invoiceIndex].status = 'Partial';
        }

        customer.paidAmount += amount;
        customer.notPaidAmount -= amount;
        if (invoice.dueDate < new Date()) {
            customer.overDueAmount -= amount;
        }


        await customer.save();

        res.json({ message: 'Payment added successfully', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding payment' });
    }
};

const getInvoiceById = async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const userId = req.user.id;
        const invoice = await Invoice.findOne({ _id: invoiceId, user: userId })
            .populate("customer", "name email taxNumber phone website address")
            .populate("category", "name")
            .populate("items.product", "name");

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json({ invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting Invoice" });
    }
};

const getTotalIncomeAmount = async (req, res) => {
    try {
        console.log('hello');
        const userId = req.user.id;
        const invoices = await Invoice.find({ user: userId });
        let totalAmount = 0;
        invoices.forEach((invoice) => {
            totalAmount += invoice.totalAmount;
        });
        res.json({ totalAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting total amount" });
    }
};

const searchInvoice = asyncHandler(async (req, res) => {
    const {
        search,
        page,
        limit
    } = req.query;

    const query = { user: req.user.id };
    if (search) query["$or"] = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
    ];

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
    };

    try {
        const invoices = await Invoice.find(query)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .populate('customer')
            .populate('category');

        const count = await Invoice.countDocuments(query);
        const maxPage = Math.ceil(count / options.limit);
        const startCount = (options.page - 1) * options.limit + 1;
        const endCount = Math.min(options.page * options.limit, count);
        const message = `Showing ${startCount} to ${endCount} of ${count} Entries`;
        res.status(200).json({ invoices, count, maxPage, isLastPage: options.page * options.limit >= count, message });
    } catch (error) {
        res.status(400);
        throw new Error(error);
    }
});

const getAllInvoices = asyncHandler(async (req, res) => {
    const {
        customer,
        categoryName,
        status,
        sortBy,
        sortOrder,
        page,
        limit
    } = req.query;

    const query = { user: req.user.id };
    if (customer) query.customer = customer;
    if (categoryName) query.category = categoryName;
    if (status) query.status = status;

    const sort = {};
    if (sortBy && sortOrder) {
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
        sort.invoiceDate = -1; // sort by category ID in ascending order
    }
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

        const invoices = await Invoice.find(query)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .sort(sort)
            .populate('customer')
            .populate('category');

        const count = await Invoice.countDocuments(query);
        const maxPage = Math.ceil(count / options.limit);
        const startCount = (options.page - 1) * options.limit + 1;
        const endCount = Math.min(options.page * options.limit, count);
        const message = `Showing ${startCount} to ${endCount} of ${count} Entries`;
        res.status(200).json({ invoices, count, maxPage, isLastPage: options.page * options.limit >= count, message });

    } catch (error) {
        res.status(400)
        throw new Error(error)
    }
});

const getLastInvoiceNumber = asyncHandler(async (req, res) => {
    const lastInvoice = await Invoice.findOne({ user: req.user.id })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber -_id')
      .limit(1);
  
    res.json({ lastInvoiceNumber: lastInvoice ? lastInvoice.invoiceNumber : 0 });
  });
  



const editInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(400).json({ message: 'Invoice not found' });
        }

        const {
            customerId,
            invoiceDate,
            invoiceNumber,
            items,
            categoryId,
            dueDate
        } = req.body;

        // Update customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(400).json({ message: "Customer not found" });
        }
        const oldCustomerId = invoice.customer._id
        if (customerId != oldCustomerId) {
            console.log(`customer changed from ${oldCustomerId} to ${customerId}`);

            const oldCustomer = await Customer.findById(oldCustomerId);
            if (oldCustomer) {
                const oldInvoiceIndex = oldCustomer.invoices.findIndex((b) => b.invoiceId == invoiceId);
                console.log('oldInvoiceIndex: ', oldInvoiceIndex);
                if (oldInvoiceIndex !== -1) {
                    customer.invoices.push({
                        invoiceDate: oldCustomer.invoices[oldInvoiceIndex].invoiceDate,
                        invoiceNumber: oldCustomer.invoices[oldInvoiceIndex].invoiceNumber,
                        dueDate: oldCustomer.invoices[oldInvoiceIndex].dueDate,
                        status: oldCustomer.invoices[oldInvoiceIndex].status,
                        invoiceId: oldCustomer.invoices[oldInvoiceIndex].invoiceId,
                        amount: oldCustomer.invoices[oldInvoiceIndex].totalAmount,
                        remainingAmount: oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    });
                    const amountToReduce = oldCustomer.invoices[oldInvoiceIndex].amount - oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    customer.paidAmount += amountToReduce
                    customer.notPaidAmount += oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    if (invoice.dueDate < new Date()) {
                        customer.overDueAmount += oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    }
                    await customer.save();
                    oldCustomer.paidAmount -= amountToReduce
                    oldCustomer.notPaidAmount -= oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    if (invoice.dueDate < new Date()) {
                        oldCustomer.overDueAmount -= oldCustomer.invoices[oldInvoiceIndex].remainingAmount
                    }
                    oldCustomer.invoices.splice(oldInvoiceIndex, 1);
                    await oldCustomer.save();
                    console.log(`Removed invoice ${invoiceId} from old customer ${oldCustomerId}`);
                }
            }
        }

        invoice.customer = customer;

        // Store the original product quantities in a map

        const oldItemList = invoice.items



        // Update the invoice with the new data
        invoice.invoiceDate = invoiceDate;
        invoice.invoiceNumber = invoiceNumber;
        invoice.items = items;

        invoice.category = categoryId;
        if (invoice.dueDate) {
            invoice.dueDate = dueDate;
        }
        const totalAmount = items.reduce((total, item) => total + item.total, 0);
        const totalTaxAmount = items.reduce((taxAmount, item) => taxAmount + item.taxAmount, 0);
        const totalAmountTax = totalAmount + totalTaxAmount
        invoice.totalAmount = totalAmountTax;
        invoice.totalTaxAmount = totalTaxAmount;
        console.log('invoice.paidAmount: ', invoice.paidAmount);

        const remaingNewAmount = totalAmountTax - invoice.paidAmount;
        invoice.remainingAmount = remaingNewAmount

        if (invoice.status == 'Paid') {
            if (remaingNewAmount === 0) {
                invoice.status = 'Paid';
            }
            else {
                invoice.status = 'Partial';
            }
        }

        await invoice.save();

        console.log('customer: ', customer);

        const newInvoiceIndex = customer.invoices.findIndex((b) => b.invoiceId == invoiceId);
        console.log('newInvoiceIndex: ', newInvoiceIndex);
        if (newInvoiceIndex !== -1) {
            if (customer.invoices[newInvoiceIndex].amount > totalAmountTax) {
                const changeAmount = customer.invoices[newInvoiceIndex].amount - totalAmountTax
                customer.notPaidAmount -= changeAmount
                if (invoice.dueDate < new Date()) {
                    customer.overDueAmount -= changeAmount
                }
            }
            else if (customer.invoices[newInvoiceIndex].amount < totalAmountTax) {
                const changeAmount = totalAmountTax - customer.invoices[newInvoiceIndex].amount
                customer.notPaidAmount += changeAmount
                if (invoice.dueDate < new Date()) {
                    customer.overDueAmount += changeAmount
                }
            }
            customer.invoices[newInvoiceIndex].amount = totalAmountTax
            customer.invoices[newInvoiceIndex].remainingAmount = remaingNewAmount
        }

        await customer.save();


        if (invoice.status !== 'Draft') {
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
                    productToUpdate.quantity -= diffQty;
                    await productToUpdate.save();

                } else if (diffQty < 0) {
                    const newProductQty = productToUpdate.quantity - diffQty;
                    if (newProductQty < 0) {

                        continue;
                    }

                    productToUpdate.quantity = newProductQty;
                    await productToUpdate.save();

                }
            }
        }

        res.status(200).json({ message: "Invoice updated successfully", invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating Invoice" });
    }
};




module.exports = {
    createInvoice,
    updateInvoice,
    markInvoiceAsReceived,
    addPayment,
    getInvoiceById,
    getTotalIncomeAmount,
    searchInvoice,
    getAllInvoices,
    getLastInvoiceNumber,
    editInvoice
}