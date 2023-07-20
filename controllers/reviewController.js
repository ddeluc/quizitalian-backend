import mongoose from "mongoose";
import Review from "../models/review.js";

export const saveReview = async (req, res) => {

    try {
        const review = {
            review: req.body.review
        }

        const newReview = new Review({ ...review })
    
        await newReview.save();
        res.status(200).json({ message: 'Review save.', review: newReview });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. '});
    }
}