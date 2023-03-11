const express = require('express')

const router = express.Router()
const{createProduct, getAllProduct, updateProduct, getProduct, deleteProduct,checkProductBySKU,checkProductByName} = require('../controllers/productController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createProduct)
router.get('/',protect, getAllProduct)
router.get('/:SKU',protect, getProduct)

router.put('/:id', protect, updateProduct);
router.delete('/:SKU', protect, deleteProduct);
router.get('/checkProductByName/:name', protect,checkProductByName );
router.get('/checkProductBySKU/:sku', protect,checkProductBySKU );

// router.delete('/:id',protect, getCategory)


module.exports = router