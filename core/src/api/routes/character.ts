import { Router } from 'express';
import { getCharacter } from '../controller/CharacterController.js';

export const createCharacterRouter = (characterName: string): Router => {
  const router = Router();

  router.get('/character/name', getCharacter(characterName));

  return router;
};
