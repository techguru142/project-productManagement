const express = require("express");
const router = express.Router();
const {userRegistration, loginUser,getUser, updateUser }= require('../controllers/userController')
const {addProduct,findProduct, findProductById,deleteProductById,updateProduct} = require('../controllers/productController')
const {addToCart, updateCart, getCart, deleteCart} = require('../controllers/cartController')
const {createOrder,updateOrder} =require('../controllers/orderController')
const {authentication, authorization} = require('../middlewares/auth')

//**************USER APIs*********************//
router.post('/register', userRegistration );
router.post('/login', loginUser);
router.get('/user/:userId/profile',authentication, getUser);
router.put('/user/:userId/profile',authorization, updateUser);

//**************PRODUCT APIs*********************//
router.post('/products', addProduct);
router.get('/products',findProduct);
router.get('/products/:productId', findProductById);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId',deleteProductById);

//**************CART APIs*************************//
router.post('/users/:userId/cart',addToCart)
router.get('/users/:userId/cart',authentication, getCart)
router.delete('/users/:userId/cart',authorization, deleteCart)
router.put('/users/:userId/cart',authorization, updateCart)

//***************ORDER APIs***********************//
router.post('/users/:userId/orders',authorization, createOrder)
router.put('/users/:userId/orders',authorization, updateOrder)

//**************VALIDATE APIs*********************//
router.all("/**", function (req, res) {
  return res.status(404).send({ status: false, message: "Requested Api is Not Available" });
});

module.exports = router;
