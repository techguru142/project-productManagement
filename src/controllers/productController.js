const Product = require('../models/productModel')
const awsController = require("../controllers/awsController")
const { isValid, isValidRequest } = require('../validator/validation')




const addProduct = async function (req, res) {
    try {
        let data = req.body
        let files = req.files
        data.currencyFormat = '₹'
        data.currencyId = "INR"
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted, ...rest } = data

        //------------------------------------------------VALIDATE REQUIRED FIELD---------------------------------------------// 
        if (!isValidRequest(data)) return res.status(400).send({ status: false, message: "Body is empty" })
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: "Invalid attributes in request body" })
        if (!title) return res.status(400).send({ status: false, message: "Title is required" })
        if (!description) return res.status(400).send({ status: false, message: "Description is required" })
        if (!price) return res.status(400).send({ status: false, message: "Price is required" })
        if (!files) return res.status(400).send({ status: false, message: "Product image is required" })
        if (!availableSizes) return res.status(400).send({ status: false, message: "available size is required" })
        //--------------------------------------------------VALIDATION------------------------------------------------------//
        if (!isNaN(title)) return res.status(400).send({ status: false, message: "title can not be number only" })
        if (!isValid(title)) return res.status(400).send({ status: false, message: "Title is empty" })

        if (!isNaN(description)) return res.status(400).send({ status: false, message: "Description can not be number only" })
        if (!isValid(description)) return res.status(400).send({ status: false, message: "description is empty" })

        if (isNaN(price)) return res.status(400).send({ status: false, message: "price value should be number only" })
        if (!isValid(price)) return res.status(400).send({ status: false, message: "Price is empty" })

        if (isFreeShipping) {
            if (!['true', 'false'].includes(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping value should only true or false" })
            if (isFreeShipping.trim().length == 0) return res.status(400).send({ status: false, message: "isFreeShipping contains empty value" })
        }

        if (style) {
            if (!isValid(style)) return res.status(400).send({ status: false, message: "style contains empty value" })
            if (!isNaN(style)) return res.status(400).send({ status: false, message: "style cann't be number only" })
        }

        let arr = availableSizes.split(",").map(a => a.toUpperCase())
        for (let i = 0; i < arr.length; i++) {
            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i])) {
                return res.status(400).send({ status: false, message: "available size should be only atleast one of these: S, XS,M,X, L,XXL, XL " })
            }
        }
        data.availableSizes = arr // set requested size in documentS

        if (installments) {
            if (isNaN(installments)) return res.status(400).send({ status: false, message: "installments value  should be number only " })
            if (!isValid(installments)) return res.status(400).send({ status: false, message: "installments is empty" })
        }

        //----------------------------CHECK UNIQUE VALUE OF TITLE-----------------------------------------------------//
        let checkTitle = await Product.findOne({ title: data.title });
        if (checkTitle) return res.status(400).send({ status: false, message: "Title already exist" });
        //--------------------------------------------VALIDATE FILE AND SET FILE URL IN PRODUCT IMAGE-------------------// 
        mimetype = files[0].mimetype.split("/") //---["image",""]
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (files && files.length > 0) var uploadedFileURL = await awsController.uploadFile(files[0])
        data.productImage = uploadedFileURL

        let createProduct = await Product.create(data) //CREATE REQUESTED DATA DOCUMENTS
        res.status(201).send({ status: true, message: "success", data: createProduct })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

