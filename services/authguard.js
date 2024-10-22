const guideModel = require('../models/guideModel');
const childModel = require('../models/childModel');

const authguard = async (req, res, next) => {
    try {
        if (req.session.guide) {
            let guide = await guideModel.findOne({ email: req.session.guide.email });
            if (guide) {
                return next(); // Utilisateur trouvé dans la base de données, autorisez l'accès à la route suivante
            }
        }
        throw new Error("Utilisateur non connecté");
    } catch (error) {
        console.error(error.message);
        res.status(401).render('pages/login.twig', {
            title: "connexion",
            errorAuth: error.message // passez le message d'erreur au modele pour qu'il puisse etre affiché dans votre template
        });
    }
};

module.exports = authguard