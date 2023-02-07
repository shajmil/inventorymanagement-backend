const express = require('express')

const router = express.Router()
const{createProduct, getAllProduct, updateProduct, getProduct, deleteProduct} = require('../controllers/productController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createProduct)
router.get('/',protect, getAllProduct)
router.get('/:SKU',protect, getProduct)

router.put('/:id', protect, updateProduct);
router.delete('/:SKU', protect, deleteProduct);
// router.delete('/:id',protect, getCategory)


module.exports = router