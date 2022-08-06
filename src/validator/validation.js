const mongoose = require('mongoose')

const isValid = function (value) {
    if ( typeof value == null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
}

const isValidRequest = function(body){
    if(Object.keys(body).length ===0) return false;
    return true;
}

const isValidName = function(name){
    return /^[a-zA-Z ]{3,20}$/.test(name)
}

const isValidPincode = function(num){
    return /^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(num)
   
  }
  
  const isValidPhone = function(phone) {
    return /^[0]?[6789]\d{9}$/.test(phone)
  }

  const isValidEmail = function(Email) {
    return  /^([A-Za-z0-9._]{3,}@[A-Za-z]{3,}[.]{1}[A-Za-z.]{2,6})+$/.test(Email)
  }

  const isValidPwd = function(Password)  {
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(Password)
  }

  const isValidObjectId = function(ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
  }

 
  




module.exports={isValid, isValidRequest,isValidName ,isValidPincode, isValidPhone,isValidEmail,isValidPwd,isValidObjectId,}