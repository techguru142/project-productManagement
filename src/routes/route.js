const express = require("express");
const router = express.Router();
const {userRegistration }= require('../controllers/userController')
const awsController=require("../controllers/awsController")

router.post('/register', userRegistration )
router.all("/**", function (req, res) {
  return res
    .status(404)
    .send({ status: false, message: "Requested Api is Not Available" });
});

module.exports = router;
