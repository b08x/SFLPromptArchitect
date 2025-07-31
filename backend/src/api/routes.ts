import { Router } from 'express';
import PromptController from './controllers/promptController';

const router = Router();

router.post('/prompts', PromptController.createPrompt);
router.get('/prompts', PromptController.getPrompts);
router.get('/prompts/:id', PromptController.getPromptById);
router.put('/prompts/:id', PromptController.updatePrompt);
router.delete('/prompts/:id', PromptController.deletePrompt);

export default router;