const findProduct = async function (req, res) {
    try {
        let query = req.query
        if (Object.keys(query).length == 0) {
            const productList = await productModel.find({ isDeleted: false })
            if (productList.length == 0) {
                return res.status(404).send({ status: false, message: 'no product found' })
            }
            return res.status(200).send({ status: true, message: 'Success', data: productList })
        }
        const { size, name, priceLessThan, priceGreaterThan, priceSort } = query
        let filterValueObject = { isDeleted: false, }

        // hasOwnProperty()
        if (size !== undefined) {
            let array = size.split(',').map(a => a.toUpperCase())
            for (i = 0; i < array; i++) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i])) {
                    return res.status(400).send({ status: false, message: `${array[i]} should be of these "S", "XS","M","X", "L","XXL", "XL"` })
                }
            }
            filterValueObject.availableSizes = { $in: array }
        }

        if (name !== undefined) {
            filterValueObject.title = { $regex: name, $options: 'i' }
        }

        if (priceLessThan !== undefined && priceGreaterThan == undefined) {
            filterValueObject.price = { $lt: priceLessThan }
        }

        if (priceLessThan !== undefined && priceGreaterThan !== undefined) {
            filterValueObject.price = { $lt: priceLessThan, $gt: priceGreaterThan }
        }

        if (priceGreaterThan !== undefined && priceLessThan == undefined) {
            filterValueObject.price = { $gt: priceGreaterThan }
        }
        let sortDocu = {}
        if (priceSort !== undefined) {
            if (priceSort == 1) {
                sortDocu.priceSort = priceSort
            }
            if (priceSort == -1) {
                sortDocu.priceSort = priceSort
            }
        }


        let filterProduct = await productModel.find(filterValueObject).sort({ price: sortDocu.priceSort })


        if (filterProduct.length == 0) {
            return res.status(404).send({ status: false, message: 'no product found' })
        }

        return res.status(200).send({ status: true, message: 'Success', data: filterProduct })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const findProductById = async function (req, res) {
    try {
        const productIdByParams = req.params.productId
        if (!isValidObjectId(productIdByParams)) {
            return res.status(400).send({ status: false, message: 'productId is invailid' })
        }
        checkProductInDb = await productModel.findOne({ _id: productIdByParams, isDeleted: false })
        if (!checkProductInDb) {
            return res.status(404).send({ status: false, message: 'no product found' })
        }
        return res.status(200).send({ status: true, message: 'Success', data: checkProductInDb })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const updateProduct = async function (req, res) {

    try {
        const data = req.body
        const productId = req.params.productId
        let files = req.files;


        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid ProductId" })
        }

        const checkProduct = await Product.findOne({ _id: productId, isDeleted: false })

        if (!checkProduct) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "please provide product details to update" })

        }

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data






        if (!isValidString(title)) {
            return res.status(400).send({ status: false, message: "Invalid format of Title", });
        }

        const titleCheck = await Product.findOne({ title: title });

        if (titleCheck) {
            return res.status(400).send({ status: false, message: `${data.title} This Title Already Exist.Please Give Another Title` })
        }


        if (!isValidString(description)) {
            return res.status(400).send({ status: false, message: "Invalid format of description", });
        }



        if (!isValidString(price) || price <= 0) {
            return res.status(400).send({ status: false, message: "Invalid Format of price it should be number and must be positive numbers" });

        }

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId required" })
        }


        if (currencyId.trim() != "INR") {
            return res.status(400).send({ status: false, message: "Please provide Indian currencyId" });
        }


        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currency format required" })
        }


        if (currencyFormat.trim() != "₹") {
            return res.status(400).send({ status: false, message: "Please provide correct currencyFormat" });
        }



        if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
            return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
        }

        if (!isValidString(style)) {
            return res.status(400).send({ status: false, message: "Invalid format of style", });
        }

        if (availableSizes) {
            let arr = availableSizes.split(",").map(a => a.toUpperCase())
            for (let i = 0; i < arr.length; i++) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i])) {
                    return res.status(400).send({ status: false, message: "available size should be only atleast one of these: S, XS,M,X, L,XXL, XL " })
                }
            }
        }

        if (installments) {


            if (!isValidString(installments) || installments <= 0) {
                return res.status(400).send({ status: false, message: "Invalid Format of installments it should be number and should be greater than zero" });
            }
        }



        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId },

            { new: true })

        return res.status(200).send({ status: true, message: 'Product details updated successfully.', data: updatedProduct });

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

const deleteProductById = async function (req, res) {
    try {
        const productIdByParams = req.params.productId
        if (!isValidObjectId(productIdByParams)) {
            return res.status(400).send({ status: false, message: 'productId is invailid' })
        }
        checkProductInDb = await productModel.findOne({ _id: productIdByParams, isDeleted: false })
        if (!checkProductInDb) {
            return res.status(404).send({ status: false, message: 'no product found' })
        }
        const deleteProduct = await productModel.findByIdAndUpdate(checkProductInDb._id, { $set: { isDeleted: true } })
        return res.status(200).send({ status: true, message: 'Product Deleted' })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}



module.exports = { addProduct, findProduct, findProductById, deleteProductById, updateProduct }