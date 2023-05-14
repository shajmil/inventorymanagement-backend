const express = require('express')

const router = express.Router()
const{createCustomer,getCustomers} = require('../controllers/customersController')


const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createCustomer)
router.get('/all',protect, getCustomers)


module.exports = router