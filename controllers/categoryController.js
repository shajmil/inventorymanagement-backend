const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
// access contact
const getCategory = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const categories = await Category.find({ user: req.user.id });

        res.status(200).json(categories);
    } catch (error) {
        res.status(400);
        throw new Error(error);
    }
});

const createCategory = asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            user: req.user.id
        });

        if (existingCategory) {
            res.status(400).json({ message: 'A category with this name already exists for this user' });
            return;
        }

        const newCategory = new Category({
            name,
            user: req.user.id
        });
        await newCategory.save();

        res.status(201).json({ category: newCategory });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    try {
    const { id } = req.params;
      const { name } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }
  
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      category.name = name;

      await category.save();
  
      res.json({ category });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  const getCategorybyID = asyncHandler(async (req, res) => {
    try {
    const { id } = req.params;
      const { name } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }
  
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      res.json({ category });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });


  const listCategoriesWithProducts = asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
      if (!user) {
        res.status(401)
        throw new Error('User not found')
      }
  
      const { page, limit, name } = req.query
      const query = { user: req.user.id }
      if (name) {
        query.name = { $regex: name, $options: 'i' }
      }
  
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
      const total = await Category.countDocuments(query)
      const categories = await Category.find(query).skip(startIndex).limit(limit)
  
      // For each category, find the count of products that belong to it
      const categoriesWithProductCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({ categoryId: category._id })
          return {
            ...category.toObject(),
            productCount
          }
        })
      )
  
      const response = {
        categories: categoriesWithProductCount,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        isLastPage: endIndex >= total,
        count: total
      }
      res.status(200).json(response)
    } catch (error) {
      res.status(400)
      throw new Error(error)
    }
  })
  
  
  
  
  



//  const deleteContact = asyncHandler (async (req,res)=>{
//     const contact = await Contact.findById(req.params.id)
//     if(!contact){
//         res.status(400)
//         throw new Error('Contact not found')
//     }

//     await contact.remove()
//     res.status(200).json({ id: req.params.id })
//  })

//  const getContactById = asyncHandler(async(req,res) =>{
//     const contact = await Contact.findById(req.params.id)
//     if(!contact){
//         res.status(400)
//         throw new Error('Contact not found')
//     }
//     res.status(200).json(contact)
//  })

module.exports = {
    createCategory,
    getCategory,
    updateCategory,
    listCategoriesWithProducts,
    getCategorybyID
}