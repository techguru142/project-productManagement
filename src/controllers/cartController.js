const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const { isValidObjectId, isValidRequest, isValid } = require('../validator/validation');



const addToCart = async function (req, res) {
    try {
        const user = req.params.userId;
        if (!isValidObjectId(user)) {
            return res
                .status(400)
                .send({ status: false, message: "userId is not valid" });
        }
        const reqBody = req.body;

        if (!isValidRequest(reqBody)) {
            return res.status(400).send({ status: false, message: "Body is empty" });
        }
        let { cartId, productId, quantity } = reqBody;

        if (!productId) {
            return res
                .status(400)
                .send({ status: false, message: "productId is required" });
        }
        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "productId is not valid" });
        }

        if (!quantity) {
            if (typeof quantity == "number" || typeof quantity == "boolean") {
                return res
                    .status(400)
                    .send({ status: false, message: "quantity should be more than 0" });
            }
            quantity = 1;
        }

        if (typeof quantity != "number") {
            return res
                .status(400)
                .send({ status: false, message: "quantity should be in number" });
        }



        let userExist = await userModel.findOne({ _id: user });

        if (!userExist) {
            return res
                .status(404)
                .send({ status: false, message: "no user data found" });
        }

        let productExist = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });

        if (!productExist) {
            return res
                .status(404)
                .send({ status: false, message: "no product data found" });
        }


        let cartDbExist = await cartModel.findOne({ userId: user });
        if (!cartDbExist) {

            //creating object for creating cart
            let createCartObject = {
                userId: user,
                items: { productId: productId, quantity: quantity },
                totalPrice: productExist.price * quantity,
                totalItems: 1,
            };
            // creating card
            createCart = await cartModel.create(createCartObject);

            // response to client with document
            return res
                .status(201)
                .send({ status: true, message: "Cart Created", data: createCart });
        }

        // forloop to know is that same product is already exist in cart 
        for (let i = 0; i < cartDbExist.items.length; i++) {
            if (cartDbExist.items[i].productId == productId) {
                let prodPrice = productExist.price;
                cartDbExist.items[i].quantity += quantity;
                cartDbExist.totalPrice = cartDbExist.totalPrice + quantity * prodPrice;
                cartDbExist.totalItems = cartDbExist.items.length;

                let updateSameProductCart = await cartModel.findOneAndUpdate(
                    { userId: user },
                    {
                        $set: {
                            items: cartDbExist.items,
                            totalItems: cartDbExist.totalItems,
                            totalPrice: cartDbExist.totalPrice,
                        },
                    },
                    { new: true }
                );
                return res.status(200).send({
                    status: true,
                    message: "same product added to cart",
                    data: updateSameProductCart,
                });
            }
        }

        // create object for add new product in cart
        let addProduct = {
            $push: { items: { productId: productId, quantity: quantity } },
            $set: {
                totalPrice: cartDbExist.totalPrice + productExist.price * quantity,
                totalItems: cartDbExist.totalItems + 1,
            },
        };
        // add new product in cart
        let cartAddProduct = await cartModel.findOneAndUpdate(
            { userId: user },
            addProduct,
            { new: true }
        );

        return res.status(200).send({
            status: true,
            message: "new product added in cart",
            data: cartAddProduct,
        });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

const getCart = async function (req, res) {

    try {

        const userId = req.params.userId;


        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "userId is not Valid" })
        }
        let checkUser = await userModel.findById(userId)
        if (!checkUser) {
            res.status(404).send({ status: false, msg: "user is not found" })
        }


        const checkCart = await cartModel.findOne({ userId: userId })

        if (!checkCart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }

        return res.status(200).send({ status: true, message: "add to cart successfully", data: checkCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}



const updateCart = async function (req, res) {
    try {
        let userData = req.body
        let userId = req.params.userId
        const { cartId, productId, removeProduct } = userData

        if(!isValidRequest(userData))return res.status(400).send({status:false, message:"Body is empty"})
        if(!productId) return res.status(400).send({status:false, message:"Product id is required"})
        if(!cartId) return res.status(400).send({status:false, message:"Cart id is required"})
        //---------------------VALIDATE Object id--------------//
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid user id" })
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "invalid cart id" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid product id" })

        //---------------------Check Product--------------------//
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(400).send({ status: false, message: "product not found" })
        //----------------------Check Cart-----------------------//
        let cart = await cartModel.findOne({ _id: cartId })
        if (!cart) return res.status(404).send({ status: false, message: "cart not found" })
        //---------------------Check cart existed for user or not------------------//
        if (cart.userId.valueOf() !== userId) return res.status(404).send({ status: false, message: "No one cart existed for this user" })
        //---------------------check product added in cart or not-------------------//
        findProductIndex = cart.items.findIndex((obj) => obj.productId == productId)
        if (!cart.items[findProductIndex]) {
            return res.status(404).send({
                status: false, message: "This Product is not Present in Your Cart"
            })
        }

        //-----------------------Update Product in cart---------------------//     
        // if (removeProduct != 0 || removeProduct != 1) return res.status(400).send
        // ({ status: false, message: "you can only enter removeProduct value either 1 or 0" })
        if (removeProduct === 1) {

            cart.items[findProductIndex].quantity -= 1

            if (cart.items[findProductIndex].quantity === 0) {
                cart.items.splice(findProductIndex, 1)
                cart.totalItems -= 1
            }

            cart.totalPrice = cart.totalPrice - (product.price)

        }
        else if (removeProduct === 0) {    //remove Product from cart
            cart.totalPrice = cart.totalPrice - (product.price * (cart.items[findProductIndex].quantity))
            cart.items.splice(findProductIndex, 1)
            cart.totalItems -= 1
        }

        let cartUpdate = await cartModel.findOneAndUpdate({ _id: cart._id }, cart, { new: true })
        return res.status(200).send({ status: true, message: "Cart SuccessFully Update", data: cartUpdate })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;


        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }
        const checkUser = await userModel.findById(userId)
        if (!checkUser) {
            return res.status(404).send({ status: false, message: "user not found" })
        }

        const findCart = await cartModel.findOne({ userId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "cart not found" })
        }

        const deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalPrice: 0, totalItems: 0 } })

        return res.status(204).send({ status: true, message: "Cart deleted successfully" })


    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}





module.exports = { addToCart, getCart, updateCart, deleteCart }

