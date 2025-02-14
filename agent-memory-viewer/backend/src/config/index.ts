import 'dotenv/config';
import { validateEnv } from './env.validation.js';

export const config = validateEnv();
