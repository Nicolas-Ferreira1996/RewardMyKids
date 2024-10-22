const guideRouter = require('express').Router();
const guideModel = require('../models/guideModel')
const childModel = require('../models/childModel');
const authguard = require("../services/authguard")
const bcrypt = require('bcrypt')


//nos routes

guideRouter.get('/home', (req, res) => {
    res.render('pages/home.twig', 
        {
            title: "Home"
        })
});

guideRouter.get('/subscribe', (req, res)=>{
    res.render('pages/subscribe.twig',
        {
            title: "Inscription"
        })
})


guideRouter.post('/subscribe', async(req, res) => {
    try {
        const guide = new guideModel(req.body); // Création de notre modèle utilisateur avec les données du formulaire (req.body)
        await guide.save(); // Si tout s'est bien passé, sauvegarde de notre nouvel utilisateur en base.
        res.redirect('/login') // Et redirection vers notre route /login grâce a la méthode de l'objet res, redirect()
    } catch (error) { // Si une erreur est détecté, nous renvoyons la vue subscribe avec l'erreur pour pouvoir les afficher.
        res.render('pages/subscribe.twig',
            {
                error: error.errors,
                title: "Inscription"
            })
    }
});

guideRouter.get('/login', (req,res)=>{
    res.render('pages/login.twig',
        {
            title: "Connexion"
        })
})

guideRouter.post('/login', async(req, res) => {
    try {
        let guide = await guideModel.findOne({ email: req.body.email }) // on recherche l'utilisateur
        if (guide) { // s'il existe
            if (await bcrypt.compare(req.body.password, guide.password)) { // on compare les mdp
                // Stocker l'ID du guide dans la session
                req.session.guideId = guide._id;
                req.session.guide = guide; // on stock l'utilisateur en session
                res.redirect('/chooseProfile');
            } else {
                throw {password: "Mauvais mot de passe"} // on relève l'exception mdp
            }
        } else {
            throw {email: "Ce guide des quêtes n'est pas enregistré"} //on releve l'exception si le guide des quêtes n'existe pas
        }
    } catch (error) {
        // on rend la vue connexion avec l'erreur
        res.render('pages/login.twig',
            {
                title: "Connexion",
                error : error
            })
    }
});

// Route pour afficher la page de sélection de profil
guideRouter.get('/chooseProfile', authguard, async (req, res) => {
    try {
        const guideId = req.session.guideId; // Assurez-vous d'avoir l'ID du guide dans la session
        const guide = await guideModel.findById(guideId).populate('childrenCollection');

        if (!guideId) {
            return res.redirect('/login'); // Redirige vers la page de connexion si l'ID est absent
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

// Route pour traiter la sélection du profil du guide avec mot de passe
guideRouter.post('/selectGuideProfile', authguard, async (req, res) => {
    const guideId = req.session.guideId;
    const enteredPassword = req.body.password;

    if (!guideId) {
        return res.redirect('/login'); // Si l'utilisateur n'est pas connecté
    }

    try {
        // Récupérer le guide depuis la base de données
        const guide = await guideModel.findById(guideId);

        if (!guide) {
            return res.status(404).send("Guide non trouvé");
        }

        // Vérification du mot de passe
        const passwordMatches = await bcrypt.compare(enteredPassword, guide.password);
        if (!passwordMatches) {
            // Rediriger vers la page de sélection avec un message d'erreur si le mot de passe est incorrect
            return res.render('pages/chooseProfile.twig', {
                guide,
                error: "Mot de passe incorrect" // Message d'erreur affiché dans le template
            });
        }

        // Si le mot de passe est correct, stocker le profil sélectionné dans la session
        req.session.selectedProfile = { role: 'guide', guideId: guideId };
        res.redirect('/guideDashboard'); // Redirige vers la page principale du guide

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la vérification du mot de passe.");
    }
});

// Route pour traiter la sélection d'un enfant
guideRouter.get('/selectProfile', authguard, (req, res) => {
    const role = req.query.role;

    if (role === 'guide') {
        // Le guide a été sélectionné
        req.session.selectedProfile = { role: 'guide', guideId: req.query.guideId };
        res.redirect('/guideDashboard'); // Redirige vers la page principale du guide

    } else if (role === 'child') {
        // Un enfant a été sélectionné
        const childId = req.query.childId; // Assurez-vous que childId est fourni dans la requête
        req.session.selectedProfile = { role: 'child', childId: childId };
        res.redirect(`/childDashboard/${childId}`); // Redirige vers la page principale de l'enfant
    } else {
        res.status(400).send("Sélection invalide");
    }
});


guideRouter.get('/guideDashboard', authguard, async (req, res) => {
    if (req.session.selectedProfile && req.session.selectedProfile.role === 'guide') {
        try {
            // Récupérer le guide avec la collection d'enfants via 'populate'
            const guide = await guideModel.findById(req.session.selectedProfile.guideId).populate('childrenCollection');

            if (!guide) {
                return res.status(404).send("Guide non trouvé");
            }

            // Récupérer les paramètres d'erreur
            const error = req.query.error; // Récupère l'erreur de la requête
            const childId = req.query.childId; // Récupère l'ID de l'enfant
            const rewardId = req.query.rewardId; // Récupère l'ID de la récompense

            // Rendre la page guideDashboard.twig avec les données du guide et des enfants
            res.render('pages/guideDashboard.twig', {
                guide: guide,  // Passer le guide et ses enfants au template
                title: "Guide Dashboard",
                error: error, // Passer le message d'erreur
                childId: childId, // Passer l'ID de l'enfant
                rewardId: rewardId // Passer l'ID de la récompense
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Erreur lors de la récupération des données.");
        }
    } else {
        res.redirect('/chooseProfile');
    }
});


// Route pour mettre à jour les points de comportement d'un enfant
guideRouter.post('/updatecomportement/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const action = req.body.action; // L'action définie dans le bouton "+" ou "-"
    const password = req.body.password; // Récupère le mot de passe du guide

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Mise à jour des points de comportement
        if (action === 'increase') {
            child.comportement = Math.min(child.comportement + 2, 10); // Augmente de 2 points, mais ne passe pas au dessus de 10
        } else if (action === 'decrease') {
            child.comportement = Math.max(child.comportement - 2, 0); // Diminue de 2, mais ne passe pas en dessous de 0
        }

         // Validation des points de comportement avec le mot de passe
         if (req.body.validate) {
            const guide = await guideModel.findById(req.session.guideId); // Récupère le guide actuel
            if (!guide) {
                return res.status(404).send("Guide non trouvé");
            }

            // Vérification du mot de passe
            const isMatch = await bcrypt.compare(password, guide.password);
            if (!isMatch) {
                return res.status(401).send("Mot de passe incorrect");
            }

            // Ajoute les points de comportement au total
            child.points += child.comportement;
            child.comportement = 0; // Réinitialise les points de comportement
        }

        await child.save(); // Sauvegarde les changements

        res.redirect('/guideDashboard'); // Redirige vers le tableau de bord après la mise à jour
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