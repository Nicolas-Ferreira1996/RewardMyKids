const childRouter = require('express').Router();
const childModel = require('../models/childModel');
const guideModel = require('../models/guideModel');
const authguard = require("../services/authguard");

// Route GET pour afficher le formulaire d'ajout d'un enfant
childRouter.get('/addChild', authguard, (req, res) => {
    res.render("pages/addChild.twig", {
        guide: req.session.guide,
        title: "Ajout d'un enfant"
    });
});

// Route POST pour ajouter un enfant
childRouter.post('/addChild', authguard, async (req, res) => {
    try {
        // Création d'un nouvel enfant
        const newChild = new childModel(req.body);
        newChild.validateSync(); // Validation des données avant sauvegarde
        await newChild.save(); // Sauvegarde dans la base de données
        await guideModel.updateOne( // Mise à jour du guide pour ajouter l'enfant à la collection
            { _id: req.session.guide._id },
            { $push: { childrenCollection: newChild._id } }
        );
        res.redirect("/guideDashboard");
    } catch (error) {
        console.log(error);
        res.render("pages/addChild.twig", { // En cas d'erreur, re-rendre la page d'ajout avec un message d'erreur
            guide: req.session.guide,
            error: error.message
        });
    }
});

// Route GET pour afficher le formulaire d'édition d'un enfant
childRouter.get('/editChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé.");
        }

        res.render('pages/editChild.twig', {
            child: child, // Passe les informations actuelles de l'enfant au template
            guide: req.session.guide,
            title: "Modifier un enfant"
        });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'enfant:", error);
        res.status(500).send("Erreur lors de la récupération de l'enfant.");
    }
});


// Route POST pour modifier un enfant
childRouter.post('/editChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const { firstname, points, comportement } = req.body;

        // Mettre à jour les informations de l'enfant
        await childModel.findByIdAndUpdate(childId, {
            firstname: firstname,
            points: points,
        });

        res.redirect('/guideDashboard'); // Redirection après modification réussie
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'enfant:", error);
        res.status(500).send("Erreur lors de la mise à jour de l'enfant.");
    }
});

// Route POST pour supprimer un enfant
childRouter.post('/deleteChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        // Supprimer l'enfant de la collection d'enfants du guide
        await guideModel.updateOne(
            { _id: req.session.guide._id },
            { $pull: { childrenCollection: childId } }
        );

        // Supprimer l'enfant lui-même
        await childModel.findByIdAndDelete(childId);

        res.redirect('/guideDashboard'); // Redirection après suppression réussie
    } catch (error) {
        console.error("Erreur lors de la suppression de l'enfant:", error);
        res.status(500).send("Erreur lors de la suppression de l'enfant.");
    }
});



// Route pour afficher le tableau de bord d'un enfant
childRouter.get('/childDashboard/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        // Vérifier si le profil sélectionné est un enfant
        if (!req.session.selectedProfile || req.session.selectedProfile.role !== 'child' || req.session.selectedProfile.childId !== childId) {
            return res.redirect('/chooseProfile');
        }

        const child = await childModel.findById(childId); // Modèle enfant

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        res.render('pages/childDashboard.twig', {
            child,
            title: "Dashboard Enfant"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données de l'enfant.");
    }
});


module.exports = childRouter;
