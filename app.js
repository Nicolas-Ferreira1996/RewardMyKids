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
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: process.env.CRYPTSESS, // choisir une valeur secrète et sécurisée
    resave: true, // la session sera enregistrée à chaque requête, même si elle n'a pas été modifiée. Cela garantit que la session n'expire pas tant que l'utilisateur est actif sur le site.
    saveUninitialized: true, // Sauvegarder une session même si elle n'est pas initialisée
}));
app.use(guideRouter)
app.use(childRouter)
app.use(questRouter)
app.use(rewardRouter)


app.listen(process.env.PORT,()=>{
    console.log("Connecté");
});

mongoose.connect(process.env.MONGO);