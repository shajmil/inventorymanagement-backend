const express = require('express')

const router = express.Router()
const {createBillCategory,getBillCategory} = require('../controllers/billCategoryController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createBillCategory)
router.get('/all',protect, getBillCategory)


module.exports = router