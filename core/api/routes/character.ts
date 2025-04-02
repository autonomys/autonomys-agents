import { Router } from 'express';
import { getCharacter } from '../controller/CharacterController.js';

export const createCharacterRouter = (): Router => {
  const router = Router();

  router.get('/character/name', getCharacter);

  return router;
};
