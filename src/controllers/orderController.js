const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const {isValidRequest, isValidObjectId, isValid} = require('../validator/validation')

const createOrder = async function(req, res){
    try {
        let userId = req.params.userId
        let data = req.body
        //---------------------------Check Body-----------------//
        if(!isValidRequest(data)) return res.status(400).send({status:false, message:"Body is empty"})
        //---------------------------VALIDATE USER ID---------------------//
        if(!isValidObjectId(userId))return res.status(400).send({ status: false, message: "Invalid user id" })
        if(!isValid(userId))return res.status(400).send({status:false, message:"User id is empty"})
        //----------------------------VALIDATE CART ID---------------------//
        if(!data.cartId) return res.status(400).send({ status: false, message: "Cart id is required " })
        if(!isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "Invalid card id" })
        //-----------------------------FIND CART DETAILS--------------------//
        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) return res.status(404).send({ status: false, message: "Cart not found" })
        //-----------------------------COMPARE EXISTED CART ID AND REQUESTE CART ID----------------------/
        if(findCart._id!= data.cartId) return res.status(400).send({ status: false, message: "cartId is not matched with user" })
        if (!findCart.items.length) return res.status(400).send({ status: false, message: "Cart is empty" })
        //------------------------------SET DATA IN req.body-----------------------------//
        data.userId = userId
        data.items = findCart.items
        data.totalPrice = findCart.totalPrice
        data.totalItems = findCart.totalItems
        //------------------------------ADDING ALL QUANTITY OF CART-----------------------//
        data.totalQuantity = findCart.items.reduce(function (previousValue, currentValue) {
            return previousValue + currentValue.quantity;
        },0)
        

        if (data.hasOwnProperty("cancellable")) {
            if (!((data.cancellable == true) || (data.cancellable == false)))
                return res.status(400).send({ status: false, messsage: "cancellable should be in boolean value" })
        }

        if (data.hasOwnProperty("status")) {
            if (data.status!== "pending")
            return res.status(400).send({ status: false, messsage: "Status should be pending only at the time of create order" })
        }    

      let savedOrder = await orderModel.create(data)
      //----------------Removing product from cart------------------//
        await cartModel.findOneAndUpdate({ _id: findCart._id }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
        return res.status(200).send({ status: true, message: "Order Created Successfully", data: savedOrder })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateOrder = async function(req,res){
    try{
        let userId = req.params.userId
        let data =req.body
        let {orderId,status} = data


        
        if(!isValidRequest(data)) return res.status(400).send({status:false, message:"Body is empty"})
        

        if(!isValid(orderId))return res.status(400).send({status:false,message:'order id is emty'})
        if(!isValidObjectId(orderId))return res.status(400).send({status:false,message:'pls enter valid order id'})


        let findOrder = await orderModel.findOne(({_id: orderId}))
        if(!findOrder) return res.status(404).send({status:false,message:'no order found '})

        if(findOrder.userId.valueOf() !== userId){
           
            return res.status(400).send({status:false,message:'orderid does not belongs to userid '})
        }

        if(!status){
               return res.status(400).send({status:false,message:'status is required for update order '})
        }


          if(!isValid(status))return res.status(400).send({status:false,message:'status is empty'})

          if(!(["pending", "completed", "cancelled"].includes(status)))return res.status(400).send({status:false,message:"order status should be 'pending'/'completed'/'cancelled'"})

        if(findOrder.status=="cancelled"){

            return res.status(400).send({status:false,message:'this order is already cancelled '})
        }

         if(findOrder.status=="completed"){

            return res.status(400).send({status:false,message:'order is completed '})
        }


          if(findOrder.cancellable==false){
            return res.status(400).send({status:false,message:'the order is not cancellable '})

          }

          const updateOrder = await orderModel.findOneAndUpdate({_id:orderId},{status:status},{new:true})
           return res.status(200).send({status:true,message:'order update succesfully'})

    }

    catch(error){
        console.log(error)
           return res.status(500).send({status:false,message: error.message})

    }


}

module.exports={createOrder,updateOrder}