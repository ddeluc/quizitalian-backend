import Module from "../models/module.js";
import User from "../models/user.js";
import Reverso from 'reverso-api';
import { commonVerbs, essereVerbs } from "../constants/index.js";

const reverso = new Reverso();

export const getModules = async (req, res) => {
    const { userId } = req.params;
    const modules = [];

    try {
        const user = await User.findOne({ _id: userId});
        const userModuleArray = user.modules;

        for (let i = 0; i < userModuleArray.length; i++) {
            const module = await Module.findOne({ _id: userModuleArray[i] })
            modules.push(module);
        }

        res.status(200).json(modules);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const deleteModule = async (req, res) => {
    const { id } = req.params;

    try {
        const moduleToDelete = await Module.findOne({ _id: id });
        
        const username = moduleToDelete.author;

        const user = await User.findOne({ username: username });
        let userModuleArray = user.modules;

        const index = userModuleArray.indexOf(id);
        if (index > -1) {
            userModuleArray.splice(index, 1);
        }

        User.updateOne({username: username}, {modules: userModuleArray},
                function (err, docs) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Updated : ", docs)
                }
            }
        )
        
        await Module.deleteOne({ _id: id })

        res.status(200).json({ message: "Success" });
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

export const updateModuleScore = async (req, res) => {
    const score = req.body.score;
    const quizType = req.body.quizType;
    console.log(req.body);

    const module = await Module.findById(req.params.id);
    let currentScore = module.quizScores[quizType];
    
    if (parseInt(currentScore.slice(0, currentScore.length-1)) < parseInt(score.slice(0, score.length-1))) {
        const newScores = { ...module.quizScores, [quizType]: score};
        
        let isComplete = true;

        for (const score in newScores) {
            if (newScores[score] != '100%')
                isComplete = false;
        }
        
        try {
            const data = await Module.findByIdAndUpdate(req.params.id, {$set: { quizScores: newScores, complete: isComplete}})
            
            res.status(200).json({ data: data });
        } catch (error) {
            res.status(404).json({ message: error.message })
        }
    } else {
        res.status(200).json({ message: "done"});
    }
}

export const getModule = async (req, res) => {
    const { id } = req.params;

    try {
        const module = await Module.findOne({ _id: id })
        
        res.status(200).json(module);
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

const conjugate = (infinitives) => {

    const promises = infinitives.map((e) => {
        return reverso.getConjugation(e, 'italian');
    })

    return Promise.allSettled(promises).then((results) => {
        let result = [];
        results.forEach((e) => {
            result.push(e);
        })

        return result;
    }).catch((error) => {
        console.log(error);
    })
}

const formatConjugation = (verb) => {
    console.log(verb);
    let auxType = 'avere';
    let isEssere = false;
    if (essereVerbs.includes(verb.value.infinitive)) {
        auxType = 'essere';
        isEssere = true;
    }    
    
    let formattedConjugation = {infinitive: verb.value.infinitive, conjugations: {}}
    verb.value.verbForms.forEach((element) => {
        
        switch(element.id) {
        case 4:
            element.verbs = appendAux(commonVerbs[auxType].indicativo.presente, element.verbs, isEssere);
            break;
        case 5:
            element.verbs = appendAux(commonVerbs[auxType].indicativo.imperfetto, element.verbs, isEssere);
            break;
        case 6:
            element.verbs = appendAux(commonVerbs[auxType].indicativo.passatoRemoto, element.verbs, isEssere);
            break;
        case 7:
            element.verbs = appendAux(commonVerbs[auxType].indicativo.futuroSemplice, element.verbs, isEssere);
            break;
        case 9:
            element.verbs = appendAux(commonVerbs[auxType].condizionale.presente, element.verbs, isEssere);
            break;
        case 11:
            element.verbs = appendAux(commonVerbs[auxType].gerundio.presente, element.verbs, isEssere);
        default:
            
        }

        formattedConjugation.conjugations[element.conjugation] = element.verbs;
    })

    return formattedConjugation;
}

const appendAux = (form, participle, isEssere) => {
    let par = participle[0];
    let result = [];
    form.forEach((verb, i) => {
      result.push(verb + ' ' + par)
      if (isEssere) {
        switch (i) {
          case 2:
            par = par.slice(0, -1) + 'a'
            result.push(verb + ' ' + par)
            par = par.slice(0, -1) + 'i'
            break;
          case 5:
            par = par.slice(0, -1) + 'e'
            result.push(verb + ' ' + par)
            break;
        }
      }
      
    })
    
    return result;
}

export const createModule = async (req, res) => {

    // Add Module
    const modText = req.body.text;
    const modTitle = req.body.title;
    const modTextList = req.body.textList;
    const modVerbList = req.body.verbList;
    const modAuthor = req.body.author;
    const modCards = req.body.cards;
    const modSentences = req.body.sentences;
    const translatedText = req.body.translatedText;

    const modConjugations = await conjugate(modVerbList);
    const modFormattedConjugations = [];
    

    try {
        if (modText.length < 100)    
            return res.status(400).json({ message: "Text must be at least 100 characters. "});

        if (modText.length > 400)
            return res.status(400).json({ message: "Text must be less than 400 characters."})

        if (modTitle.length < 5)    
            return res.status(400).json({ message: "Title must be at least 5 characters. "});

        if (modTitle.length > 25)    
            return res.status(400).json({ message: "Title must be at less than 25 characters. "});

        const existingModule = await Module.findOne({ title: modTitle });

        if (existingModule)
            return res.status(400).json({ message: "Module with this name already exists. "});

        const module = {
            title: modTitle,
            text: modText,
            author: modAuthor,
            cards: modCards,
            textList: modTextList,
            translatedText: translatedText,
            verbs: {
                infinitives: modVerbList, 
                conjugations: modFormattedConjugations
            },
            sentences: modSentences,
        }

        const newModule = new Module({ ...module })
    
        await newModule.save();
        User.updateOne({username: req.body.author}, {$push: { modules: newModule._id}},
                function (err, docs) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Updated : ", docs)
                }
            }
        )

        res.status(201).json(newModule);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}