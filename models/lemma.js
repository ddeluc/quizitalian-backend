import mongoose from "mongoose";

const lemmaSchema = new mongoose.Schema({
    original: {
        type: String,
        required: true
    },
    pos: {
        type: String,
        required: true,
    }, 
    translation: {
        type: String,
        required: true
    },
    sentences: {
        type: [ Object ],
        required: true,
        default: [],
    }
})

export default lemmaSchema;