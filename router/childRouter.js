const childRouter = require('express').Router();
const childModel = require('../models/childModel');
const guideModel = require('../models/guideModel');
const authguard = require("../services/authguard");


childRouter.get('/addChild', authguard, (req, res) => {
    res.render("pages/addChild.twig", {
        guide: req.session.guide,
        title: "Ajout d'un enfant"
    });
});


childRouter.post('/addChild', authguard, async (req, res) => {
    try {
        const newChild = new childModel(req.body);
        newChild.validateSync();
        await newChild.save();
        await guideModel.updateOne(
            { _id: req.session.guide._id },
            { $push: { childrenCollection: newChild._id } }
        );
        res.redirect("/guideDashboard");
    } catch (error) {
        console.log(error);
        res.render("pages/addChild.twig", {
            guide: req.session.guide,
            error: error.message
        });
    }
});


childRouter.get('/editChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé.");
        }

        res.render('pages/editChild.twig', {
            child: child,
            guide: req.session.guide,
            title: "Modifier un enfant"
        });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'enfant:", error);
        res.status(500).send("Erreur lors de la récupération de l'enfant.");
    }
});


childRouter.post('/editChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const { firstname, points } = req.body;

        await childModel.findByIdAndUpdate(childId, {
            firstname: firstname,
            points: points,
        });

        res.redirect('/guideDashboard');
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'enfant:", error);
        res.status(500).send("Erreur lors de la mise à jour de l'enfant.");
    }
});


childRouter.post('/deleteChild/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        await guideModel.updateOne(
            { _id: req.session.guide._id },
            { $pull: { childrenCollection: childId } }
        );

        await childModel.findByIdAndDelete(childId);

        res.redirect('/guideDashboard');
    } catch (error) {
        console.error("Erreur lors de la suppression de l'enfant:", error);
        res.status(500).send("Erreur lors de la suppression de l'enfant.");
    }
});


childRouter.get('/childDashboard/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        if (!req.session.selectedProfile || req.session.selectedProfile.role !== 'child' || req.session.selectedProfile.childId !== childId) {
            return res.redirect('/chooseProfile');
        }

        const child = await childModel.findById(childId);

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
