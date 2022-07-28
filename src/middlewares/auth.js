
try {
    let token = req.header('Authorization', 'Bearer Token');
    if (!token) {
        return res.status(400).send({ status: false, message: "login is required" })
    }

    let splitToken = token.split(" ")

    jwt.verify(splitToken[1], "doneBy50", (error) => {
        if (error) {
            const message =
                error.message === "jwt expired" ? "Token is expired, Please login again" : "Token is invalid, Please recheck your Token"
            return res.status(401).send({ status: false, message })
        }
        next();
    })
}catch(err){
    return res.status(500).send({status:false, message:err.message})
}