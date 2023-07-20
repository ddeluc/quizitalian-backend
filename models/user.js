import mongoose from "mongoose";
import lemmaSchema from "./lemma.js";

const UserSchema = new mongoose.Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    modules: {
        type: [ String ],
        default: []
    },
    lemmas: {
        type: [lemmaSchema],
        required: true,
        default: []
    },
})

const User = mongoose.model('users', UserSchema);

export default User;