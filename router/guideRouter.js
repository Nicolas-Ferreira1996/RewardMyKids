const guideRouter = require('express').Router();
const guideModel = require('../models/guideModel')
const childModel = require('../models/childModel');
const authguard = require("../services/authguard")
const bcrypt = require('bcrypt')



guideRouter.get('/home', (req, res) => {
    res.render('pages/home.twig',
        {
            title: "Home"
        })
});

guideRouter.get('/subscribe', (req, res) => {
    res.render('pages/subscribe.twig',
        {
            title: "Inscription"
        })
})


guideRouter.post('/subscribe', async (req, res) => {
    try {
        const guide = new guideModel(req.body);
        await guide.save();
        res.redirect('/login')
    } catch (error) {
        res.render('pages/subscribe.twig',
            {
                error: error.errors,
                title: "Inscription"
            })
    }
});

guideRouter.get('/login', (req, res) => {
    res.render('pages/login.twig',
        {
            title: "Connexion"
        })
})

guideRouter.post('/login', async (req, res) => {
    try {
        let guide = await guideModel.findOne({ email: req.body.email })
        if (guide) {
            if (await bcrypt.compare(req.body.password, guide.password)) {

                req.session.guideId = guide._id;
                req.session.guide = guide;
                res.redirect('/chooseProfile');
            } else {
                throw { password: "Mauvais mot de passe" }
            }
        } else {
            throw { email: "Ce guide des quêtes n'est pas enregistré" }
        }
    } catch (error) {
        res.render('pages/login.twig',
            {
                title: "Connexion",
                error: error
            })
    }
});


guideRouter.get('/chooseProfile', authguard, async (req, res) => {
    try {
        const guideId = req.session.guideId;
        const guide = await guideModel.findById(guideId).populate('childrenCollection');

        if (!guideId) {
            return res.redirect('/login');
        }

        if (!guide) {
            return res.status(404).send("Guide non trouvé");
        }

        res.render('pages/chooseProfile.twig', {
            guide,
            title: "Choisir un Profil"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données du guide.");
    }
});


guideRouter.post('/selectGuideProfile', authguard, async (req, res) => {
    const guideId = req.session.guideId;
    const enteredPassword = req.body.password;

    if (!guideId) {
        return res.redirect('/login');
    }

    try {
        const guide = await guideModel.findById(guideId).populate('childrenCollection')

        if (!guide) {
            return res.status(404).send("Guide non trouvé");
        }

        const passwordMatches = await bcrypt.compare(enteredPassword, guide.password);
        if (!passwordMatches) {
            return res.render('pages/chooseProfile.twig', {
                guide,
                error: "Mot de passe incorrect"
            });
        }
        req.session.selectedProfile = { role: 'guide', guideId: guideId };
        res.redirect('/guideDashboard');

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la vérification du mot de passe.");
    }
});


guideRouter.get('/selectProfile', authguard, (req, res) => {
    const role = req.query.role;

    if (role === 'guide') {

        req.session.selectedProfile = { role: 'guide', guideId: req.query.guideId };
        res.redirect('/guideDashboard');

    } else if (role === 'child') {
        const childId = req.query.childId;
        req.session.selectedProfile = { role: 'child', childId: childId };
        res.redirect(`/childDashboard/${childId}`);
    } else {
        res.status(400).send("Sélection invalide");
    }
});


guideRouter.get('/guideDashboard', authguard, async (req, res) => {
    if (req.session.selectedProfile && req.session.selectedProfile.role === 'guide') {
        try {
            const guide = await guideModel.findById(req.session.selectedProfile.guideId).populate('childrenCollection');

            if (!guide) {
                return res.status(404).send("Guide non trouvé");
            }

            const error = req.query.error;
            const childId = req.query.childId;
            const rewardId = req.query.rewardId;

            res.render('pages/guideDashboard.twig', {
                guide: guide,
                title: "Guide Dashboard",
                error: error,
                childId: childId,
                rewardId: rewardId
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Erreur lors de la récupération des données.");
        }
    } else {
        res.redirect('/chooseProfile');
    }
});


guideRouter.post('/updatecomportement/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const action = req.body.action;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        if (action === 'increase') {
            child.comportement = Math.min(child.comportement + 2, 10);
        } else if (action === 'decrease') {
            child.comportement = Math.max(child.comportement - 2, 0);
        } else if (action === 'validate') {

            child.points += child.comportement;
            child.comportement = 0;
        }

        await child.save();

        res.redirect('/guideDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la mise à jour des points de comportement");
    }
});


guideRouter.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.render('pages/chooseProfile.twig', { error: "Erreur lors de la déconnexion" });
        }
        res.redirect('/login');
    });
});


module.exports = guideRouter