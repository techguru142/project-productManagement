const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")
const {isValidObjectId} = require('../validator/validation')


const authentication = function(req,res, next){
    try{
    let token = req.headers['authorization'];
       
        if (!token) return res.status(400).send({ status: false, message: "Token is missing" });
        token = token.split(" ")
        //-------------validate token-------------//
        let decodedToken = jwt.verify(token[1], "shopping-cart", function (err, data) {
            if (err) return null
            else {return data}
        });
        if(!decodedToken) return res.status(401).send({ status: false, message: "Token is invalid" });
        next()
    }catch(err){
        return res.status(500).send({ status: false, message: error.message })
    }
}





const authorization = async (req, res, next) => {
    try {
        let token = req.headers['authorization'];
        
        if (!token) return res.status(400).send({ status: false, message: "Token is missing" });
        token = token.split(" ")
        
        //-------------validate token-------------//
        let decodedToken = jwt.verify(token[1], "shopping-cart", function (err, data) {
            if (err) return null
            else {return data}
        });
        if(!decodedToken) return res.status(401).send({ status: false, message: "Token is invalid" });
        
     let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not valid" })
        //---------------Comparing requeste user id and login user id-------------------/
        if(userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "User logged is not authorized to access & manipulate other's data" });
        next();
    } catch (error) { 
        return res.status(500).send({ status: false, message: error.message })
    }



}

module.exports = { authentication, authorization }