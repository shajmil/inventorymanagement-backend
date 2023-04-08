const express = require('express')

const router = express.Router()
const { createAccount,getTransactionsDetail } = require('../controllers/accountController')

const { protect } = require('../middleware/authMiddleware')

router.post('/add',protect, createAccount);
router.get('/allTrans',protect, getTransactionsDetail);

module.exports = router