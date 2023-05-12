const express = require('express')

const router = express.Router()
const { createBill,updateBill,markBillAsReceived,getBillById,addPayment,searchBill, getAllBills,getTotalExpenseAmount,editBill } = require('../controllers/billController')

const { protect } = require('../middleware/authMiddleware')

router.post('/',protect, createBill);
router.put('/:billId',protect, updateBill);
router.put('/:billId/received',protect, markBillAsReceived);
router.put('/:billId/payment',protect, addPayment);
router.get('/total', protect, getTotalExpenseAmount);
router.get('/search', protect, searchBill);
router.get('/:id', protect, getBillById);
router.get('/', protect, getAllBills);
router.put('/edit/:billId', protect, editBill);


module.exports = router