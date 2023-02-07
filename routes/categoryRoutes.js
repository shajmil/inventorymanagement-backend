const express = require('express')

const router = express.Router()
const{createCategory,getCategory} = require('../controllers/categoryController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createCategory)
router.get('/all',protect, getCategory)


module.exports = router