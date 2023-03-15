const express = require('express')

const router = express.Router()
const { createBill,
    updateBill,
    markBillAsReceived,
    addPayment } = require('../controllers/billController')

const { protect } = require('../middleware/authMiddleware')

router.post('/', createBill);
router.put('/:billId', updateBill);
router.put('/:billId/received', markBillAsReceived);
router.put('/:billId/payment', addPayment);

module.exports = router