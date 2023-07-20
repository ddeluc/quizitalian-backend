import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true
    },    
});

const Review = mongoose.model('reviews', reviewSchema);

export default Review;