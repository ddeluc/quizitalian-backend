import express from "express";

import {
    signIn,
    signUp,
    getLemmas,
    addLemmas,
    getLemma,
    updatePassword,
} from "../controllers/userController.js"

const router = express.Router();

router.post('/signin', signIn);
router.post('/signup', signUp);
router.patch('/updatepassword', updatePassword);
router.get('/lemmas/:userId', getLemmas);
router.patch('/lemmas/:userId', addLemmas)
router.get('/lemma/:userId/:lemma', getLemma);

export default router;