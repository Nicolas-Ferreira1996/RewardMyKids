const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const guideRouter = require("./router/guideRouter");
const childRouter = require("./router/childRouter");
const questRouter = require("./router/questRouter");
const rewardRouter = require("./router/rewardRouter");
require('dotenv').config();


const app = express();


app.use(express.static("./public"))
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: process.env.CRYPTSESS,
    resave: true,
    saveUninitialized: true,
}));
app.use(guideRouter)
app.use(childRouter)
app.use(questRouter)
app.use(rewardRouter)


app.listen(process.env.PORT, () => {
    console.log("Connecté");
});

mongoose.connect(process.env.MONGO);