const mongoose = require('mongoose');


    const childSchema = new mongoose.Schema({
        firstname: {
        type: String,
        required: [true, "Le prénom est requis."],
    },
    points: {
        type: Number,
        required: [true, "Le nombre de points est requis."],
    },
    comportement: {
        type: Number,
        default: 0
    },
    quests: [
            {
                questName: {
                    type: String,
                    required: true
                },
                questDescription: {
                    type: String,
                    required: true
                },
                questPoints: {
                    type: Number,
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^(?:[1-9]|[1-9][0-9]|100)$/.test(v);
                        },
                        message: 'Le nombre de points doit être compris entre 1 et 100.'
                    }
                },
                completed: 
                { 
                    type: Boolean,
                    default: false
                }
            }
        ],
        rewards: [
            {
                rewardName: {
                    type: String,
                    required: [true, "Le nom de la récompense est requis."],
                },
                rewardDescription: {
                    type: String,
                },
                rewardCost: {
                    type: Number,
                    required: [true, "Le coût en points est requis."],
                    validate: {
                        validator: function(v) {
                            return v > 0; // Le coût doit être un nombre positif
                        },
                        message: 'Le coût doit être supérieur à 0.'
                    }
                },
                purchased: 
                { 
                    type: Boolean,
                    default: false
                }
            }
        ]
    });


const childModel = mongoose.model('children', childSchema, 'children');

module.exports = childModel;
