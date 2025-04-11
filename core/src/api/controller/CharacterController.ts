import { Request, Response } from 'express';

export const getCharacter = (characterName: string) => (req: Request, res: Response) => {
  res.json({ character: characterName });
};
