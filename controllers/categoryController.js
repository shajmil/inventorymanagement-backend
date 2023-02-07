const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Category = require('../models/categoryModel')

// access contact
const getCategory = asyncHandler(async (req, res) => {

    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        const category = await Category.find({ user })
        res.status(200).json(category)


    } catch (error) {
        res.status(400)
        throw new Error(error)

    }
})


const createCategory = asyncHandler(async (req, res) => {


    try {

        const { name } = req.body;
        const existingCategory = await Category.findOne({ name });
        const user = await User.findById(req.user.id)
        if (!user) {
            res.status(401)
            throw new Error('User not found')
        }
        if (existingCategory) {
            res.status(401)
            throw new Error('A category with this name already exists')
        }

        const newCategory = new Category({
            name,
            user: req.user.id
        });
        await newCategory.save();

        res.json({ category: newCategory });
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
    getCategory
}