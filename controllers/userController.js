const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

 const RegisterUser = asyncHandler (async (req,res) =>{
    const {name, email, password} = req.body

    if(!name || !email || !password){
      res.status(400)
      throw new Error('please include all the fields')
    }

    //If user exist
    const userExists = await User.findOne({email})
    if(userExists){
        res.status(400)
        throw new Error('User already exists')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    })

    if(user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    } else{
        res.status(400)
        throw new Error('Invalid user data')
    }
 })
 
 const LoginUser = asyncHandler (async (req,res) =>{
    const {email, password} = req.body

    //check user and password
    const user= await User.findOne({email})
    if(user && (await bcrypt.compare(password,user.password))){
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        })
    }
    else{
        res.status(401)
        throw new Error('Invalid credentials')
    }

 })

// access private
 const getMe = asyncHandler (async (req,res) =>{
   const user = {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name
   }
    res.status(200).json(user)
 })


const generateToken = (id) =>{
    return jwt.sign({ id }, process.env.JWT_SECRET,{
        expiresIn:'30d'
    } )
}

 module.exports = {
    RegisterUser,
    LoginUser,
    getMe
 }