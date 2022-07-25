const userModel = require('../models/userModel')
const awsController = require("../controllers/awsController")
const {isValid, isValidRequest} = require('../validator/validation')
const bcrypt = require('bcrypt')


const userRegistration = async function(req,res){
let userData = req.body
let files = req.files

if (files && files.length > 0) var uploadedFileURL = await awsController.uploadFile(files[0])
const{fname,lname,email, phone,password,address, ...rest} = userData
userData.profileImage = uploadedFileURL //set aws url in req.body
        userData = JSON.parse(JSON.stringify(userData));
 //--------------------------VALIDATION-----------------------------------------//
 var saltRounds=10;
 bcrypt.hash(password, saltRounds, function(err, hash) {
    // Store hash in database here
  });

if(!isValidRequest(userData)) return res.status(400).send({status:false, message:"Body is empty"})
if(Object.keys(rest).length ==0) return res.status(400).send({status:false, message:"Invalid attributes in request body"})
let savedUser = await userModel.create(userData)
res.status(201).send({status:true, message:"user created successfull", data:savedUser})

}

module.exports={userRegistration }