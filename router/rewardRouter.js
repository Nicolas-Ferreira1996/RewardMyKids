const rewardRouter = require('express').Router();
const guideModel = require('../models/guideModel')
const childModel = require('../models/childModel');
const authguard = require("../services/authguard")
const bcrypt = require('bcrypt')


rewardRouter.get('/addReward/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }
        res.render('pages/addReward.twig', {
            child,
            title: "Ajouter une récompense"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données de l'enfant.");
    }
});


rewardRouter.post('/saveReward/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const { rewardName, rewardDescription, rewardCost } = req.body;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        child.rewards.push({
            rewardName,
            rewardDescription,
            rewardCost: parseInt(rewardCost)
        });

        await child.save();
        res.redirect('/guideDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de la récompense.");
    }
});


rewardRouter.post('/purchaseReward/:childId/:rewardId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const rewardId = req.params.rewardId;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const reward = child.rewards.id(rewardId);
        if (!reward) {
            return res.status(404).send("Récompense non trouvée");
        }

        if (child.points < reward.rewardCost) {
            return res.redirect(`/guideDashboard?error=pointsInsuffisants&childId=${childId}&rewardId=${rewardId}`);
        }

        const guide = await guideModel.findById(req.session.guideId);
        if (!guide) {
            return res.status(404).send("Guide non trouvé");
        }

        child.points -= reward.rewardCost;

        reward.purchased = true;

        await child.save();
        res.redirect('/guideDashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'achat de la récompense.");
    }
});


rewardRouter.get('/editReward/:childId', authguard, async (req, res) => {
    const { childId } = req.params;
    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        res.render('pages/editReward.twig', {
            child,
            title: "Modifier une récompense"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données de l'enfant.");
    }
});


rewardRouter.post('/updateReward/:childId/:rewardId', authguard, async (req, res) => {
    const { childId, rewardId } = req.params;
    const { rewardName, rewardDescription, rewardCost } = req.body;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const reward = child.rewards.id(rewardId);
        if (!reward) {
            return res.status(404).send("Récompense non trouvée");
        }

        reward.rewardName = rewardName;
        reward.rewardDescription = rewardDescription;
        reward.rewardCost = parseInt(rewardCost);

        await child.save();

        res.redirect(`/editReward/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification de la récompense.");
    }
});


rewardRouter.post('/deleteReward/:childId/:rewardId', authguard, async (req, res) => {
    const { childId, rewardId } = req.params;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        child.rewards.pull(rewardId);

        await child.save();

        res.redirect(`/editReward/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de la récompense.");
    }
});


rewardRouter.get('/rewardCatalog/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const rewards = child.rewards;

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