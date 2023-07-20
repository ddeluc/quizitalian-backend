import express from 'express';

import { 
    saveReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', saveReview);

export default router;