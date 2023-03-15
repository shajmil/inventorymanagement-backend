const express = require('express')

const router = express.Router()
const{createVendor,getVendors} = require('../controllers/vendorController')


const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createVendor)
router.get('/all',protect, getVendors)


module.exports = router