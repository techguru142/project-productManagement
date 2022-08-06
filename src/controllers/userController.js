const userModel = require('../models/userModel')
const awsController = require("../controllers/awsController")
const { isValid, isValidRequest, isValidName, isValidPincode, isValidEmail, isValidPhone, isValidPwd, isValidObjectId } = require('../validator/validation')
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
            return res.status(400).send({ status: false, message: "address or shipping or billing must be an object" })
        }

        let { shipping, billing, ...remaining } = userData.address
        //--------------------------------------------------SHIPPING ADDRESS VALIDATION-----------------------------------------------/
        if (!shipping) return res.status(400).send({ status: false, message: "Shipping Address is required " })
        if (!shipping.street) return res.status(400).send({ status: false, message: "Shipping street is required" })
        if (!isValid(shipping.street)) return res.status(400).send({ status: false, message: "Shipping street is empty" })
        if (!isNaN(shipping.street))return res.status(400).send({ status: false, message: "Shipping street can not be number only" })
        if (!shipping.city) return res.status(400).send({ status: false, message: "Shipping city is required" })
        if (!isValid(shipping.city))return res.status(400).send({ status: false, message: "Shipping city is empty" })
        if (!isNaN(shipping.city)) return res.status(400).send({ status: false, message: "Shipping city can not be number only" })
        if (!shipping.pincode) return res.status(400).send({ status: false, message: "Shipping pincode is required" })
        if (!isValid(shipping.pincode))return res.status(400).send({ status: false, message: "Shipping pincode is empty" })
        if (!isValidPincode(shipping.pincode)) {
            return res.status(400).send({ status: false, message: `${shipping.pincode} ,Shipping pincode must be of six digits` })
        }
        //--------------------------------------------------BILLING ADDRESS VALIDATION-----------------------------------------------/
        if (!billing) return res.status(400).send({ status: false, message: "billing Address is required " })
        if (!billing.street) return res.status(400).send({ status: false, message: "Billing street is required " })
        if (!isValid(billing.street))return res.status(400).send({ status: false, message: "Billing street is empty" })
        if (!isNaN(billing.street))return res.status(400).send({ status: false, message: "Billing street can not be number only" })
        if (!billing.city) return res.status(400).send({ status: false, message: "Billing city is required " })
        if (!isValid(billing.city))return res.status(400).send({ status: false, message: "Billing city is empty" })
        if (!isNaN(billing.city))return res.status(400).send({ status: false, message: "Billing city can not be number only" })
        if (!billing.pincode) return res.status(400).send({ status: false, message: "Billing pincode is required " })
        if (!isValidPincode(billing.pincode)) {
            return res.status(400).send({ status: false, message: `${billing.pincode} ,Billing pincode must be of six digits` })
        }
        if (Object.keys(remaining).length > 0) return res.status(400).send({ status: false, message: "Invalid attribute in address" })

        if (!isValid(fname)) return res.status(400).send({ status: false, message: "fname is empty" })
        if (!isValidName(fname)) return res.status(400).send({ status: false, message: "invalid fname" })

        if (!isValid(lname)) return res.status(400).send({ status: false, message: "lname is empty" })
        if (!isValidName(lname)) return res.status(400).send({ status: false, message: "invalid lname" })

        if (!isValid(email)) return res.status(400).send({ status: false, message: "email is empty" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "email is invalid" })

        if (!isValid(phone)) return res.status(400).send({ status: false, message: "phone is empty" })
        if (!isValidPhone(phone)) return res.status(400).send({ status: false, message: "phone is invalid it should be 10 digits" })

        if (!isValid(password)) return res.status(400).send({ status: false, message: "password is empty" })
        if (!isValidPwd(password))
            return res.status(400).send
                ({ status: false, message: "password should be atleast one uper, one lower,one number and one special character with 8-15 digits" })
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
        let mimetype = files[0].mimetype.split("/") //---["image",""]
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
        if (!isValidRequest(logInDetail)) {
            res.status(400).send({ staus: false, message: "Body is empty" });
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
        const userExist = await userModel.findOne({ email: email});
        if (!userExist) {
            res.status(401).send({ staus: false, message: "Invalid email or password" });
            return;
        }
        const validateUser = await bcrypt.compare(password, userExist.password);
        if (!validateUser) {
            return res
                .status(401)
                .send({ status: false, message: "incorrect password" });
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

//-------------------------------------------FETCH HANDLER-----------------------------------------//
const getUser = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid user id" })

        const user = await userModel.findOne({ _id: userId })
        if (!user) return res.status(400).send({ status: false, message: "User data not found" })
        return res.status(200).send({ status: true, message: 'User Profile Details', data: user })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}
//-------------------------------------------UPDATE HANDLER-----------------------------------------//
const updateUser = async function (req, res) {
    try {
        let userBody = req.body;
        const files = req.files;
        const paramUserid = req.params.userId
        // path params id validation
        if (!isValidObjectId(paramUserid)) {
            return res
                .status(400)
                .send({ status: false, message: "userId is not valid" });
        }
        // DB call to know is data available
        const existUser = await userModel.findById(paramUserid)
        if (!existUser) {
            return res
                .status(404)
                .send({ status: false, message: "User not found" });
        }
        // changing object into array and checking length for validation
        if (!isValidRequest(userBody)) {
            return res
                .status(400)
                .send({ status: false, message: "operation fail for update user" });
        }
        // doing destructuring 
        const { fname, lname, password, address, email, phone } = userBody;

        // creating empty object to add some key and their value after validation
        let forUpdateData = {};

        // checking phone property is getting or not if getting do some validation 
        if (phone !== undefined) {
            if (!isValid(phone)) {
                return res
                    .status(400)
                    .send({ status: false, message: "phone is empty" });
            }
            if (!isValidPhone(phone)) {
                return res.status(400).send({ status: false, message: "mobile phone is not valid" })
            };
            const checkPhone = await userModel.findOne({ phone: phone })
            if (checkPhone) {
                return res.status(409).send({ status: false, message: `use different phone number` });
            }
            forUpdateData['phone'] = phone;
        }

        // checking email property is getting or not if getting do some validation 

        if (email !== undefined) {
            if (!isValid(email)) {
                return res
                    .status(400)
                    .send({ status: false, message: "email is empty" });
            }
            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            };
            const checkEmail = await userModel.findOne({ email: email })
            if (checkEmail) {
                return res.status(409).send({ status: false, message: `use different email address` });
            }
            forUpdateData['email'] = email;
        }


        // checking password property is getting or not if getting do some validation 

        if (password !== undefined) {
            if (!isValidPwd(password)) {
                return res.status(400).send({ status: false, message: `password shoud be minimum 8 to maximum 15 characters which contain at least one numeric digit, one uppercase and one lowercase letter` })
            };
            const hashedPassword = await bcrypt.hash(password, 10)
            forUpdateData['password'] = hashedPassword;
        }

        // checking fname property is getting or not if getting do some validation 

        if (fname !== undefined) {
          if(!isValid(fname)) return res.status(400).send({status:false, message:"fname is empty"})
          if(!isValidName(fname))return res.status(400).send({status:false, message:"fname can not be a number"})
            forUpdateData["fname"] = fname.trim().split(" ").filter(word => word).join(" ");
        }

        // checking lname property is getting or not if getting do some validation 

        if (lname !== undefined) {
            if(!isValid(lname)) return res.status(400).send({status:false, message:"lname is empty"})
          if(!isValidName(lname))return res.status(400).send({status:false, message:"lname can not be a number"})
            forUpdateData["lname"] = lname.trim().split(" ").filter(word => word).join(" ");
        }

        // checking profileImage property is getting or not if getting do some validation 

        if (files[0] !== undefined) {
            if (files[0].originalname !== undefined) {
                if (!/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(files[0].originalname)) {
                    return res
                        .status(400)
                        .send({
                            status: false,
                            message:
                                "profileImage should be in these gif|jpe?g|tiff|png|webp|bmp format ",
                        });
                }
                var uploadedFileURL = await awsController.uploadFile(files[0]);
                forUpdateData["profileImage"] = uploadedFileURL;
            }
        }


        // checking address property is getting or not if getting do some validation 

        if (address !== undefined) {
            forUpdateData['address'] = existUser.address
            
            if (address.shipping !== undefined) {

                if (address.shipping.street !== undefined) {
                    if (
                        !isValid(address.shipping.street)
                    ) {
                        return res
                            .status(400)
                            .send({
                                status: false,
                                message: "street can not be empty string",
                            });
                    }
                    forUpdateData["address"]["shipping"]["street"] =
                        address.shipping.street
                            .trim()
                            .split(" ")
                            .filter((word) => word)
                            .join(" ");
                }
                if (address.shipping.city != undefined) {
                    if (
                        !isValid(address.shipping.city)
                    ) {
                        return res
                            .status(400)
                            .send({ status: false, message: "city can not be empty string" });
                    }
                    forUpdateData["address"]["shipping"]["city"] = address.shipping.city
                        .trim()
                        .split(" ")
                        .filter((word) => word)
                        .join(" ");
                }

                if (address.shipping.pincode !== undefined) {
                    if (isNaN(address.shipping.pincode)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "pincode can only be Number" });
                    }
                    if (!isValidPincode(address.shipping.pincode)) {
                        return res
                            .status(400)
                            .send({
                                status: false,
                                message: "pincode length must be 6 and does not starts with 0",
                            });
                    }
                    forUpdateData["address"]["shipping"]["pincode"] =
                        address.shipping.pincode;
                }
            }


            if (address.billing !== undefined) {

                if (address.billing.street !== undefined) {
                    if (
                        !isValid(address.billing.street )
                    ) {
                        return res
                            .status(400)
                            .send({
                                status: false,
                                message: "street can not be empty string",
                            });
                    }
                    forUpdateData["address"]["billing"]["street"] =
                        address.billing.street
                            .trim()
                            .split(" ")
                            .filter((word) => word)
                            .join(" ");
                }
                if (address.billing.city != undefined) {
                    if (
                        !isValid(address.billing.city)
                    ) {
                        return res
                            .status(400)
                            .send({ status: false, message: "city should be string or can not be empty string" });
                    }
                    forUpdateData["address"]["billing"]["city"] = address.billing.city
                        .trim()
                        .split(" ")
                        .filter((word) => word)
                        .join(" ");
                }

                if (address.billing.pincode !== undefined) {
                    if (isNaN(address.billing.pincode)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "pincode can only be Number" });
                    }
                    if (!isValidPincode(address.billing.pincode)) {
                        return res
                            .status(400)
                            .send({
                                status: false,
                                message: "pincode length must be 6 and does not starts 0 ",
                            });
                    }
                    forUpdateData["address"]["billing"]["pincode"] =
                        address.billing.pincode;
                }
            }
        }
        const updatedUserData = await userModel.findByIdAndUpdate({ _id: existUser._id }, { $set: forUpdateData }, { new: true })

        return res.status(200).send({ status: true, message: 'User profile updated', data: updatedUserData });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



module.exports = { userRegistration, loginUser, getUser,updateUser };

