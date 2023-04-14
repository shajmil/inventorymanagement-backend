const express = require('express')

const router = express.Router()
const { createBill,
    updateBill,
    markBillAsReceived,getBillById,
    addPayment,updateBillByID, getAllBills } = require('../controllers/billController')

const { protect } = require('../middleware/authMiddleware')

router.post('/',protect, createBill);
router.put('/:billId',protect, updateBill);
router.put('/:billId/received',protect, markBillAsReceived);
router.put('/:billId/payment',protect, addPayment);
router.get('/:id', protect, getBillById);
router.put('/update/:billId',protect, updateBillByID);
router.get('/', protect, getAllBills);

module.exports = router