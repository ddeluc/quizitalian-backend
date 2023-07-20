import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
    index: {
        type: Number,
        required: true,
    },
    original: {
        type: String,
        required: true
    },
    translation: {
        type: String,
        required: true
    },
})

export default cardSchema;