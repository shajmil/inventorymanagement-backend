const express = require('express')

const router = express.Router()
const{createProduct, getAllProduct,searchProduct, updateProduct, deleteProduct,checkProductBySKU,checkProductByName,getAllProductsWithoutPagination } = require('../controllers/productController')

const {protect} = require('../middleware/authMiddleware')

router.post('/add',protect, createProduct); 
router.get('/',protect, getAllProduct);

router.put('/:id', protect, updateProduct);
router.delete('/:SKU', protect, deleteProduct);
router.get('/search', protect, searchProduct);
router.get('/checkProductByName/:name', protect,checkProductByName );
router.get('/checkProductBySKU/:SKU', protect,checkProductBySKU );
router.get('/getAll', protect,getAllProductsWithoutPagination );

// router.delete('/:id',protect, getCategory)


module.exports = router