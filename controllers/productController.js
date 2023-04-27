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

    const existingSKU = await Product.findOne({ SKU: { $regex: new RegExp(`^${SKU}$`, 'i') }, user: req.user.id });
    if (existingSKU) {
      res.status(401)
      throw new Error('A product with this SKU already exists')
    }

    const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, user: req.user.id });
    if (existingProduct) {
      res.status(401)
      throw new Error('A product with this name already exists')
    }

    const foundCategory = await Category.findById(category)
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
});


const updateProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      SKU,
      description,
      salePrice,
      purchasePrice,
      quantity,
      enabled,
      enableBill,
      category,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const foundCategory = await Category.findById(category)
    if (!foundCategory) {
      return res.status(400).json({ message: 'Invalid category name' });
    }

    product.name = name;
    product.SKU = SKU;
    product.description = description;
    product.salePrice = salePrice;
    product.purchasePrice = purchasePrice;
    product.quantity = quantity;
    product.enabled = enabled;
    product.enableBill = enableBill;
    product.categoryId = foundCategory._id,

      await product.save();

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

const getProductByID = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    const product = await Product.findById(id)

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
    sortBy,
    sortOrder,
    enabled,
    enableBill,
    categoryId, // Add categoryId to the destructured query object
    page,
    limit
  } = req.query;

  const query = { user: req.user.id };
  if (name) query.name = { $regex: name, $options: 'i' };
  if (SKU) query.SKU = { $regex: SKU, $options: 'i' };
  if (enabled) query.enabled = enabled;
  if (enableBill) query.enableBill = enableBill;

  // Add categoryId check
  if (categoryId) {
    query.categoryId = categoryId;
  }

  const sort = {};
  if (sortBy && sortOrder) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.categoryId = 1; // sort by category ID in ascending order
    sort.createdAt = -1; // sort by createdAt field in descending order
  }

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
      .populate('categoryId', 'name')
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(sort);

    const count = await Product.countDocuments(query);
    const maxPage = Math.ceil(count / options.limit);
    res.status(200).json({ products, count, maxPage, isLastPage: options.page * options.limit >= count });

  } catch (error) {
    res.status(400)
    throw new Error(error)
  }
});



const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    const product = await Product.findOneAndDelete({ SKU: req.params.SKU, user: req.user.id });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});



const checkProductByName = asyncHandler(async (req, res) => {
  const { name } = req.params;

  try {
    const product = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, user: req.user.id });
    res.status(200).json({ exists: !!product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



const checkProductBySKU = asyncHandler(async (req, res) => {
  const { SKU } = req.params;

  try {
    const product = await Product.findOne({ SKU: { $regex: new RegExp(`^${SKU}$`, 'i') }, user: req.user.id });
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

  const query = { user: req.user.id };
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

const getAllProductsWithoutPagination = asyncHandler(async (req, res) => {
  const query = { user: req.user.id };

  const products = await Product.find(query);

  if (!products) {
    res.status(404);
    throw new Error('No products found');
  }

  res.json(products);
});

module.exports = {
  createProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  checkProductByName,
  checkProductBySKU,
  searchProduct,
  getAllProductsWithoutPagination,
  getProductByID
}