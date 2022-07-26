const userModel = require('../models/userModel')
const awsController = require("../controllers/awsController")
const { isValid, isValidRequest,isValidName, isValidPincode, isValidEmail, isValidPhone, isValidPwd } = require('../validator/validation')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const userRegistration = async function (req, res) {
    try {
        let userData = req.body
        let files = req.files

        let { fname, lname, email, phone, password, address, ...rest } = userData

        //--------------------------VALIDATION-----------------------------------------//
        if (!isValidRequest(userData)) return res.status(400).send({ status: false, message: "Body is empty" })
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: "Invalid attribute in request body" })
        if (!fname) return res.status(400).send({ status: false, message: "fname is required" })
        if (!lname) return res.status(400).send({ status: false, message: "lname is required" })
        if (!email) return res.status(400).send({ status: false, message: "email is required" })
        if (files.length == 0) return res.status(400).send({ status: false, message: "profileImage is required" })
        if (!phone) return res.status(400).send({ status: false, message: "phone is required" })
        if (!password) return res.status(400).send({ status: false, message: "password is required" })
        if (!address) return res.status(400).send({ status: false, message: "address is required" })

        try {
            userData.address = JSON.parse(address);
        } catch (err) {
            return res.status(400).send({ status: false, message: "address or shipping or billing must be object" })
        }

        let { shipping, billing, ...remaining } = userData.address
        //--------------------------------------------------SHIPPING ADDRESS VALIDATION-----------------------------------------------/
        if (!shipping) return res.status(400).send({ status: false, message: "Shipping Address is required " })
        if (!shipping.street) return res.status(400).send({ status: false, message: "Shipping street is required" })
        if (!shipping.city) return res.status(400).send({ status: false.valueOf, message: "Shipping city is required" })
        if (!shipping.pincode) return res.status(400).send({ status: false.valueOf, message: "Shipping pincode is required" })
        if (!isValidPincode(shipping.pincode)) {
            return res.status(400).send({ status: false.valueOf, message: `${shipping.pincode} ,Shipping pincode must be of six digits` })
        }
        //--------------------------------------------------BILLING ADDRESS VALIDATION-----------------------------------------------/
        if (!billing) return res.status(400).send({ status: false, message: "billing Address is required " })
        if (!billing.street) return res.status(400).send({ status: false, message: "Billing street is required " })
        if (!billing.city) return res.status(400).send({ status: false, message: "Billing city is required " })
        if (!billing.pincode) return res.status(400).send({ status: false, message: "Billing pincode is required " })
        if (!isValidPincode(billing.pincode)) {
            return res.status(400).send({ status: false.valueOf, message: `${billing.pincode} ,Billing pincode must be of six digits` })
        }
        if (Object.keys(remaining).length > 0) return res.status(400).send({ status: false, message: "Invalid attribute in address" })

        if (!isValid(fname)) return res.status(400).send({ status: false, message: "fname is empty" })
        if (!isValidName(fname)) return res.status(400).send({status:false, message:"invalid fname"})
        if (!isValid(lname)) return res.status(400).send({ status: false, message: "lname is empty" })
        if (!isValidName(lname)) return res.status(400).send({status:false, message:"invalid lname"})
        if (!isValid(email)) return res.status(400).send({ status: false, message: "email is empty" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "email is invalid" })
        if (!isValid(phone)) return res.status(400).send({ status: false, message: "phone is empty" })
        if (!isValidPhone(phone)) return res.status(400).send({ status: false, message: "phone is invalid" })
        if (!isValid(password)) return res.status(400).send({ status: false, message: "password is empty" })
        if (!isValidPwd(password)) return res.status(400).send({ status: false, message: "password is invalid" })
        if (!isValid(address)) return res.status(400).send({ status: false, message: "address is empty" })
        //-----------------------------------CHECK UNIQUE EMAIL AND PHONE----------------------------------------//
        let emailExits = await userModel.findOne({ email })
        if (emailExits) return res.status(400).send({ status: false, message: `${email}, email is already used` })
        let phoneExits = await userModel.findOne({ phone })
        if (phoneExits) return res.status(400).send({ status: false, message: `${phone}, phone is already used` })
        //---------------------------------------PASSWORD INCRYPTING---------------------------------------------//
        const saltRounds = 10;
        userData.password = bcrypt.hashSync(password, saltRounds)
        //----------------------------------------SEND IMAGE TO AWS-----------------------------------------------//
        mimetype = files[0].mimetype.split("/") //---["image",""]
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (files && files.length > 0) var uploadedFileURL = await awsController.uploadFile(files[0])
        userData.profileImage = uploadedFileURL
        let savedUser = await userModel.create(userData)
        res.status(201).send({ status: true, message: "user created successfull", data: savedUser })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const loginUser = async function (req, res) {
    try {
        const logInDetail = req.body;
        if (Object.keys(logInDetail).length == 0) {
            res.status(400).send({ staus: false, message: "some data is required" });
            return;
        }
        const { email, password } = logInDetail;

        if (!email) return res.status(400).send({ staus: false, message: "email is required" });
        if (!password) return res.status(400).send({ staus: false, message: "password is required" });
        if (!isValid(email)) {
            res.status(400).send({ staus: false, message: "email value is empty" });
            return;
        }
        if (
            !isValid(password)
        ) {
            res.status(400).send({ staus: false, message: "password value is empty" });
            return;
        }
        const userExist = await userModel.findOne({ email: email });
        if (!userExist) {
            res.status(401).send({ staus: false, message: "Invalid email" });
            return;
        }
        const validateUser = await bcrypt.compare(password, userExist.password);
        if (!validateUser) {
            return res
                .status(401)
                .send({ status: false, message: "credentials are not correct" });
        }

        const token = jwt.sign(
            {
                userId: userExist._id,
                iat: new Date().getTime(),
                exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            "shopping-cart"
        );

        return res.status(201).send({
            status: true,
            message: "User login successfull",
            data: { userId: userExist._id, token: token },
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
};
const getUser = async function(req, res){
    try{
      let userId = req.params.userId;
    
      
      const user = await userModel.findOne({ _id: userId})
      return res.status(200).send({ status: true, message: 'User Profile Details', data: userData})
    }catch (err) {
      res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { userRegistration, loginUser,getUser };

