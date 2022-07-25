const express = require("express");
const router = express.Router();



router.all("/**", function (req, res) {
  return res
    .status(404)
    .send({ status: false, message: "Requested Api is Not Available" });
});

module.exports = router;