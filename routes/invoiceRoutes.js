const express = require('express')

const router = express.Router()
const { createInvoice, updateInvoice,markInvoiceAsReceived,getInvoiceById, addPayment,getTotalIncomeAmount, searchInvoice,getAllInvoices,editInvoice
} = require('../controllers/invoiceController')

const { protect } = require('../middleware/authMiddleware')

router.post('/',protect, createInvoice);
router.put('/:invoiceId',protect, updateInvoice);
router.put('/:invoiceId/received',protect, markInvoiceAsReceived);
router.put('/:invoiceId/payment',protect, addPayment);
router.get('/total', protect, getTotalIncomeAmount);
router.get('/search', protect, searchInvoice);
router.get('/:id', protect, getInvoiceById);
router.get('/', protect, getAllInvoices);
router.put('/edit/:invoiceId', protect, editInvoice);


module.exports = router