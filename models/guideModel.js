const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require('dotenv').config()

const guideSchema = mongoose.Schema({
    teamName: {
        type: String,
        required: [true, "Le nom de votre équipe est requis"],
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9À-ÖØ-öø-ÿ\s]{2,25}$/.test(v);
            },
            message: "Entrez un nom d'équipe valide (entre 2 et 25 caractères)"
        },
    },
    name: {
        type: String,
        required: [true, "Le nom est requis"],
        validate: {
            validator: function (v) {
                return /^[a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ' -]{2,}$/u.test(v);
            },
            message: "Entrez un nom valide"
        },
    },
    email: {
        type: String,
        required: [true, "L'email est requis"],
        validate: {
            validator: function (v) {
                return /^(?!\.)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g.test(v);
            },
            message: "Entrez un mail valide"
        },
    },
    password: {
        type: String,
        required: [true, "Le mot de passe est requis"],
        validate: {
            validator: function (v) {
                return /^(?=.*\d).{8,}$/.test(v);
            },
            message: "Entrez un mot de passe valide, 8 caractères minimum, au moins une lettre minuscule, une lettre majuscule, un chiffre, un caractère spécial (parmi @$!%*?&)."
        },
    },
    childrenCollection: [{
        type: mongoose.Schema.Types.ObjectId, //
        ref: 'children'
    }]
});

guideSchema.pre("validate", async function (next) {
    try {
        const existingguide = await this.constructor.findOne({ email: this.email });
        if (existingguide) {
            this.invalidate("email", "Cet email est déjà enregistré.");
        }
        next();
    } catch (error) {
        next(error);
    }
});

guideSchema.pre('save', async function (next) {
    if (this.isModified("password")) {
        this.password = bcrypt.hashSync(this.password, parseInt(process.env.SALT))
    }
    next()
})


const guideModel = mongoose.model('guides', guideSchema);
module.exports = guideModel;