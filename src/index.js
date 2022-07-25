const express = require("express")
const route = require("./routes/route")
const multer =require('multer')
const app = express()
const mongoose = require("mongoose")

app.use(express.json())
app.use(multer().any())

mongoose.connect("mongodb+srv://tech-guru:Job7563@cluster0.ivxxx.mongodb.net/group57Database-DB?retryWrites=true&w=majority",
    {useNewUrlParser: true
    })
    .then(() => console.log("MongoDB is connected"))
    .catch((err) => console.log(err));

app.use('/', route)


app.listen(process.env.PORT || 3000, function(){
    console.log("Express app running on port",(process.env.PORT || 3000) )
})
