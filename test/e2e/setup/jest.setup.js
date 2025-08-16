import { resolve } from 'path';
import { config } from 'dotenv';

// Load the env that global-setup writes (backend/.env)
config({ path: resolve(process.cwd(), '.env') });

// Give extra time for first postgres pull
jest.setTimeout(60_000);
