const rewardRouter = require('express').Router();
const guideModel = require('../models/guideModel')
const childModel = require('../models/childModel');
const authguard = require("../services/authguard")
const bcrypt = require('bcrypt')

// Route pour afficher la page d'ajout de récompense pour un enfant spécifique
rewardRouter.get('/addReward/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    try {
        const child = await childModel.findById(childId); // Récupère l'enfant par son ID
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }
        res.render('pages/addReward.twig', { 
            child,
            title: "Ajouter une récompense"
        }); // Affiche la page pour ajouter une récompense

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données de l'enfant.");
    }
});

// Route pour sauvegarder une récompense
rewardRouter.post('/saveReward/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const { rewardName, rewardDescription, rewardCost } = req.body; // récupérez les données du formulaire

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Ajoutez la récompense au tableau `rewards` de l'enfant
        child.rewards.push({
            rewardName,
            rewardDescription,
            rewardCost: parseInt(rewardCost) // S'assurer que le coût est un nombre
        });

        await child.save(); // Sauvegardez les modifications apportées à l'enfant
        res.redirect('/guideDashboard'); // Redirige vers le tableau de bord
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de la récompense.");
    }
});

// Route pour acheter une récompense
rewardRouter.post('/purchaseReward/:childId/:rewardId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const rewardId = req.params.rewardId;
    const password = req.body.password; // Récupère le mot de passe

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const reward = child.rewards.id(rewardId); // Trouver la récompense par son ID
        if (!reward) {
            return res.status(404).send("Récompense non trouvée");
        }

        // Vérifier si l'enfant a assez de points
        if (child.points < reward.rewardCost) {
            // Rediriger vers le tableau de bord avec un message d'erreur
            return res.redirect(`/guideDashboard?error=pointsInsuffisants&childId=${childId}&rewardId=${rewardId}`);
        }

        const guide = await guideModel.findById(req.session.guideId); // Récupérer le guide
        if (!guide) {
            return res.status(404).send("Guide non trouvé");
        }

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(password, guide.password);
        if (!isMatch) {
            return res.status(401).send("Mot de passe incorrect");
        }

        // Si le mot de passe est correct, soustraire le coût de la récompense des points de l'enfant
        child.points -= reward.rewardCost;

        // Marquer la récompense comme achetée
        reward.purchased = true;

        await child.save(); // Sauvegardez les changements
        res.redirect('/guideDashboard'); // Redirige vers le tableau de bord
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'achat de la récompense.");
    }
});


// Route pour afficher la page d'édition des Récompenses d'un enfant
rewardRouter.get('/editReward/:childId', authguard, async (req, res) => {
    const { childId } = req.params;
    try {
        const child = await childModel.findById(childId); // Récupérer l'enfant avec toutes ses Récompenses
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Rendre la vue editReward.twig avec l'enfant et ses récompenses
        res.render('pages/editReward.twig', {
             child,
             title: "Modifier une récompense"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données de l'enfant.");
    }
});


// Route pour traiter la modification de la récompense
rewardRouter.post('/updateReward/:childId/:rewardId', authguard, async (req, res) => {
    const { childId, rewardId } = req.params;
    const { rewardName, rewardDescription, rewardCost } = req.body; // Récupérer les données du formulaire

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Trouver la récompense par son ID
        const reward = child.rewards.id(rewardId);
        if (!reward) {
            return res.status(404).send("Récompense non trouvée");
        }

        // Mettre à jour les informations de la récompense
        reward.rewardName = rewardName;
        reward.rewardDescription = rewardDescription;
        reward.rewardCost = parseInt(rewardCost);

        await child.save(); // Sauvegarder les changements dans la base de données

        // Rediriger vers la même page pour continuer l'édition après modification
        res.redirect(`/editReward/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification de la récompense.");
    }
});

// Route pour supprimer une récompense
rewardRouter.post('/deleteReward/:childId/:rewardId', authguard, async (req, res) => {
    const { childId, rewardId } = req.params;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Utiliser la méthode pull pour supprimer la récompense par son ID
        child.rewards.pull(rewardId); // Retire l'ID de la récompense du tableau

        await child.save(); // Sauvegarder les changements après suppression

        res.redirect(`/editReward/${childId}`); // Redirige vers la page d'édition après la suppression
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de la récompense.");
    }
});


// Route pour accéder au catalogue des récompenses pour l'enfant
rewardRouter.get('/rewardCatalog/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        // Rechercher l'enfant par son ID pour s'assurer qu'il existe
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Récupérer les quêtes de cet enfant
        const rewards = child.rewards; // Utiliser l'attribut rewards de l'enfant

        res.render('pages/rewardCatalog.twig', {
            rewards: rewards,
            child: child,
            title: "Catalogue des Récompenses"
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du catalogue des récompenses:", error);
        res.status(500).send("Erreur lors de la récupération du catalogue des récompenses.");
    }
});



module.exports = rewardRouter