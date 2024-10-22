const questRouter = require('express').Router();
const guideModel = require('../models/guideModel')
const childModel = require('../models/childModel');
const authguard = require("../services/authguard")
const bcrypt = require('bcrypt')


// Route pour afficher la page d'ajout de quête pour un enfant spécifique
questRouter.get('/addQuest/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Récupérer le message d'erreur s'il existe
        const errorMessage = req.query.error;

        res.render('pages/addQuest.twig', {
            child,
            errorMessage, // Passe le message d'erreur au template
            title: "Ajouter une Quête"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'affichage de la page d'ajout de quête.");
    }
});


// Route POST pour sauvegarder une quête
questRouter.post('/saveQuest/:childId', authguard, async (req, res) => {
    const childId = req.params.childId;
    const questPoints = req.body.questPoints
    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Validation manuelle des points (entre 1 et 100)
        if (questPoints < 1 || questPoints > 100) {
            return res.redirect(`/addQuest/${childId}?error=Le nombre de points doit être compris entre 1 et 100`);
        }

        console.log(req.body);

        // Ajouter la quête à l'enfant (ajoute dans le tableau de quêtes de l'enfant)
        child.quests.push({ 
            questName: req.body.questName, 
            questDescription: req.body.questDescription,
            questPoints: parseInt(questPoints),  // Points pour la quête
        });
        
        await child.save(); // Sauvegarde dans la base de données

        res.redirect(`/guideDashboard`); // Redirige vers le tableau de bord du guide après l'ajout
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

        // Trouver la quête par son ID et la marquer comme terminée
        const quest = child.quests.id(questId); // Utilise Mongoose pour trouver la quête dans le tableau
        if (!quest) {
            return res.status(404).send("Quête non trouvée");
        }

        if (!quest.completed) {
            // Marquer la quête comme terminée et ajouter les points
            quest.completed = true;
            child.points += quest.questPoints;  // Ajouter les points de la quête au total de l'enfant
        }

        await child.save(); // Sauvegarder les changements

        res.redirect(`/guideDashboard`); // Redirige vers le tableau de bord après validation
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la validation de la quête.");
    }
});


// Route pour afficher la page d'édition des quêtes d'un enfant
questRouter.get('/editQuest/:childId', authguard, async (req, res) => {
    try {
        const child = await childModel.findById(req.params.childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Récupérer le message d'erreur et l'ID de la quête depuis les paramètres de la requête
        const errorMessage = req.query.error || null;
        const errorQuestId = req.query.errorQuestId || null;

        // Rendre la page avec les informations de l'enfant, le message d'erreur et l'ID de la quête concernée
        res.render('pages/editQuest.twig', {
            child,
            errorMessage, // Passer l'erreur au template
            errorQuestId, // Passer l'ID de la quête qui contient l'erreur
            title: "Modifier une Quête"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des quêtes.");
    }
});


// Route pour traiter la modification de la quête
questRouter.post('/updateQuest/:childId/:questId', authguard, async (req, res) => {
    const { childId, questId } = req.params;
    const { questName, questDescription, questPoints } = req.body;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Trouver la quête par son ID
        const quest = child.quests.id(questId);
        if (!quest) {
            return res.status(404).send("Quête non trouvée");
        }

        // Validation manuelle des points (entre 1 et 100)
        if (questPoints < 1 || questPoints > 100) {
            // Ajout de l'ID de la quête et du message d'erreur dans l'URL
            return res.redirect(`/editQuest/${childId}?error=Le nombre de points doit être compris entre 1 et 100&errorQuestId=${questId}`);
        }

        // Mettre à jour les informations de la quête
        quest.questName = questName;
        quest.questDescription = questDescription;
        quest.questPoints = parseInt(questPoints);

        await child.save(); // Sauvegarder les changements dans la base de données

        // Rediriger vers la même page pour continuer l'édition après modification
        res.redirect(`/editQuest/${childId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification de la quête.");
    }
});


// Route pour supprimer une quête
questRouter.post('/deleteQuest/:childId/:questId', authguard, async (req, res) => {
    const { childId, questId } = req.params;

    try {
        const child = await childModel.findById(childId);
        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Utiliser la méthode pull pour supprimer la quête par son ID
        child.quests.pull(questId); // Retire l'ID de la quête du tableau

        await child.save(); // Sauvegarder les changements après suppression

        res.redirect(`/editQuest/${childId}`); // Redirige vers la page d'édition après la suppression
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de la quête.");
    }
});


// Route pour accéder au catalogue des quêtes pour l'enfant
questRouter.get('/questCatalog/:childId', authguard, async (req, res) => {
    try {
        const childId = req.params.childId;

        // Rechercher l'enfant par son ID pour s'assurer qu'il existe
        const child = await childModel.findById(childId);

        if (!child) {
            return res.status(404).send("Enfant non trouvé");
        }

        // Récupérer les quêtes de cet enfant
        const quests = child.quests; // Utiliser l'attribut quests de l'enfant


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