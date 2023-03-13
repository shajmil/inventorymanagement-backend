const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')

const createProduct = asyncHandler(async (req, res) => {
    const { name, SKU, description, salePrice, purchasePrice, quantity, enabled, category, enableBill } = req.body;

    try {
        

        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const existingSKU = await Product.findOne({ SKU });
        if (existingSKU) {
            res.status(401)
            throw new Error('A product with this SKU already exists')
        }

        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
            res.status(401)
            throw new Error('A product with this name already exists')
        }

        const foundCategory = await Category.findOne({ name: category }).exec();
        if (!foundCategory) {
            return res.status(400).json({ message: 'Invalid category name' });
        }
        const newProduct = new Product({
            name,
            SKU,
            description,
            salePrice,
            purchasePrice,
            quantity,
            enabled,
            enableBill,
            categoryId: foundCategory._id,
            categoryName: foundCategory.name,
            user: req.user.id
        });
        await newProduct.save();

        res.json({ product: newProduct });

    } catch (error) {
        res.status(400)
        throw new Error(error)
    }
})

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const productData = req.body;
  
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }
  
      const product = await Product.findByIdAndUpdate(id, productData, {
        new: true,
        runValidators: true
      });
  
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
  
      res.status(200).json({ product });
    } catch (error) {
      res.status(400);
      throw new Error(error);
    }
  });



  const getAllProduct = asyncHandler(async (req, res) => {
    const {
        name,
        SKU,
        categoryName,
        sortBy,
        sortOrder,
        enabled,
        enableBill,
        page,
        limit
    } = req.query;

    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (SKU) query.SKU = { $regex: SKU, $options: 'i' };
    if (categoryName) query.categoryName = { $regex: categoryName, $options: 'i' };
    if (enabled) query.enabled = enabled;
    if (enableBill) query.enableBill = enableBill

    const sort = {};
    if (sortBy && sortOrder) sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        sort
    };

    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const products = await Product.find(query)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .sort(sort);

        const count = await Product.countDocuments(query);
        const maxPage = Math.ceil(count / options.limit);
        res.status(200).json({ products, count,maxPage, isLastPage: options.page * options.limit >= count });

    } catch (error) {
        res.status(400)
        throw new Error(error)
    }
});

const getProduct = asyncHandler(async (req, res) => {
    try {
        const product = await Product.findOne({ SKU: req.params.SKU });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        res.status(200).json({ product });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const product = await Product.findOneAndDelete({ SKU: req.params.SKU });

        if (!product) {
            res.status(404)
            throw new Error('Product not found')
        }

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (error) {
        res.status(400)
        throw new Error(error)
    }
});


const checkProductByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
  
    try {
      const product = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      res.status(200).json({ exists: !!product });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  const checkProductBySKU = asyncHandler(async (req, res) => {
    const { SKU } = req.params;
  
    try {
      const product = await Product.findOne({ SKU: { $regex: new RegExp(`^${SKU}$`, 'i') } });
      res.status(200).json({ exists: !!product });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  const searchProduct = asyncHandler(async (req, res) => {
    const {
      search,
      page,
      limit
    } = req.query;
  
    const query = {};
    if (search) query["$or"] = [
        { name: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } }
    ];
  
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10
    };
  
    try {
      const products = await Product.find(query)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);
  
      const count = await Product.countDocuments(query);
      const maxPage = Math.ceil(count / options.limit);
      const isLastPage = options.page * options.limit >= count;
  
      res.status(200).json({ products, count, maxPage, isLastPage });
    } catch (error) {
      res.status(400);
      throw new Error(error);
    }
  });

module.exports = {
    createProduct,
    getAllProduct,
    updateProduct,
    getProduct,
    deleteProduct,
    checkProductByName,
    checkProductBySKU,
    searchProduct
}