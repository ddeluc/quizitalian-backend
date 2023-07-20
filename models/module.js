import mongoose from 'mongoose';
import cardSchema from './card.js';

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        default: "User"
    },
    createdAt: {
        type: Date,
        immutable: true,
        deafult: () => Date.now()
    },
    text: {
        type: String,
        required: true
    },
    cards: {
        type: {
            prepositions: [cardSchema],
            nouns: [cardSchema],
            adjectives: [cardSchema],
            infinitives: [cardSchema],
        },
        default: null
    },
    textList: {
        type: [String],
        required: true,
    },
    verbs: {
        type: {
            infinitives: [String], 
            conjugations: [Object]
        },
        required: true,
        default: []
    },
    translatedText: {
        type: String,
        required: true,
        default: "",
    },
    quizScores: {
        type: Object,
        required: true,
        default: {
            [0]: '0%',
            [1]: '0%',
            [2]: '0%',
            [3]: '0%',
            [4]: '0%',
        }
    },
    complete: {
        type: Boolean,
        required: true,
        default: false,
    },
    sentences: {
        type: [Object],
        required: true,
        default: []
    },
})

const Module = mongoose.model('quiz_modules', moduleSchema);

export default Module;