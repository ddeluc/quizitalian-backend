// import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from "../models/user.js"

export const signIn = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });

        if (!existingUser)
            return res.status(404).json({ message: "User doesn't exist. " });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect)
            return res.status(400).json({ message: "Invalid credentials. "});

        const token = jwt.sign({ email: existingUser.username, id: existingUser._id }, 'userToken', { expiresIn: "1h" });

        res.status(200).json({ result: existingUser, token: token});
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. '});
    }
}

const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
  

export const signUp = async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    try {
        const existingUser = await User.findOne({ username })

        if (!validateEmail(username))
            return res.status(400).json({ message: "Not a valid Email. "})

        if (username.length < 5)
            return res.status(400).json({ message: "Username is not long enough. "})

        if (password.length < 8)
            return res.status(400). json({ message: "Password is not long enough. "})

        if (existingUser)
            return res.status(400).json({ message: "User already exists. "});

        if (password != confirmPassword)
            return res.status(400).json({ message: "Passwords don't match. "});
            
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const result = await User.create({ username: username, password: hashedPassword});

        const token = jwt.sign({ username: result.username, id: result._id }, 'test', {expiresIn: "1h" });
        
        console.log("passed");
        res.status(200).json({ result: result, token: token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. '});
    }
}

export const updatePassword = async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    console.log(req.body);

    try {
        if (password.length < 8)
            return res.status(400). json({ message: "Password is not long enough. "})

        if (password != confirmPassword)
            return res.status(400).json({ message: "Passwords don't match. "});
            
        const hashedPassword = await bcrypt.hash(password, 12);

        const updatedUser = await User.findOneAndUpdate({username: email}, {$set: {password: hashedPassword}});
                
        res.status(200).json({ result: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. '});
    }
    

}

export const getLemmas = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ _id: userId});
        const lemmasArray = user.lemmas;

        res.status(200).json(lemmasArray);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getLemma = async (req, res) => {
    const { userId, lemma } = req.params;
    console.log(lemma);
    console.log(userId);

    try {
        const user = await User.findOne({ _id: userId });
        const lemmasArray = user.lemmas;

        const match = lemmasArray.filter(item => item.original == lemma);

        res.status(200).json(match);
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

export const addLemmas = async (req, res) => {
    const { userId } = req.params;
    const { lemmas } = req.body;

    try {
        const data = await User.findByIdAndUpdate(userId, {$set: { lemmas: lemmas}})
        
        res.status(200).json({ data: data });
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}