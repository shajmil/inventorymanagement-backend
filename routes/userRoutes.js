const express = require('express')

const router = express.Router()
const{RegisterUser,LoginUser, getMe} = require('../controllers/userController')

const {protect} = require('../middleware/authMiddleware')

router.post('/register', RegisterUser)
router.post('/login', LoginUser)
router.get('/me',protect, getMe)


module.exports = router