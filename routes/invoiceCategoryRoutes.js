const express = require('express')

const router = express.Router()
const {createInvoiceCategory,getInvoiceCategory} = require('../controllers/invoiceCategoryControllers')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createInvoiceCategory)
router.get('/all',protect, getInvoiceCategory)


module.exports = router