import express from 'express';

import {
    getModules,
    createModule,
    getModule,
    deleteModule,
    updateModuleScore,
} from "../controllers/moduleController.js"

const router = express.Router();

router.get('/:userId', getModules);
router.get('/:username/:id', getModule);
router.delete('/:id', deleteModule);
router.post('/', createModule);
router.patch('/:id', updateModuleScore);

export default router;