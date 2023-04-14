const express = require('express')

const router = express.Router()
const { createAccount,getTransactionsDetail,getAllAccounts } = require('../controllers/accountController')

const { protect } = require('../middleware/authMiddleware')

router.post('/add',protect, createAccount);
router.get('/allTrans',protect, getTransactionsDetail);
router.get('/all',protect, getAllAccounts);


module.exports = router