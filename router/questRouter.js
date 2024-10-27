const questRouter = require('express').Router();
const guideModel = require('../models/guideModel');
const childModel = require('../models/childModel');
const authguard = require("../services/authguard");
const bcrypt = require('bcrypt')



questRouter.get('/addQuest/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const errorMessage = req.query.error;

        res.render('pages/addQuest.twig', {
            child,
            errorMessage,
            title: "Ajouter une Quête"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'affichage de la page d'ajout de quête.");
    }
});


questRouter.post('/saveQuest/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const questPoints = req.body.questPoints
    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        if (questPoints < 1 || questPoints > 100) {
            return res.redirect(`/addQuest/${childId}?error=Le nombre de points doit être compris entre 1 et 100`);
        }

        console.log(req.body);

        child.quests.push({
            questName: req.body.questName,
            questDescription: req.body.questDescription,
            questPoints: parseInt(questPoints),
        });

        await child.save();

        res.redirect(`/guideDashboard`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de la quête.");
    }
});


questRouter.post('/completeQuest/:childId/:questId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const questId = req.params.questId;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const quest = child.quests.id(questId);
        if (!quest) {
            return res.status(404).send("Quête non trouvée");
        }

        if (!quest.completed) {
            quest.completed = true;
            child.points += quest.questPoints;
        }

        await child.save();

        res.redirect(`/guideDashboard`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la validation de la quête.");
    }
});


questRouter.get('/editQuest/:childId', authguard, async (req, res) => {
    try {
        const child = await childModel.findById(req.params.childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const errorMessage = req.query.error || null;
        const errorQuestId = req.query.errorQuestId || null;

        res.render('pages/editQuest.twig', {
            child,
            errorMessage,
            errorQuestId,
            title: "Modifier une Quête"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des quêtes.");
    }
});


questRouter.post('/updateQuest/:childId/:questId', authguard, async (req, res) => {
    const { childId, questId } = req.params;
    const { questName, questDescription, questPoints } = req.body;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const quest = child.quests.id(questId);
        if (!quest) {
            return res.status(404).send("Quête non trouvée");
        }

        if (questPoints < 1 || questPoints > 100) {
            return res.redirect(`/editQuest/${childId}?error=Le nombre de points doit être compris entre 1 et 100&errorQuestId=${questId}`);
        }

        quest.questName = questName;
        quest.questDescription = questDescription;
        quest.questPoints = parseInt(questPoints);

        await child.save();

        res.redirect(`/editQuest/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification de la quête.");
    }
});


questRouter.post('/deleteQuest/:childId/:questId', authguard, async (req, res) => {
    const { childId, questId } = req.params;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        child.quests.pull(questId);

        await child.save();

        res.redirect(`/editQuest/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de la quête.");
    }
});


questRouter.get('/questCatalog/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        const quests = child.quests;

        res.render('pages/questCatalog.twig', {
            quests: quests,
            child: child,
            title: "Catalogue des Quêtes"
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du catalogue des quêtes:", error);
        res.status(500).send("Erreur lors de la récupération du catalogue des quêtes.");
    }
});


module.exports = questRouter