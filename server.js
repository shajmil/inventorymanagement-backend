const express = require('express')
const colors = require('colors')
const connectDB = require('./config/db')
const cors = require('cors')
const dotenv = require('dotenv').config()
const {errorHandler} = require('./middleware/errorMiddleware')

const PORT = process.env.PORT || 5000

// connect to DB
connectDB()
const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/category', require('./routes/categoryRoutes'))
app.use('/api/product', require('./routes/productRouting'))
app.use('/api/vendor', require('./routes/vendorRoutes'))
app.use('/api/billCategory', require('./routes/billCategoryRoutes'))
app.use('/api/bill', require('./routes/billRoutes'))
app.use('/api/account', require('./routes/accountRoutes'))
app.use('/api/customer', require('./routes/customerRoutes'))
app.use('/api/invoiceCategory', require('./routes/invoiceCategoryRoutes'))
app.use('/api/invoice', require('./routes/invoiceRoutes'))

// app.use('/api/invoice', require('./routes/invoiceRoutes'))







app.use(errorHandler)
app.listen(PORT, () =>{
    console.log(`server started on ${PORT}`);
})