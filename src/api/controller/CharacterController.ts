import { config } from '../../config/index.js';
import { Request, Response } from 'express';
export const getCharacter = (req: Request, res: Response) => {
    const character = config.characterConfig.name;
    res.json({ character });
};