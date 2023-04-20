const express = require('express')

const router = express.Router()
const{createCategory,getCategory,updateCategory,listCategoriesWithProducts,getCategorybyID} = require('../controllers/categoryController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createCategory)
router.get('/all',protect, getCategory)
router.put('/update/:id',protect, updateCategory)
router.get('/view',protect, listCategoriesWithProducts)
router.get('/:id',protect, getCategorybyID)



module.exports = router