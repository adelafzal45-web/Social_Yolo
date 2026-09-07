import { config } from 'dotenv';

/**
 * Loads `.env` (backend root) into `process.env`.
 *
 * Import this before anything that reads `process.env` at module scope —
 * `image-service.config.ts` relies on it, and `main.ts` imports it on its
 * first line so the image-service settings are populated before any module
 * is evaluated.
 *
 * Variables already present in the real environment win over the file —
 * that is dotenv's default and what we want.
 */
config();
