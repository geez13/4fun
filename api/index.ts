/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise((resolve, reject) => {
    (app as any)(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}