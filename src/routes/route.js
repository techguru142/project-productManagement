const express = require("express");
const router = express.Router();
const {userRegistration, loginUser,getUser, updateUser }= require('../controllers/userController')
const {addProduct,findProduct, findProductById,deleteProductById,updateProduct} = require('../controllers/productController')
const {addToCart, updateCart} = require('../controllers/cartController')

//**************USER APIs*********************//
router.post('/register', userRegistration );
router.post('/login', loginUser);
router.get('/user/:userId/profile',getUser);
router.put('/user/:userId/profile',updateUser);

//**************PRODUCT APIs*********************//
router.post('/products', addProduct);
router.get('/products',findProduct);
router.get('/products/:productId',findProductById);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId',deleteProductById);

//**************CART APIs*************************//
router.post('/users/:userId/cart',addToCart)
router.put('/users/:userId/cart', updateCart)

//**************VALIDATE APIs*********************//
router.all("/**", function (req, res) {
  return res.status(404).send({ status: false, message: "Requested Api is Not Available" });
});

module.exports = router;
