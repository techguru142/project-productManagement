const productModel = require('../models/productModel')
const awsController = require("../controllers/awsController")
const { isValid, isValidRequest, isValidObjectId } = require('../validator/validation')




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
        if (price <= 0) {
            return res.status(400).send({ status: false, message:"price can not be lessthan or equal to zero" })
        }

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
        let checkTitle = await productModel.findOne({ title: data.title });
        if (checkTitle) return res.status(400).send({ status: false, message: "Title already exist" });
        //--------------------------------------------VALIDATE FILE AND SET FILE URL IN PRODUCT IMAGE-------------------// 
        let  mimetype = files[0].mimetype.split("/") //---["image",""]
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (files && files.length > 0) var uploadedFileURL = await awsController.uploadFile(files[0])
        data.productImage = uploadedFileURL

        let createProduct = await productModel.create(data) //CREATE REQUESTED DATA DOCUMENTS
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
        const files = req.files
        const productId = req.params.productId
       


        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid ProductId" })
        }

        const productCheck = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productCheck) {
            return res.status(404).send({ status: false, message: "Product not found or deleted" })
        }
        
        if (!isValidRequest(data)) {
            return res.status(400).send({ status: false, message: "please provide product details to update" })
        }

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments,} = data

        const updatedProductDetails = {}

       
        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: "Title is empty" })
            }
            if (!isNaN(title)) return res.status(400).send({ status: false, message: "title can not be number only" })
            const checkTitle = await productModel.findOne({ title: title });

            if (checkTitle) {
                return res.status(400).send({ status: false, message: ` Title is already used` })
            }

            updatedProductDetails['title'] = title
        }

        if (description) {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: `Description is empty` })
            }
            if (!isNaN(description)) return res.status(400).send({ status: false, message: "Description can not be number only" })
    
            updatedProductDetails['description'] = description
        }

        
        if (price) {

            if (!isValid(price)) {
                return res.status(400).send({ status: false, message: `price is empty` })
            }
            if (isNaN(Number(price))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message:"price can not be lessthan or equal to zero" })
            }

            updatedProductDetails['price'] = price
        }
        if (isFreeShipping) {
            if (!['true', 'false'].includes(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping value should only true or false" })
            if (isFreeShipping.trim().length == 0) return res.status(400).send({ status: false, message: "isFreeShipping contains empty value" })
        }

        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, message: `currencyId is empty` })
            }
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }
           
            updatedProductDetails['currencyId'] = currencyId;
        }

        
        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: `currency format is empty` })
            }
    
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" })
            }
            updatedProductDetails['currencyFormat'] = currencySymbol('INR')
        }

        if (isFreeShipping) {

            if (!['true', 'false'].includes(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping value should only true or false" })
            if (isFreeShipping.trim().length == 0) return res.status(400).send({ status: false, message: "isFreeShipping contains empty value" })
            updatedProductDetails['isFreeShipping'] = isFreeShipping
        }

      
        if (style) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, message: `style is empty` })
            }
            if (!isNaN(style)) return res.status(400).send({ status: false, message: "style cann't be number only" })

            updatedProductDetails['style'] = style
        }
        
        if(availableSizes){
        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: `size is empty` })
        }
        let arr = availableSizes.split(",").map(a => a.toUpperCase())
        for (let i = 0; i < arr.length; i++) {
            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i])) {
                return res.status(400).send({ status: false, message: "available size should be only atleast one of these: S, XS,M,X, L,XXL, XL " })
            }
        }
        updatedProductDetails['availableSizes'] = arr
    }


        
        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: `installment is required` })
            }

            if (!Number.isInteger(Number(installments))) {
                return res.status(400).send({ status: false, message: `installments should be a valid number` })
            }

            updatedProductDetails['installments'] = installments
        }
        if(files){
        let mimetype = files[0].mimetype.split("/") //---["image",""]
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (files && files.length > 0) var uploadedFileURL = await awsController.uploadFile(files[0])
        updatedProductDetails.productImage = uploadedFileURL
        }
        const updatedProduct = await productModel.findOneAndUpdate(
            { _id: productId },
            updatedProductDetails,
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
        const deleteProduct = await productModel.findByIdAndUpdate(checkProductInDb._id, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, message: 'Product Deleted', data:deleteProduct})
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}



module.exports = { addProduct, findProduct, findProductById, deleteProductById, updateProduct }